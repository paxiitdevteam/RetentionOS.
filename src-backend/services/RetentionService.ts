/**
 * Retention Service (Core)
 * Main logic that drives the entire cancel interception system
 * Per backend-services.md specification
 */

import { findOrCreateUser } from './UserService';
import {
  getSubscriptionByUserId,
  createOrUpdateSubscription,
  incrementCancelAttempts,
  applyPause,
  applyDowngrade,
  applyDiscount,
} from './SubscriptionService';
import { getBestFlowForUser, rankOffersByBaseRules } from './RulesEngineService';
import { getFlowById, calculateFlowRanking } from './FlowService';
import {
  logCancelAttempt,
  logOfferShown,
  logOfferDecision,
  logChurnReason,
} from './EventLoggingService';
import Flow from '../models/Flow';
import Subscription from '../models/Subscription';
import User from '../models/User';
import OfferEvent from '../models/OfferEvent';

export interface StartRetentionFlowResult {
  flowId: number;
  steps: any[];
  language: string;
  segment?: string;
}

export interface ProcessDecisionResult {
  success: boolean;
  message: string;
  revenueSaved?: number;
  subscriptionUpdated?: boolean;
}

/**
 * Start retention flow for a user
 * @param externalUserId External user ID from SaaS product
 * @param plan User subscription plan
 * @param region User geographic region
 * @param email User email (optional)
 * @param stripeSubscriptionId Stripe subscription ID (optional)
 * @param subscriptionValue Monthly subscription value (optional)
 * @returns Flow data with steps
 */
export async function startRetentionFlow(
  externalUserId: string,
  plan: string,
  region: string,
  email?: string,
  stripeSubscriptionId?: string,
  subscriptionValue?: number
): Promise<StartRetentionFlowResult> {
  // Find or create user
  const user = await findOrCreateUser(externalUserId, email, plan, region);

  // Get or create subscription
  let subscription = await getSubscriptionByUserId(user.id);
  if (!subscription) {
    subscription = await createOrUpdateSubscription(
      user.id,
      stripeSubscriptionId || null,
      subscriptionValue || null,
      'active'
    );
  } else {
    // Update subscription if new data provided
    if (stripeSubscriptionId) {
      await subscription.update({ stripeSubscriptionId });
    }
    if (subscriptionValue !== undefined) {
      await subscription.update({ value: subscriptionValue });
    }
  }

  // Get best flow for user using Rules Engine
  const { flow, segment, offerRankings } = await getBestFlowForUser(user.id);

  if (!flow) {
    throw new Error('No active flow found for user');
  }

  // Log cancel attempt
  await logCancelAttempt(user.id, flow.id);

  // Increment cancel attempts
  await incrementCancelAttempts(subscription.id);

  // Get flow steps and apply ranking
  const flowSteps = flow.steps as any[];
  
  // Reorder steps based on offer rankings if available
  let orderedSteps = flowSteps;
  if (offerRankings && offerRankings.length > 0) {
    // Sort steps by offer ranking priority
    orderedSteps = flowSteps.sort((a, b) => {
      const aRank = offerRankings.find(r => r.type === a.type);
      const bRank = offerRankings.find(r => r.type === b.type);
      const aPriority = aRank ? aRank.priority : 999;
      const bPriority = bRank ? bRank.priority : 999;
      return aPriority - bPriority;
    });
  }

  return {
    flowId: flow.id,
    steps: orderedSteps,
    language: flow.language,
    segment,
  };
}

/**
 * Process user decision on an offer
 * @param flowId Flow ID
 * @param offerType Type of offer (pause, downgrade, discount, support)
 * @param accepted Whether user accepted the offer
 * @param userId User ID (optional, will be looked up from flow if not provided)
 * @param revenueValue Monthly revenue value (for calculating saved revenue)
 * @param reasonCode Churn reason code if rejected (optional)
 * @param reasonText Churn reason text if rejected (optional)
 * @returns Processing result
 */
export async function processUserDecision(
  flowId: number,
  offerType: string,
  accepted: boolean,
  userId?: number,
  revenueValue?: number,
  reasonCode?: string,
  reasonText?: string
): Promise<ProcessDecisionResult> {
  // Get flow
  const flow = await getFlowById(flowId);
  if (!flow) {
    throw new Error('Flow not found');
  }

  // Get user if not provided
  let user: User | null = null;
  if (userId) {
    user = await User.findByPk(userId);
  } else {
    // Try to get from most recent offer event for this flow
    const recentEvent = await OfferEvent.findOne({
      where: { flowId },
      order: [['createdAt', 'DESC']],
    });
    if (recentEvent && recentEvent.userId) {
      user = await User.findByPk(recentEvent.userId);
    }
  }

  if (!user) {
    throw new Error('User not found');
  }

  // Get subscription
  const subscription = await getSubscriptionByUserId(user.id);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Calculate revenue saved (if accepted)
  let revenueSaved: number | null = null;
  if (accepted && revenueValue) {
    // For pause: save full monthly value
    if (offerType === 'pause') {
      revenueSaved = revenueValue;
    }
    // For discount: save discount amount
    else if (offerType === 'discount') {
      // Assume 20% discount (can be made configurable)
      revenueSaved = revenueValue * 0.2;
    }
    // For downgrade: save difference between plans
    else if (offerType === 'downgrade') {
      // Assume 30% reduction (can be made configurable)
      revenueSaved = revenueValue * 0.3;
    }
    // For support: minimal revenue saved (user stays)
    else if (offerType === 'support') {
      revenueSaved = revenueValue; // Full value saved
    }
  }

  // Log offer shown (if not already logged)
  await logOfferShown(flowId, offerType, user.id);

  // Log decision
  await logOfferDecision(
    user.id,
    flowId,
    offerType,
    accepted,
    revenueSaved
  );

  // Process decision
  let subscriptionUpdated = false;
  let message = '';

  if (accepted) {
    // Apply the offer action
    switch (offerType) {
      case 'pause':
        await applyPause(subscription.id);
        message = 'Subscription paused successfully';
        subscriptionUpdated = true;
        break;

      case 'downgrade':
        // Get new plan from flow step config (if available)
        const downgradeStep = (flow.steps as any[]).find(s => s.type === 'downgrade');
        // Get user plan
        const userPlan = user.plan || 'basic';
        const newPlan = downgradeStep?.config?.newPlan || `${userPlan}_downgrade`;
        await applyDowngrade(subscription.id, newPlan);
        message = 'Subscription downgraded successfully';
        subscriptionUpdated = true;
        break;

      case 'discount':
        // Get discount percent from flow step config (if available)
        const discountStep = (flow.steps as any[]).find(s => s.type === 'discount');
        const discountPercent = discountStep?.config?.percent || 20;
        await applyDiscount(subscription.id, discountPercent);
        message = `Discount of ${discountPercent}% applied successfully`;
        subscriptionUpdated = true;
        break;

      case 'support':
        message = 'Support team will contact you shortly';
        subscriptionUpdated = false; // Support doesn't change subscription
        break;

      default:
        message = 'Offer processed';
    }
  } else {
    // User rejected offer - log churn reason
    if (reasonCode) {
      await logChurnReason(user.id, reasonCode, reasonText, flowId);
    }
    message = 'Offer declined';
  }

  // Update flow ranking (async, don't wait)
  calculateFlowRanking(flowId).catch(err => {
    console.error('Failed to update flow ranking:', err);
  });

  return {
    success: accepted,
    message,
    revenueSaved: revenueSaved || undefined,
    subscriptionUpdated,
  };
}

