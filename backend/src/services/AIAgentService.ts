/**
 * AI Agent Service
 * Intelligent automated agent for handling alerts, sending messages, and notifications
 * Uses AI to generate personalized messages and manage workflows
 */

import Subscription from '../models/Subscription';
import User from '../models/User';
import Alert, { AlertType } from '../models/Alert';
import { Op } from 'sequelize';
import { getSubscriptionByUserId } from './SubscriptionService';
import { createAlert } from './AlertService';
import { sendEmailToUser, sendEmailToCompany } from './EmailService';
import { sendCompanyNotification } from './NotificationService';
import { generatePersonalizedMessage, generateEmailTemplate } from './AIMessageService';

export interface AIAgentContext {
  subscriptionId: number;
  userId: number;
  userEmail: string | null;
  plan: string;
  value: number | null;
  daysUntilEnd: number;
  cancelAttempts: number;
  alertType: AlertType;
  previousAlerts?: Alert[];
  userHistory?: any;
}

export interface AIAgentAction {
  action: 'send_email' | 'send_alert' | 'trigger_retention' | 'notify_company' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message?: string;
  emailTemplate?: string;
  metadata?: Record<string, any>;
}

export interface AIAgentResult {
  success: boolean;
  actions: AIAgentAction[];
  messages: string[];
  errors?: string[];
}

/**
 * AI Agent - Main decision maker
 * Analyzes subscription context and determines best actions
 */
export async function processAlertWithAI(context: AIAgentContext): Promise<AIAgentResult> {
  const actions: AIAgentAction[] = [];
  const messages: string[] = [];
  const errors: string[] = [];

  try {
    // 1. Analyze context and determine priority
    const priority = determinePriority(context);
    messages.push(`AI Agent: Analyzed subscription ${context.subscriptionId}, priority: ${priority}`);

    // 2. Generate personalized message based on context
    const personalizedMessage = await generatePersonalizedMessage(context);
    messages.push(`AI Agent: Generated personalized message for user`);

    // 3. Determine actions based on alert type and context
    switch (context.alertType) {
      case 'renewal_reminder':
        actions.push(...await handleRenewalReminder(context, priority, personalizedMessage));
        break;
      case 'expiring_soon':
        actions.push(...await handleExpiringSoon(context, priority, personalizedMessage));
        break;
      case 'expired':
        actions.push(...await handleExpired(context, priority, personalizedMessage));
        break;
      case 'auto_retention_triggered':
        actions.push(...await handleAutoRetention(context, priority, personalizedMessage));
        break;
      default:
        actions.push(...await handleGenericAlert(context, priority, personalizedMessage));
    }

    // 4. Execute actions
    for (const action of actions) {
      try {
        await executeAction(action, context);
        messages.push(`AI Agent: Executed ${action.action} action`);
      } catch (error: any) {
        errors.push(`Failed to execute ${action.action}: ${error.message}`);
      }
    }

    // 5. Notify company if high priority (handled in action execution)
    // Company notifications are sent via actions, not here

    return {
      success: errors.length === 0,
      actions,
      messages,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      actions: [],
      messages,
      errors: [error.message || 'Unknown error'],
    };
  }
}

/**
 * Determine priority based on context
 */
function determinePriority(context: AIAgentContext): 'low' | 'medium' | 'high' | 'urgent' {
  // Urgent: Expiring in 1-3 days or high value
  if (context.daysUntilEnd <= 3 || (context.value && context.value >= 100)) {
    return 'urgent';
  }
  // High: Expiring in 4-7 days or medium-high value
  if (context.daysUntilEnd <= 7 || (context.value && context.value >= 50)) {
    return 'high';
  }
  // Medium: Expiring in 8-14 days
  if (context.daysUntilEnd <= 14) {
    return 'medium';
  }
  // Low: Everything else
  return 'low';
}

/**
 * Handle renewal reminder alerts
 */
async function handleRenewalReminder(
  context: AIAgentContext,
  priority: string,
  personalizedMessage: string
): Promise<AIAgentAction[]> {
  const actions: AIAgentAction[] = [];

  // Always send email to user
  actions.push({
    action: 'send_email',
    priority: priority as any,
    message: personalizedMessage,
    emailTemplate: 'renewal_reminder',
    metadata: {
      daysUntilEnd: context.daysUntilEnd,
      offerType: context.daysUntilEnd <= 14 ? 'early_renewal_discount' : 'standard_reminder',
    },
  });

  // If high value, notify company
  if (context.value && context.value >= 50) {
    actions.push({
      action: 'notify_company',
      priority: 'medium',
      message: `High-value subscription ($${context.value}) renewing in ${context.daysUntilEnd} days`,
    });
  }

  return actions;
}

/**
 * Handle expiring soon alerts
 */
async function handleExpiringSoon(
  context: AIAgentContext,
  priority: string,
  personalizedMessage: string
): Promise<AIAgentAction[]> {
  const actions: AIAgentAction[] = [];

  // Send urgent email with retention offer
  actions.push({
    action: 'send_email',
    priority: 'urgent',
    message: personalizedMessage,
    emailTemplate: 'expiring_soon',
    metadata: {
      daysUntilEnd: context.daysUntilEnd,
      offerType: context.daysUntilEnd <= 3 ? 'urgent_discount' : 'retention_offer',
      discountPercentage: context.daysUntilEnd <= 3 ? 30 : 20,
    },
  });

  // Trigger retention flow if not already triggered
  if (context.daysUntilEnd <= 7) {
    actions.push({
      action: 'trigger_retention',
      priority: 'high',
      message: 'Auto-trigger retention flow',
    });
  }

  // Always notify company for expiring soon
  actions.push({
    action: 'notify_company',
    priority: priority as any,
    message: `Subscription expiring in ${context.daysUntilEnd} days - retention action needed`,
  });

  return actions;
}

/**
 * Handle expired subscriptions
 */
async function handleExpired(
  context: AIAgentContext,
  priority: string,
  personalizedMessage: string
): Promise<AIAgentAction[]> {
  const actions: AIAgentAction[] = [];

  // Send final recovery email
  actions.push({
    action: 'send_email',
    priority: 'urgent',
    message: personalizedMessage,
    emailTemplate: 'expired_recovery',
    metadata: {
      offerType: 'final_recovery',
      discountPercentage: 40,
      urgency: 'high',
    },
  });

  // Urgent company notification
  actions.push({
    action: 'notify_company',
    priority: 'urgent',
    message: `URGENT: Subscription expired - immediate recovery action needed`,
  });

  return actions;
}

/**
 * Handle auto-retention triggered alerts
 */
async function handleAutoRetention(
  context: AIAgentContext,
  priority: string,
  personalizedMessage: string
): Promise<AIAgentAction[]> {
  const actions: AIAgentAction[] = [];

  // Send retention offer email
  actions.push({
    action: 'send_email',
    priority: 'high',
    message: personalizedMessage,
    emailTemplate: 'retention_offer',
    metadata: {
      daysUntilEnd: context.daysUntilEnd,
      offerType: 'proactive_retention',
    },
  });

  // Notify company about proactive action
  actions.push({
    action: 'notify_company',
    priority: 'medium',
    message: `Proactive retention triggered for subscription ${context.subscriptionId}`,
  });

  return actions;
}

/**
 * Handle generic alerts
 */
async function handleGenericAlert(
  context: AIAgentContext,
  priority: string,
  personalizedMessage: string
): Promise<AIAgentAction[]> {
  return [
    {
      action: 'send_email',
      priority: priority as any,
      message: personalizedMessage,
      emailTemplate: 'generic_alert',
    },
  ];
}

/**
 * Execute an AI agent action
 */
async function executeAction(action: AIAgentAction, context: AIAgentContext): Promise<void> {
  switch (action.action) {
    case 'send_email':
      if (context.userEmail && action.emailTemplate) {
        const emailContent = await generateEmailTemplate(
          action.emailTemplate,
          context,
          action.message || ''
        );
        await sendEmailToUser({
          to: context.userEmail,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          template: action.emailTemplate,
          metadata: action.metadata,
        });
      }
      break;

    case 'notify_company':
      await sendCompanyNotification({
        type: context.alertType,
        subscriptionId: context.subscriptionId,
        userId: context.userId,
        priority: action.priority,
        message: action.message || 'AI Agent notification',
        metadata: {
          ...action.metadata,
          daysUntilEnd: context.daysUntilEnd,
          value: context.value,
          plan: context.plan,
        },
      });
      break;

    case 'trigger_retention':
      // Import and trigger retention flow
      const { startRetentionFlow } = await import('./RetentionService');
      const user = await User.findByPk(context.userId);
      if (user) {
        await startRetentionFlow(
          user.externalId,
          user.plan || 'unknown',
          user.region || 'unknown',
          user.email || undefined
        );
      }
      break;

    case 'send_alert':
      await createAlert({
        subscriptionId: context.subscriptionId,
        userId: context.userId,
        alertType: context.alertType,
        message: action.message || 'AI Agent alert',
        metadata: action.metadata,
      });
      break;

    default:
      console.log(`Unknown action: ${action.action}`);
  }
}

/**
 * Process all pending alerts with AI agent
 * This can be run as a scheduled job
 */
export async function processPendingAlertsWithAI(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: AIAgentResult[];
}> {
  // Get all unread alerts from the last 24 hours
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const alerts = await Alert.findAll({
    where: {
      read: false,
      createdAt: {
        [Op.gte]: yesterday,
      },
    },
    include: [
      {
        model: Subscription,
        as: 'subscription',
        include: [
          {
            model: User,
            as: 'user',
          },
        ],
      },
    ],
    limit: 100, // Process in batches
  });

  const results: AIAgentResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const alert of alerts) {
    if (!alert.subscription || !alert.subscription.user) continue;

    const subscription = alert.subscription;
    const user = subscription.user as User;
    const now = new Date();
    const endDate = subscription.endDate || new Date();
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const context: AIAgentContext = {
      subscriptionId: subscription.id,
      userId: user.id,
      userEmail: user.email || null,
      plan: user.plan || 'unknown',
      value: subscription.value,
      daysUntilEnd,
      cancelAttempts: subscription.cancelAttempts,
      alertType: alert.alertType,
    };

    const result = await processAlertWithAI(context);
    results.push(result);

    if (result.success) {
      successful++;
      // Mark alert as processed
      await alert.update({ read: true });
    } else {
      failed++;
    }
  }

  return {
    processed: alerts.length,
    successful,
    failed,
    results,
  };
}

