/**
 * Notification Service
 * Sends notifications to company/team via webhooks, Slack, etc.
 */

export interface CompanyNotification {
  type: string;
  subscriptionId: number;
  userId: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Send notification to company
 * Supports multiple channels: webhook, Slack, email
 */
export async function sendCompanyNotification(notification: CompanyNotification): Promise<{
  success: boolean;
  channels: string[];
  errors?: string[];
}> {
  const channels: string[] = [];
  const errors: string[] = [];

  // 1. Send to webhook (if configured)
  if (process.env.COMPANY_WEBHOOK_URL) {
    try {
      await sendWebhookNotification(notification);
      channels.push('webhook');
    } catch (error: any) {
      errors.push(`Webhook: ${error.message}`);
    }
  }

  // 2. Send to Slack (if configured)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await sendSlackNotification(notification);
      channels.push('slack');
    } catch (error: any) {
      errors.push(`Slack: ${error.message}`);
    }
  }

  // 3. Send email (always as fallback)
  try {
    await sendEmailNotification(notification);
    channels.push('email');
  } catch (error: any) {
    errors.push(`Email: ${error.message}`);
  }

  return {
    success: errors.length === 0,
    channels,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Send webhook notification
 */
async function sendWebhookNotification(notification: CompanyNotification): Promise<void> {
  const webhookUrl = process.env.COMPANY_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const payload = {
    event: 'subscription_alert',
    timestamp: new Date().toISOString(),
    priority: notification.priority,
    data: {
      type: notification.type,
      subscriptionId: notification.subscriptionId,
      userId: notification.userId,
      message: notification.message,
      metadata: notification.metadata,
    },
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RetentionOS-Signature': generateWebhookSignature(JSON.stringify(payload)),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`);
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(notification: CompanyNotification): Promise<void> {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!slackWebhookUrl) {
    return;
  }

  const priorityEmoji = {
    urgent: '🚨',
    high: '⚠️',
    medium: '📢',
    low: 'ℹ️',
  };

  const color = {
    urgent: '#e74c3c',
    high: '#f39c12',
    medium: '#3498db',
    low: '#95a5a6',
  };

  const payload = {
    text: `${priorityEmoji[notification.priority]} RetentionOS Alert`,
    attachments: [
      {
        color: color[notification.priority],
        title: notification.message,
        fields: [
          {
            title: 'Type',
            value: notification.type,
            short: true,
          },
          {
            title: 'Priority',
            value: notification.priority.toUpperCase(),
            short: true,
          },
          {
            title: 'Subscription ID',
            value: String(notification.subscriptionId),
            short: true,
          },
          {
            title: 'User ID',
            value: String(notification.userId),
            short: true,
          },
          ...(notification.metadata
            ? Object.entries(notification.metadata).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              }))
            : []),
        ],
        footer: 'RetentionOS',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  const response = await fetch(slackWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook returned ${response.status}`);
  }
}

/**
 * Send email notification to company
 */
async function sendEmailNotification(notification: CompanyNotification): Promise<void> {
  const { sendEmailToCompany } = await import('./EmailService');

  const html = `
    <h2>${notification.message}</h2>
    <p><strong>Type:</strong> ${notification.type}</p>
    <p><strong>Priority:</strong> ${notification.priority.toUpperCase()}</p>
    <p><strong>Subscription ID:</strong> ${notification.subscriptionId}</p>
    <p><strong>User ID:</strong> ${notification.userId}</p>
    ${notification.metadata ? `<pre>${JSON.stringify(notification.metadata, null, 2)}</pre>` : ''}
  `;

  const text = `
${notification.message}

Type: ${notification.type}
Priority: ${notification.priority.toUpperCase()}
Subscription ID: ${notification.subscriptionId}
User ID: ${notification.userId}
${notification.metadata ? `\nMetadata:\n${JSON.stringify(notification.metadata, null, 2)}` : ''}
  `.trim();

  await sendEmailToCompany({
    to: process.env.COMPANY_EMAIL || process.env.SMTP_USER || 'alerts@retentionos.com',
    subject: `[${notification.priority.toUpperCase()}] ${notification.type} - Subscription ${notification.subscriptionId}`,
    html,
    text,
    priority: notification.priority,
    metadata: notification.metadata,
  });
}

/**
 * Generate webhook signature for security
 */
function generateWebhookSignature(payload: string): string {
  const secret = process.env.WEBHOOK_SECRET || 'default-secret-change-in-production';
  // Simple HMAC-like signature (use crypto in production)
  return Buffer.from(payload + secret).toString('base64');
}

