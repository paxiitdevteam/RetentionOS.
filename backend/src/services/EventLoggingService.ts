/**
 * Event Logging Service
 * Store every cancel attempt, offer shown, action taken, and final result
 * Per backend-services.md specification
 */

import { OfferEvent } from '../models/OfferEvent';
import ChurnReason from '../models/ChurnReason';
import { updateModelWithEvent } from './AIService';

/**
 * Log cancel attempt
 * @param userId User ID
 * @param flowId Flow ID
 */
export async function logCancelAttempt(
  userId: number,
  flowId: number
): Promise<void> {
  await OfferEvent.create({
    userId,
    flowId,
    offerType: 'cancel_attempt',
    accepted: false,
    revenueSaved: 0,
  });
}

/**
 * Log when offer is displayed
 * @param flowId Flow ID
 * @param offerType Type of offer (pause, downgrade, discount, support)
 * @param userId User ID (optional)
 */
export async function logOfferShown(
  flowId: number,
  offerType: string,
  userId?: number
): Promise<void> {
  await OfferEvent.create({
    userId: userId || null,
    flowId,
    offerType,
    accepted: false,
    revenueSaved: 0,
  });
}

/**
 * Log user's decision on an offer
 * @param userId User ID
 * @param flowId Flow ID
 * @param offerType Type of offer
 * @param accepted Whether user accepted the offer
 * @param revenueSaved Revenue saved if accepted
 */
export async function logOfferDecision(
  userId: number,
  flowId: number,
  offerType: string,
  accepted: boolean,
  revenueSaved: number | null = null
): Promise<OfferEvent> {
  const event = await OfferEvent.create({
    userId,
    flowId,
    offerType,
    accepted,
    revenueSaved: revenueSaved || 0,
  });

  // Update AI model with this event (async, don't wait)
  updateModelWithEvent(event).catch(err => {
    console.error('Failed to update AI model:', err);
  });

  return event;
}

/**
 * Log churn reason
 * @param userId User ID
 * @param reasonCode Reason code (e.g., 'price', 'features', 'support')
 * @param reasonText Optional reason text
 * @param flowId Flow ID (optional)
 */
export async function logChurnReason(
  userId: number,
  reasonCode: string,
  reasonText?: string,
  flowId?: number
): Promise<ChurnReason> {
  return await ChurnReason.create({
    userId,
    flowId: flowId || null,
    reasonCode,
    reasonText: reasonText || null,
  });
}

