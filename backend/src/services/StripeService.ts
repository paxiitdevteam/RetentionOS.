/**
 * Stripe Integration Service
 * Sync subscription lifecycle events
 * Per backend-services.md specification
 */

import Stripe from 'stripe';
import {
  getSubscriptionByStripeId,
  createOrUpdateSubscription,
  updateSubscriptionStatus,
} from './SubscriptionService';
import { findOrCreateUser } from './UserService';
import { logChurnReason } from './EventLoggingService';

// Initialize Stripe client
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
if (!stripeSecretKey) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set. Stripe integration will not work.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
}) : null;

/**
 * Handle subscription updated webhook event
 * @param event Stripe subscription event
 * @returns Updated subscription record
 */
export async function handleSubscriptionUpdated(
  event: Stripe.Event
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }

  const subscription = event.data.object as Stripe.Subscription;

  try {
    // Find or create user by customer ID
    const customerId = subscription.customer as string;
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      console.warn(`Customer ${customerId} is deleted, skipping subscription update`);
      return;
    }

    // Get user email from customer
    const email = (customer as Stripe.Customer).email;
    if (!email) {
      console.warn(`Customer ${customerId} has no email, skipping subscription update`);
      return;
    }

    // Find or create user
    const user = await findOrCreateUser(
      customerId, // externalId
      subscription.items.data[0]?.price.nickname || 'unknown', // plan
      (customer as Stripe.Customer).metadata?.region || 'unknown' // region
    );

    // Get subscription value (amount in cents, convert to dollars)
    const amount = subscription.items.data[0]?.price.unit_amount || 0;
    const value = amount / 100; // Convert cents to dollars

    // Map Stripe status to our status
    const statusMap: Record<string, string> = {
      active: 'active',
      canceled: 'canceled',
      past_due: 'past_due',
      unpaid: 'unpaid',
      trialing: 'trialing',
      incomplete: 'incomplete',
      incomplete_expired: 'incomplete_expired',
      paused: 'paused',
    };

    const status = statusMap[subscription.status] || subscription.status;

    // Calculate end date and renewal date from Stripe subscription
    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null;
    const currentPeriodStart = subscription.current_period_start
      ? new Date(subscription.current_period_start * 1000)
      : null;

    // Create or update subscription
    const dbSubscription = await createOrUpdateSubscription(
      user.id,
      subscription.id,
      value,
      status
    );

    // Update end date and renewal date
    if (currentPeriodEnd) {
      await dbSubscription.update({ endDate: currentPeriodEnd });
    }
    if (currentPeriodStart) {
      // Renewal date is typically the same as end date for monthly subscriptions
      await dbSubscription.update({ renewalDate: currentPeriodEnd || currentPeriodStart });
    }

    console.log(`✅ Subscription ${subscription.id} updated for user ${user.id}`);
  } catch (error: any) {
    console.error(`❌ Error handling subscription updated event:`, error);
    throw error;
  }
}

/**
 * Handle subscription cancelled webhook event
 * @param event Stripe subscription event
 * @returns Updated subscription record
 */
export async function handleSubscriptionCancelled(
  event: Stripe.Event
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }

  const subscription = event.data.object as Stripe.Subscription;

  try {
    // Find subscription in our database
    const dbSubscription = await getSubscriptionByStripeId(subscription.id);

    if (!dbSubscription) {
      console.warn(`Subscription ${subscription.id} not found in database`);
      return;
    }

    // Update subscription status to canceled
    await updateSubscriptionStatus(dbSubscription.id, 'canceled');

    // Log churn reason if available
    const cancellationReason = (subscription as any).cancellation_details?.reason;
    if (cancellationReason && dbSubscription.userId) {
      await logChurnReason(
        dbSubscription.userId,
        cancellationReason,
        (subscription as any).cancellation_details?.feedback || null
      );
    }

    console.log(`✅ Subscription ${subscription.id} marked as canceled`);
  } catch (error: any) {
    console.error(`❌ Error handling subscription cancelled event:`, error);
    throw error;
  }
}

/**
 * Handle invoice paid webhook event
 * @param event Stripe invoice event
 */
export async function handleInvoicePaid(
  event: Stripe.Event
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }

  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    // One-time payment, not a subscription
    return;
  }

  try {
    // Find subscription in our database
    const dbSubscription = await getSubscriptionByStripeId(subscriptionId);

    if (!dbSubscription) {
      console.warn(`Subscription ${subscriptionId} not found in database for invoice ${invoice.id}`);
      return;
    }

    // Update subscription status to active (payment confirmed)
    await updateSubscriptionStatus(dbSubscription.id, 'active');

    // Update subscription value if invoice amount changed
    const amount = invoice.amount_paid || 0;
    const value = amount / 100; // Convert cents to dollars

    if (value > 0 && dbSubscription.value !== value) {
      await dbSubscription.update({ value });
    }

    console.log(`✅ Invoice ${invoice.id} paid for subscription ${subscriptionId}`);
  } catch (error: any) {
    console.error(`❌ Error handling invoice paid event:`, error);
    throw error;
  }
}

/**
 * Handle trial ending webhook event
 * @param event Stripe subscription event
 */
export async function handleTrialEnding(
  event: Stripe.Event
): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }

  const subscription = event.data.object as Stripe.Subscription;

  try {
    // Find subscription in our database
    const dbSubscription = await getSubscriptionByStripeId(subscription.id);

    if (!dbSubscription) {
      console.warn(`Subscription ${subscription.id} not found in database`);
      return;
    }

    // Update subscription status (trial ending, will become active or canceled)
    // Stripe sends this event 3 days before trial ends
    const status = subscription.status === 'trialing' ? 'trialing' : subscription.status;
    await updateSubscriptionStatus(dbSubscription.id, status);

    console.log(`✅ Trial ending notification for subscription ${subscription.id}`);
  } catch (error: any) {
    console.error(`❌ Error handling trial ending event:`, error);
    throw error;
  }
}

/**
 * Process Stripe webhook event
 * Routes to appropriate handler based on event type
 * @param event Stripe webhook event
 */
export async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
      case 'customer.subscription.canceled':
        await handleSubscriptionCancelled(event);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialEnding(event);
        break;

      default:
        console.log(`ℹ️  Unhandled Stripe event type: ${event.type}`);
        break;
    }
  } catch (error: any) {
    console.error(`❌ Error processing webhook event ${event.type}:`, error);
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 * @param payload Raw request body
 * @param signature Stripe signature header
 * @param secret Webhook signing secret
 * @returns Stripe event object
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe client not initialized');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      secret
    );
    return event;
  } catch (error: any) {
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Get Stripe client instance
 * @returns Stripe client or null if not configured
 */
export function getStripeClient(): Stripe | null {
  return stripe;
}

