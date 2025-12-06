/**
 * Subscription Monitor Service
 * Monitors subscription lifecycle and triggers proactive retention actions
 * - Checks for upcoming renewals/expirations
 * - Sends alerts before subscription ends
 * - Automatically triggers retention flows
 */

import { Op } from 'sequelize';
import Subscription from '../models/Subscription';
import User from '../models/User';
import { startRetentionFlow } from './RetentionService';
import { createAlert, AlertType } from './AlertService';

export interface UpcomingSubscription {
  subscriptionId: number;
  userId: number;
  userEmail: string | null;
  plan: string;
  value: number | null;
  endDate: Date;
  daysUntilEnd: number;
  status: string;
  cancelAttempts: number;
}

export interface SubscriptionAlert {
  subscriptionId: number;
  userId: number;
  userEmail: string | null;
  alertType: 'renewal_reminder' | 'expiring_soon' | 'expired' | 'auto_retention_triggered';
  message: string;
  daysUntilEnd: number;
  triggeredAt: Date;
}

/**
 * Get subscriptions expiring within specified days
 * @param days Number of days to look ahead (default: 30)
 * @returns Array of upcoming subscriptions
 */
export async function getUpcomingSubscriptions(days: number = 30): Promise<UpcomingSubscription[]> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  const subscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      endDate: {
        [Op.between]: [new Date(), endDate],
        [Op.ne]: null, // Exclude subscriptions without end dates
      },
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'externalId', 'plan', 'region'],
        required: true, // Only include subscriptions with users
      },
    ],
    order: [['endDate', 'ASC']],
  });

  const now = new Date();
  return subscriptions
    .filter((sub) => sub.user)
    .map((sub) => {
      const endDate = sub.endDate || new Date();
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        subscriptionId: sub.id,
        userId: sub.userId,
        userEmail: (sub.user as User).email || null,
        plan: (sub.user as User).plan || 'unknown',
        value: sub.value,
        endDate,
        daysUntilEnd,
        status: sub.status || 'active',
        cancelAttempts: sub.cancelAttempts,
      };
    });
}

/**
 * Get subscriptions that need proactive retention (7 days before end)
 * @returns Array of subscriptions needing proactive retention
 */
export async function getSubscriptionsNeedingRetention(): Promise<UpcomingSubscription[]> {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const subscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      endDate: {
        [Op.between]: [new Date(), sevenDaysFromNow],
      },
      // Only trigger for subscriptions that haven't been alerted recently
      // This prevents spam - we'll track this via alerts table
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'externalId', 'plan', 'region'],
      },
    ],
    order: [['endDate', 'ASC']],
  });

  const now = new Date();
  return subscriptions
    .filter((sub) => sub.user)
    .map((sub) => {
      const endDate = sub.endDate || new Date();
      const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        subscriptionId: sub.id,
        userId: sub.userId,
        userEmail: (sub.user as User).email || null,
        plan: (sub.user as User).plan || 'unknown',
        value: sub.value,
        endDate,
        daysUntilEnd,
        status: sub.status || 'active',
        cancelAttempts: sub.cancelAttempts,
      };
    });
}

/**
 * Check and send alerts for upcoming subscriptions
 * @param alertDays Array of days before expiration to send alerts (e.g., [30, 14, 7, 3, 1])
 * @returns Array of alerts sent
 */
export async function checkAndSendAlerts(
  alertDays: number[] = [30, 14, 7, 3, 1]
): Promise<SubscriptionAlert[]> {
  const alerts: SubscriptionAlert[] = [];
  const now = new Date();

  // Get all active subscriptions with end dates
  const subscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      endDate: {
        [Op.gte]: now, // Not expired yet
      },
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'externalId', 'plan', 'region'],
      },
    ],
  });

  for (const sub of subscriptions) {
    if (!sub.user || !sub.endDate) continue;

    const daysUntilEnd = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Check if we should send an alert today
    if (alertDays.includes(daysUntilEnd)) {
      let alertType: AlertType;
      let message: string;

      if (daysUntilEnd >= 14) {
        alertType = 'renewal_reminder';
        message = `Subscription renews in ${daysUntilEnd} days. Consider proactive retention offers.`;
      } else if (daysUntilEnd >= 3) {
        alertType = 'expiring_soon';
        message = `Subscription expires in ${daysUntilEnd} days. High priority for retention.`;
      } else {
        alertType = 'expiring_soon';
        message = `Subscription expires in ${daysUntilEnd} day(s). Urgent retention needed.`;
      }

      // Create alert
      await createAlert({
        subscriptionId: sub.id,
        userId: sub.userId,
        alertType,
        message,
        metadata: {
          daysUntilEnd,
          plan: (sub.user as User).plan,
          value: sub.value,
        },
      });

      alerts.push({
        subscriptionId: sub.id,
        userId: sub.userId,
        userEmail: (sub.user as User).email || null,
        alertType,
        message,
        daysUntilEnd,
        triggeredAt: new Date(),
      });
    }
  }

  return alerts;
}

/**
 * Automatically trigger retention flows for subscriptions expiring soon
 * @param daysBeforeEnd Number of days before expiration to trigger (default: 7)
 * @returns Array of triggered flows
 */
export async function triggerProactiveRetention(
  daysBeforeEnd: number = 7
): Promise<Array<{ subscriptionId: number; userId: number; flowId: number; success: boolean; error?: string }>> {
  const results: Array<{ subscriptionId: number; userId: number; flowId: number; success: boolean; error?: string }> = [];

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBeforeEnd);

  // Get subscriptions expiring within the specified days
  const subscriptions = await Subscription.findAll({
    where: {
      status: 'active',
      endDate: {
        [Op.between]: [new Date(), targetDate],
        [Op.ne]: null, // Exclude subscriptions without end dates
      },
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'externalId', 'plan', 'region'],
        required: true, // Only include subscriptions with users
      },
    ],
  });

  for (const sub of subscriptions) {
    if (!sub.user) continue;

    const user = sub.user as User;

    try {
      // Check if we've already triggered retention for this subscription recently
      // (prevent spam - we'll track this via alerts)
      const recentAlert = await checkRecentRetentionAlert(sub.id);
      if (recentAlert) {
        console.log(`Skipping subscription ${sub.id} - retention already triggered recently`);
        continue;
      }

      // Start retention flow proactively
      const flowResult = await startRetentionFlow(
        user.externalId,
        user.plan || 'unknown',
        user.region || 'unknown',
        user.email || undefined,
        sub.stripeSubscriptionId || undefined,
        sub.value || undefined
      );

      // Create alert for triggered retention
      await createAlert({
        subscriptionId: sub.id,
        userId: sub.userId,
        alertType: 'auto_retention_triggered',
        message: `Proactive retention flow triggered automatically (${daysBeforeEnd} days before expiration)`,
        metadata: {
          flowId: flowResult.flowId,
          daysUntilEnd: daysBeforeEnd,
          plan: user.plan,
          value: sub.value,
        },
      });

      results.push({
        subscriptionId: sub.id,
        userId: sub.userId,
        flowId: flowResult.flowId,
        success: true,
      });

      console.log(`✅ Proactive retention triggered for subscription ${sub.id}, user ${user.id}`);
    } catch (error: any) {
      console.error(`❌ Error triggering proactive retention for subscription ${sub.id}:`, error);
      results.push({
        subscriptionId: sub.id,
        userId: sub.userId,
        flowId: 0,
        success: false,
        error: error.message || 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Check if retention was already triggered recently for a subscription
 * @param subscriptionId Subscription ID
 * @returns True if retention was triggered in the last 5 days
 */
async function checkRecentRetentionAlert(subscriptionId: number): Promise<boolean> {
  // Import Alert model dynamically to avoid circular dependency
  const Alert = (await import('../models/Alert')).default;
  
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const recentAlert = await Alert.findOne({
    where: {
      subscriptionId,
      alertType: 'auto_retention_triggered',
      createdAt: {
        [Op.gte]: fiveDaysAgo,
      },
    },
  });

  return !!recentAlert;
}

/**
 * Get subscription statistics for dashboard
 * @returns Statistics about upcoming subscriptions
 */
export async function getSubscriptionStats(): Promise<{
  totalActive: number;
  expiringIn7Days: number;
  expiringIn30Days: number;
  expiringIn90Days: number;
  totalValueAtRisk: number;
  averageDaysUntilExpiration: number;
}> {
  const now = new Date();
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const ninetyDays = new Date();
  ninetyDays.setDate(ninetyDays.getDate() + 90);

  const [totalActive, expiring7, expiring30, expiring90] = await Promise.all([
    Subscription.count({ where: { status: 'active' } }),
    Subscription.count({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [now, sevenDays],
          [Op.ne]: null,
        },
      },
    }),
    Subscription.count({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [now, thirtyDays],
          [Op.ne]: null,
        },
      },
    }),
    Subscription.count({
      where: {
        status: 'active',
        endDate: {
          [Op.between]: [now, ninetyDays],
          [Op.ne]: null,
        },
      },
    }),
  ]);

  // Get subscriptions with end dates to calculate average and total value
  const subscriptionsWithEndDates = await Subscription.findAll({
    where: {
      status: 'active',
      endDate: {
        [Op.gte]: now,
        [Op.ne]: null,
      },
    },
    attributes: ['value', 'endDate'],
  });

  let totalValueAtRisk = 0;
  let totalDays = 0;
  let count = 0;

  subscriptionsWithEndDates.forEach((sub) => {
    if (sub.value) {
      totalValueAtRisk += sub.value;
    }
    if (sub.endDate) {
      const daysUntilEnd = Math.ceil((sub.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      totalDays += daysUntilEnd;
      count++;
    }
  });

  const averageDaysUntilExpiration = count > 0 ? Math.round(totalDays / count) : 0;

  return {
    totalActive,
    expiringIn7Days: expiring7,
    expiringIn30Days: expiring30,
    expiringIn90Days: expiring90,
    totalValueAtRisk: Math.round(totalValueAtRisk * 100) / 100,
    averageDaysUntilExpiration,
  };
}

