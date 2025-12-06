/**
 * Subscription Service
 * Manage subscription data and keep Stripe in sync
 * Per backend-services.md specification
 */

import Subscription from '../models/Subscription';
import User from '../models/User';

/**
 * Get subscription by Stripe ID
 * @param stripeId Stripe subscription ID
 * @returns Subscription record or null
 */
export async function getSubscriptionByStripeId(stripeId: string): Promise<Subscription | null> {
  return await Subscription.findOne({
    where: { stripeSubscriptionId: stripeId },
    include: [{ model: User, as: 'user' }],
  });
}

/**
 * Get subscription by user ID
 * @param userId User ID
 * @returns Subscription record or null
 */
export async function getSubscriptionByUserId(userId: number): Promise<Subscription | null> {
  return await Subscription.findOne({
    where: { userId },
    include: [{ model: User, as: 'user' }],
  });
}

/**
 * Update subscription status
 * @param subId Subscription ID
 * @param status New status (e.g., 'active', 'canceled', 'paused')
 * @returns Updated subscription record
 */
export async function updateSubscriptionStatus(
  subId: number,
  status: string
): Promise<Subscription> {
  const subscription = await Subscription.findByPk(subId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  await subscription.update({ status });
  await subscription.reload();

  return subscription;
}

/**
 * Apply pause to subscription
 * Note: Stripe integration will be handled in StripeService
 * This updates the local database record
 * @param subId Subscription ID
 * @returns Updated subscription record
 */
export async function applyPause(subId: number): Promise<Subscription> {
  const subscription = await Subscription.findByPk(subId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Update status to paused
  await subscription.update({ status: 'paused' });
  await subscription.reload();

  return subscription;
}

/**
 * Apply downgrade to subscription
 * Note: Stripe integration will be handled in StripeService
 * This updates the local database record
 * @param subId Subscription ID
 * @param newPlan New plan name
 * @returns Updated subscription record
 */
export async function applyDowngrade(subId: number, newPlan: string): Promise<Subscription> {
  const subscription = await Subscription.findByPk(subId, {
    include: [{ model: User, as: 'user' }],
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Update user's plan
  if (subscription.user) {
    await subscription.user.update({ plan: newPlan });
  }

  // Update subscription status (may need to adjust based on Stripe response)
  await subscription.update({ status: 'active' });
  await subscription.reload();

  return subscription;
}

/**
 * Apply discount to subscription
 * Note: Stripe integration will be handled in StripeService
 * This updates the local database record
 * @param subId Subscription ID
 * @param percent Discount percentage (e.g., 20 for 20%)
 * @returns Updated subscription record
 */
export async function applyDiscount(subId: number, percent: number): Promise<Subscription> {
  if (percent < 0 || percent > 100) {
    throw new Error('Discount percentage must be between 0 and 100');
  }

  const subscription = await Subscription.findByPk(subId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Calculate new value with discount
  if (subscription.value) {
    const discountAmount = (subscription.value * percent) / 100;
    const newValue = subscription.value - discountAmount;
    await subscription.update({ value: newValue });
  }

  await subscription.reload();

  return subscription;
}

/**
 * Create or update subscription
 * @param userId User ID
 * @param stripeSubscriptionId Stripe subscription ID
 * @param value Monthly subscription value
 * @param status Subscription status
 * @returns Subscription record
 */
export async function createOrUpdateSubscription(
  userId: number,
  stripeSubscriptionId: string | null,
  value?: number,
  status?: string
): Promise<Subscription> {
  // Check if subscription exists for this user
  let subscription = await Subscription.findOne({ where: { userId } });

  if (subscription) {
    // Update existing subscription
    const updates: Partial<Subscription> = {};
    if (stripeSubscriptionId) updates.stripeSubscriptionId = stripeSubscriptionId;
    if (value !== undefined) updates.value = value;
    if (status) updates.status = status;

    await subscription.update(updates);
    await subscription.reload();
  } else {
    // Create new subscription
    subscription = await Subscription.create({
      userId,
      stripeSubscriptionId: stripeSubscriptionId || null,
      value: value || null,
      status: status || 'active',
      cancelAttempts: 0,
    });
  }

  return subscription;
}

/**
 * Increment cancel attempts counter
 * @param subId Subscription ID
 * @returns Updated subscription record
 */
export async function incrementCancelAttempts(subId: number): Promise<Subscription> {
  const subscription = await Subscription.findByPk(subId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  await subscription.update({
    cancelAttempts: subscription.cancelAttempts + 1,
  });
  await subscription.reload();

  return subscription;
}

