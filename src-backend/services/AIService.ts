/**
 * AI Service
 * Churn risk prediction, offer recommendations, and message suggestions
 * Per ai-engine.md specification
 */

import { Op } from 'sequelize';
import User from '../models/User';
import Subscription from '../models/Subscription';
import OfferEvent from '../models/OfferEvent';
import AIWeight from '../models/AIWeight';
import OfferPerformance from '../models/OfferPerformance';
import MessagePerformance from '../models/MessagePerformance';
import { UserSegment, segmentUser } from './RulesEngineService';

export interface ChurnRiskResult {
  score: number; // 0-100
  factors: {
    behavior: number;
    value: number;
    history: number;
    cancelAttempts: number;
  };
  segment: UserSegment;
  explanation: string;
}

export interface OfferRecommendation {
  offerType: 'pause' | 'downgrade' | 'discount' | 'support';
  confidence: number; // 0-100
  reason: string;
  expectedAcceptanceRate: number;
}

export interface MessageSuggestion {
  message: string;
  template: string;
  personalization: Record<string, any>;
}

/**
 * Initialize default AI weights if they don't exist
 */
export async function initializeAIWeights(): Promise<void> {
  const defaultWeights = [
    { weightName: 'behavior_weight', weightValue: 0.4, description: 'Weight for behavioral factors' },
    { weightName: 'value_weight', weightValue: 0.3, description: 'Weight for user value factors' },
    { weightName: 'history_weight', weightValue: 0.2, description: 'Weight for historical factors' },
    { weightName: 'cancel_attempts_weight', weightValue: 0.1, description: 'Weight for cancel attempts' },
  ];

  for (const weight of defaultWeights) {
    await AIWeight.findOrCreate({
      where: { weightName: weight.weightName },
      defaults: weight,
    });
  }
}

/**
 * Get AI weight value
 */
async function getWeight(name: string): Promise<number> {
  const weight = await AIWeight.findOne({ where: { weightName: name } });
  return weight ? parseFloat(weight.weightValue.toString()) : 1.0;
}

/**
 * Calculate churn risk score for a user
 * @param userId User ID
 * @returns Churn risk result with score and factors
 */
export async function calculateChurnRisk(userId: number): Promise<ChurnRiskResult> {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Get user subscription
  const subscription = await Subscription.findOne({ where: { userId } });

  // Get user segment
  const segment = await segmentUser(user, subscription);

  // Get weights
  const behaviorWeight = await getWeight('behavior_weight');
  const valueWeight = await getWeight('value_weight');
  const historyWeight = await getWeight('history_weight');
  const cancelAttemptsWeight = await getWeight('cancel_attempts_weight');

  // Factor 1: Behavior (cancel attempts, recent activity)
  const cancelAttempts = subscription?.cancelAttempts || 0;
  const behaviorScore = Math.min(cancelAttempts * 20, 100); // Each attempt = 20 points, max 100

  // Factor 2: Value (subscription value, plan tier)
  const subscriptionValue = subscription?.value || 0;
  const valueScore = subscriptionValue > 50 ? 30 : subscriptionValue > 20 ? 50 : 70; // Higher value = lower risk

  // Factor 3: History (past offer interactions)
  const offerHistory = await OfferEvent.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit: 10,
  });

  let historyScore = 50; // Default neutral
  if (offerHistory.length > 0) {
    const acceptedCount = offerHistory.filter(e => e.accepted).length;
    const acceptanceRate = (acceptedCount / offerHistory.length) * 100;
    // Lower acceptance rate = higher churn risk
    historyScore = 100 - acceptanceRate;
  } else {
    // No history = new user = lower risk
    historyScore = 30;
  }

  // Factor 4: Cancel attempts (direct indicator)
  const cancelAttemptsScore = Math.min(cancelAttempts * 25, 100);

  // Calculate weighted risk score
  const riskScore = Math.round(
    (behaviorScore * behaviorWeight) +
    (valueScore * valueWeight) +
    (historyScore * historyWeight) +
    (cancelAttemptsScore * cancelAttemptsWeight)
  );

  // Clamp to 0-100
  const finalScore = Math.max(0, Math.min(100, riskScore));

  // Update user's churn score in database (async, don't wait)
  user.update({ churnScore: finalScore }).catch(err => {
    console.error('Failed to update user churn score:', err);
  });

  // Generate explanation
  const explanations: string[] = [];
  if (cancelAttempts > 0) {
    explanations.push(`${cancelAttempts} previous cancel attempt(s)`);
  }
  if (subscriptionValue > 0) {
    explanations.push(`$${subscriptionValue}/month subscription`);
  }
  if (offerHistory.length > 0) {
    const acceptedCount = offerHistory.filter(e => e.accepted).length;
    explanations.push(`${acceptedCount}/${offerHistory.length} past offers accepted`);
  }
  if (explanations.length === 0) {
    explanations.push('New user with no history');
  }

  return {
    score: finalScore,
    factors: {
      behavior: behaviorScore,
      value: valueScore,
      history: historyScore,
      cancelAttempts: cancelAttemptsScore,
    },
    segment,
    explanation: explanations.join(', '),
  };
}

/**
 * Recommend best offer for a user
 * @param userId User ID
 * @param flowId Optional flow ID to get offers from
 * @returns Offer recommendation
 */
export async function recommendBestOffer(userId: number, flowId?: number): Promise<OfferRecommendation> {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Get user segment
  const subscription = await Subscription.findOne({ where: { userId } });
  const segment = await segmentUser(user, subscription);

  // Get offer performance for this segment
  const offerPerformances = await OfferPerformance.findAll({
    where: {
      segment: segment,
    },
    order: [['acceptance_rate', 'DESC']],
  });

  // If we have performance data, use it
  if (offerPerformances.length > 0) {
    const bestOffer = offerPerformances[0];
    return {
      offerType: bestOffer.offerType as 'pause' | 'downgrade' | 'discount' | 'support',
      confidence: Math.round(parseFloat(bestOffer.acceptanceRate.toString())),
      reason: `Best performing offer for ${segment} segment (${bestOffer.acceptanceRate}% acceptance rate)`,
      expectedAcceptanceRate: parseFloat(bestOffer.acceptanceRate.toString()),
    };
  }

  // Fallback: Rule-based recommendation
  let recommendedOffer: 'pause' | 'downgrade' | 'discount' | 'support' = 'pause';
  let reason = '';

  if (segment === 'high_value') {
    recommendedOffer = 'discount';
    reason = 'High-value users respond well to discounts';
  } else if (segment === 'low_value') {
    recommendedOffer = 'downgrade';
    reason = 'Low-value users prefer downgrade options';
  } else if (segment === 'frequent_canceler') {
    recommendedOffer = 'pause';
    reason = 'Frequent cancelers prefer pause options';
  } else {
    recommendedOffer = 'pause';
    reason = 'Default recommendation for this segment';
  }

  return {
    offerType: recommendedOffer,
    confidence: 60, // Medium confidence for rule-based
    reason,
    expectedAcceptanceRate: 40, // Default estimate
  };
}

/**
 * Suggest message for an offer
 * @param userId User ID
 * @param offerType Offer type
 * @returns Message suggestion
 */
export async function suggestMessage(userId: number, offerType: 'pause' | 'downgrade' | 'discount' | 'support' | 'feedback'): Promise<MessageSuggestion> {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Get best performing message for this offer type
  const messagePerformance = await MessagePerformance.findOne({
    where: { offerType },
    order: [['acceptance_rate', 'DESC']],
  });

  // Message templates
  const templates: Record<string, string[]> = {
    pause: [
      'Wait, before you go! Would you like to pause your subscription instead? You can resume anytime.',
      'Take a break without losing your data. Pause your subscription and come back when you\'re ready.',
      'We hate to see you leave! Pause your subscription and keep your account active.',
    ],
    downgrade: [
      'Before you cancel, would you like to switch to a lower plan that might better fit your needs?',
      'We have a plan that might work better for you. Would you like to see your options?',
      'Instead of canceling, consider downgrading to a plan that matches your usage.',
    ],
    discount: [
      'We have a special offer just for you! Get {percentage}% off your next {duration} months.',
      'Don\'t go yet! We\'d like to offer you {percentage}% off to stay with us.',
      'Special discount: {percentage}% off your subscription for the next {duration} months.',
    ],
    support: [
      'Our support team can help find a solution that works for you. Would you like to talk?',
      'Let\'s work together to find the right plan for you. Our team is here to help.',
      'Before you go, our support team would love to help you find a better solution.',
    ],
    feedback: [
      'We\'d love to hear why you\'re canceling. Your feedback helps us improve.',
      'Help us improve by sharing why you\'re leaving. Your opinion matters to us.',
      'Before you go, please let us know what we could have done better.',
    ],
  };

  // Select template
  let message = '';
  let template = 'default';

  if (messagePerformance && messagePerformance.messageTemplate) {
    message = messagePerformance.messageTemplate;
    template = messagePerformance.messageTemplate;
  } else {
    // Use first template as default
    const templateList = templates[offerType] || templates.pause;
    message = templateList[0];
    template = `template_${offerType}_0`;
  }

  // Personalize message
  const personalization: Record<string, any> = {
    userName: user.email?.split('@')[0] || 'there',
    plan: user.plan || 'your plan',
  };

  // Replace placeholders
  message = message.replace(/{percentage}/g, '20');
  message = message.replace(/{duration}/g, '3');
  message = message.replace(/{userName}/g, personalization.userName);
  message = message.replace(/{plan}/g, personalization.plan);

  return {
    message,
    template,
    personalization,
  };
}

/**
 * Update AI model with new event
 * @param event Offer event
 */
export async function updateModelWithEvent(event: OfferEvent): Promise<void> {
  // Get user segment if user exists
  let segment: string | null = null;
  if (event.userId) {
    const user = await User.findByPk(event.userId);
    if (user) {
      const subscription = await Subscription.findOne({ where: { userId: user.id } });
      const userSegment = await segmentUser(user, subscription);
      segment = userSegment;
    }
  }

  // Update offer performance
  const [offerPerf, created] = await OfferPerformance.findOrCreate({
    where: {
      offerType: event.offerType,
      segment: segment,
    },
    defaults: {
      offerType: event.offerType,
      segment: segment,
      totalShown: 0,
      totalAccepted: 0,
      acceptanceRate: 0,
      avgRevenueSaved: 0,
    },
  });

  // Update counters
  offerPerf.totalShown += 1;
  if (event.accepted) {
    offerPerf.totalAccepted += 1;
  }

  // Recalculate acceptance rate
  offerPerf.acceptanceRate = (offerPerf.totalAccepted / offerPerf.totalShown) * 100;

  // Update average revenue saved
  if (event.accepted && event.revenueSaved) {
    const currentTotal = (offerPerf.avgRevenueSaved * (offerPerf.totalAccepted - 1)) + (event.revenueSaved || 0);
    offerPerf.avgRevenueSaved = currentTotal / offerPerf.totalAccepted;
  }

  await offerPerf.save();

  // Update message performance if we have message data
  // (This would require storing message template with the event)
}

/**
 * Get AI performance metrics
 */
export async function getAIPerformanceMetrics(): Promise<{
  totalOffers: number;
  totalAccepted: number;
  overallAcceptanceRate: number;
  offerPerformance: Array<{
    offerType: string;
    totalShown: number;
    totalAccepted: number;
    acceptanceRate: number;
    avgRevenueSaved: number;
  }>;
  weights: Array<{
    name: string;
    value: number;
  }>;
}> {
  const offerPerformances = await OfferPerformance.findAll();
  
  const totalOffers = offerPerformances.reduce((sum, p) => sum + p.totalShown, 0);
  const totalAccepted = offerPerformances.reduce((sum, p) => sum + p.totalAccepted, 0);
  const overallAcceptanceRate = totalOffers > 0 ? (totalAccepted / totalOffers) * 100 : 0;

  const weights = await AIWeight.findAll();

  return {
    totalOffers,
    totalAccepted,
    overallAcceptanceRate,
    offerPerformance: offerPerformances.map(p => ({
      offerType: p.offerType,
      totalShown: p.totalShown,
      totalAccepted: p.totalAccepted,
      acceptanceRate: parseFloat(p.acceptanceRate.toString()),
      avgRevenueSaved: parseFloat(p.avgRevenueSaved.toString()),
    })),
    weights: weights.map(w => ({
      name: w.weightName,
      value: parseFloat(w.weightValue.toString()),
    })),
  };
}

