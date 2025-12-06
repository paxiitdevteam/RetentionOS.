/**
 * Alert Service
 * Manages alerts and notifications for subscription lifecycle events
 */

import { Op } from 'sequelize';
import Alert from '../models/Alert';
import Subscription from '../models/Subscription';
import User from '../models/User';
import { processAlertWithAI } from './AIAgentService';

export type AlertType =
  | 'renewal_reminder'
  | 'expiring_soon'
  | 'expired'
  | 'auto_retention_triggered'
  | 'retention_offer_sent'
  | 'subscription_renewed'
  | 'subscription_canceled';

export interface CreateAlertInput {
  subscriptionId: number;
  userId: number;
  alertType: AlertType;
  message: string;
  metadata?: Record<string, any>;
  emailSent?: boolean;
}

/**
 * Create a new alert
 * @param input Alert data
 * @param useAI Whether to process with AI agent (default: true)
 * @returns Created alert
 */
export async function createAlert(input: CreateAlertInput, useAI: boolean = true): Promise<Alert> {
  const alert = await Alert.create({
    subscriptionId: input.subscriptionId,
    userId: input.userId,
    alertType: input.alertType,
    message: input.message,
    metadata: input.metadata || {},
    emailSent: input.emailSent || false,
    read: false,
  });

  // Process with AI agent if enabled
  if (useAI && process.env.AI_AGENT_ENABLED !== 'false') {
    try {
      // Get subscription and user context
      const subscription = await Subscription.findByPk(input.subscriptionId, {
        include: [{ model: User, as: 'user' }],
      });

      if (subscription && subscription.user) {
        const user = subscription.user as User;
        const now = new Date();
        const endDate = subscription.endDate || new Date();
        const daysUntilEnd = subscription.endDate
          ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        const context = {
          subscriptionId: subscription.id,
          userId: user.id,
          userEmail: user.email || null,
          plan: user.plan || 'unknown',
          value: subscription.value,
          daysUntilEnd,
          cancelAttempts: subscription.cancelAttempts,
          alertType: input.alertType,
        };

        // Process with AI agent (async, don't wait)
        processAlertWithAI(context).catch((error) => {
          console.error('Error processing alert with AI:', error);
        });
      }
    } catch (error) {
      console.error('Error setting up AI agent processing:', error);
      // Continue even if AI processing fails
    }
  }

  return alert;
}

/**
 * Get alerts for a subscription
 * @param subscriptionId Subscription ID
 * @param limit Number of alerts to return
 * @returns Array of alerts
 */
export async function getAlertsForSubscription(
  subscriptionId: number,
  limit: number = 50
): Promise<Alert[]> {
  return Alert.findAll({
    where: { subscriptionId },
    order: [['createdAt', 'DESC']],
    limit,
  });
}

/**
 * Get alerts for a user
 * @param userId User ID
 * @param limit Number of alerts to return
 * @returns Array of alerts
 */
export async function getAlertsForUser(userId: number, limit: number = 50): Promise<Alert[]> {
  return Alert.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
  });
}

/**
 * Get unread alerts for admin dashboard
 * @param limit Number of alerts to return
 * @returns Array of unread alerts
 */
export async function getUnreadAlerts(limit: number = 100): Promise<Alert[]> {
  return Alert.findAll({
    where: { read: false },
    include: [
      {
        model: Subscription,
        as: 'subscription',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'externalId', 'plan'],
          },
        ],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
  });
}

/**
 * Mark alert as read
 * @param alertId Alert ID
 * @returns Updated alert
 */
export async function markAlertAsRead(alertId: number): Promise<Alert> {
  const alert = await Alert.findByPk(alertId);
  if (!alert) {
    throw new Error('Alert not found');
  }

  await alert.update({ read: true });
  return alert;
}

/**
 * Mark all alerts as read for a subscription
 * @param subscriptionId Subscription ID
 * @returns Number of alerts updated
 */
export async function markAllAlertsAsReadForSubscription(subscriptionId: number): Promise<number> {
  const [updatedCount] = await Alert.update(
    { read: true },
    {
      where: {
        subscriptionId,
        read: false,
      },
    }
  );

  return updatedCount;
}

/**
 * Get alert statistics
 * @returns Alert statistics
 */
export async function getAlertStats(): Promise<{
  total: number;
  unread: number;
  byType: Record<AlertType, number>;
  recent24Hours: number;
}> {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [total, unread, recent24Hours, allAlerts] = await Promise.all([
    Alert.count(),
    Alert.count({ where: { read: false } }),
    Alert.count({ where: { createdAt: { [Op.gte]: yesterday } } }),
    Alert.findAll({
      attributes: ['alertType'],
    }),
  ]);

  const byType: Record<string, number> = {};
  allAlerts.forEach((alert) => {
    byType[alert.alertType] = (byType[alert.alertType] || 0) + 1;
  });

  return {
    total,
    unread,
    byType: byType as Record<AlertType, number>,
    recent24Hours,
  };
}

/**
 * Determine if email should be sent for this alert type
 * @param alertType Alert type
 * @returns True if email should be sent
 */
function shouldSendEmail(alertType: AlertType): boolean {
  // Only send emails for critical alerts
  const emailAlertTypes: AlertType[] = [
    'expiring_soon',
    'expired',
    'auto_retention_triggered',
    'subscription_canceled',
  ];
  return emailAlertTypes.includes(alertType);
}

