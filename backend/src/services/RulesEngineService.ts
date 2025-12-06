/**
 * Rules Engine Service
 * Select the best set of retention steps for each user
 * Per backend-services.md specification
 */

import { Op } from 'sequelize';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Flow, { FlowAttributes } from '../models/Flow';
import { getActiveFlowForUser } from './FlowService';

export type UserSegment = 'high_value' | 'medium_value' | 'low_value' | 'trial' | 'new';

export interface UserContext {
  userId: number;
  plan?: string | null;
  monthlyValue?: number | null;
  region?: string | null;
  churnScore?: number;
  cancelAttempts?: number;
}

export interface OfferRanking {
  type: 'pause' | 'downgrade' | 'discount' | 'support';
  priority: number;
  reason: string;
}

/**
 * Segment user into category based on attributes
 * @param user User record
 * @param subscription Subscription record (optional)
 * @returns User segment
 */
export async function segmentUser(
  user: User,
  subscription?: Subscription | null
): Promise<UserSegment> {
  // Get subscription if not provided
  if (!subscription) {
    subscription = await Subscription.findOne({ where: { userId: user.id } });
  }

  // Check if trial user (no subscription or very low value)
  if (!subscription || !subscription.value || subscription.value < 1) {
    return 'trial';
  }

  const monthlyValue = subscription.value || 0;

  // High value: > $100/month
  if (monthlyValue >= 100) {
    return 'high_value';
  }

  // Medium value: $20-$100/month
  if (monthlyValue >= 20) {
    return 'medium_value';
  }

  // Low value: < $20/month
  return 'low_value';
}

/**
 * Match flow to user segment
 * @param segment User segment
 * @param language Language code (default: 'en')
 * @returns Flow record or null
 */
export async function matchFlowToSegment(
  segment: UserSegment,
  language: string = 'en'
): Promise<Flow | null> {
  // For now, get the highest-ranked active flow
  // In future, flows can be tagged with segments
  const flow = await Flow.findOne({
    where: {
      language,
      rankingScore: {
        [Op.gt]: 0,
      },
    },
    order: [['rankingScore', 'DESC']],
    limit: 1,
  });

  return flow;
}

/**
 * Rank offers by baseline rules
 * Higher priority = shown first
 * @param offers Array of offer types
 * @param userContext User context (plan, value, region, etc.)
 * @returns Ranked offers array
 */
export async function rankOffersByBaseRules(
  offers: Array<'pause' | 'downgrade' | 'discount' | 'support'>,
  userContext: UserContext
): Promise<OfferRanking[]> {
  const rankings: OfferRanking[] = [];

  const monthlyValue = userContext.monthlyValue || 0;
  const plan = userContext.plan?.toLowerCase() || '';
  const cancelAttempts = userContext.cancelAttempts || 0;

  // Rule 1: High-value users (> $100/month) → Show discount first
  if (monthlyValue >= 100) {
    if (offers.includes('discount')) {
      rankings.push({
        type: 'discount',
        priority: 1,
        reason: 'High-value user - discount most effective',
      });
    }
    if (offers.includes('pause')) {
      rankings.push({
        type: 'pause',
        priority: 2,
        reason: 'High-value user - pause as backup',
      });
    }
    if (offers.includes('downgrade')) {
      rankings.push({
        type: 'downgrade',
        priority: 3,
        reason: 'High-value user - downgrade last resort',
      });
    }
  }
  // Rule 2: Medium-value users ($20-$100/month) → Show pause first
  else if (monthlyValue >= 20) {
    if (offers.includes('pause')) {
      rankings.push({
        type: 'pause',
        priority: 1,
        reason: 'Medium-value user - pause preserves revenue',
      });
    }
    if (offers.includes('discount')) {
      rankings.push({
        type: 'discount',
        priority: 2,
        reason: 'Medium-value user - discount as alternative',
      });
    }
    if (offers.includes('downgrade')) {
      rankings.push({
        type: 'downgrade',
        priority: 3,
        reason: 'Medium-value user - downgrade last resort',
      });
    }
  }
  // Rule 3: Low-value users (< $20/month) → Show downgrade first
  else {
    if (offers.includes('downgrade')) {
      rankings.push({
        type: 'downgrade',
        priority: 1,
        reason: 'Low-value user - downgrade maintains engagement',
      });
    }
    if (offers.includes('pause')) {
      rankings.push({
        type: 'pause',
        priority: 2,
        reason: 'Low-value user - pause as alternative',
      });
    }
    if (offers.includes('discount')) {
      rankings.push({
        type: 'discount',
        priority: 3,
        reason: 'Low-value user - discount less effective',
      });
    }
  }

  // Rule 4: Multiple cancel attempts → Show support first
  if (cancelAttempts > 1) {
    if (offers.includes('support')) {
      rankings.unshift({
        type: 'support',
        priority: 0, // Highest priority
        reason: 'Multiple cancel attempts - support needed',
      });
    }
  } else if (offers.includes('support')) {
    // Support always available but lower priority for first attempt
    rankings.push({
      type: 'support',
      priority: 99,
      reason: 'Support available',
    });
  }

  // Sort by priority (lower = higher priority)
  rankings.sort((a, b) => a.priority - b.priority);

  return rankings;
}

/**
 * Get best flow for user
 * Combines segmentation, flow matching, and offer ranking
 * @param userId User ID
 * @returns Flow with ranked offers
 */
export async function getBestFlowForUser(userId: number): Promise<{
  flow: Flow | null;
  segment: UserSegment;
  offerRankings: OfferRanking[];
}> {
  // Get user and subscription
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const subscription = await Subscription.findOne({ where: { userId } });

  // Segment user
  const segment = await segmentUser(user, subscription);

  // Match flow to segment
  const flow = await matchFlowToSegment(segment, user.language || 'en');

  // Get offer rankings
  const userContext: UserContext = {
    userId: user.id,
    plan: user.plan,
    monthlyValue: subscription?.value || null,
    region: user.region,
    churnScore: user.churnScore,
    cancelAttempts: subscription?.cancelAttempts || 0,
  };

  // Extract offer types from flow steps (if flow exists)
  const offerTypes: Array<'pause' | 'downgrade' | 'discount' | 'support'> = [];
  if (flow && flow.steps) {
    const steps = flow.steps as any[];
    steps.forEach(step => {
      if (['pause', 'downgrade', 'discount', 'support'].includes(step.type)) {
        offerTypes.push(step.type);
      }
    });
  }

  // If no flow or no offers in flow, use default offers
  const offers = offerTypes.length > 0
    ? offerTypes
    : ['pause', 'downgrade', 'discount', 'support'];

  const offerRankings = await rankOffersByBaseRules(offers, userContext);

  return {
    flow,
    segment,
    offerRankings,
  };
}

