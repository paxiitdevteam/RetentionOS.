/**
 * AI Message Service
 * Generates personalized messages and email templates using AI
 */

import { AIAgentContext } from './AIAgentService';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate personalized message based on context
 * Uses AI-like logic to create contextual messages
 */
export async function generatePersonalizedMessage(context: AIAgentContext): Promise<string> {
  const { plan, value, daysUntilEnd, cancelAttempts, alertType } = context;

  // Build personalized message based on context
  let message = '';

  switch (alertType) {
    case 'renewal_reminder':
      if (daysUntilEnd >= 14) {
        message = `Hi! We wanted to remind you that your ${plan} subscription will renew in ${daysUntilEnd} days. `;
        message += `As a valued customer, we're here to ensure you continue getting the most out of our service.`;
      } else {
        message = `Your ${plan} subscription is renewing soon (${daysUntilEnd} days). `;
        message += `We'd love to keep you as a customer!`;
      }
      break;

    case 'expiring_soon':
      if (daysUntilEnd <= 3) {
        message = `⏰ URGENT: Your ${plan} subscription expires in ${daysUntilEnd} day(s)! `;
        message += `We don't want to lose you. Let's find a solution that works for you.`;
      } else {
        message = `Your ${plan} subscription will expire in ${daysUntilEnd} days. `;
        message += `Before you go, we'd like to offer you a special deal to stay with us.`;
      }
      break;

    case 'expired':
      message = `We noticed your ${plan} subscription has expired. `;
      message += `We'd love to have you back! Here's a special offer just for you.`;
      break;

    case 'auto_retention_triggered':
      message = `We want to make sure you're getting the most value from your ${plan} subscription. `;
      message += `Before your subscription ends, we have some exclusive offers for you.`;
      break;

    default:
      message = `We wanted to reach out about your ${plan} subscription. `;
      message += `Is there anything we can help you with?`;
  }

  // Add value-based personalization
  if (value && value >= 100) {
    message += ` As one of our premium customers, we truly value your business.`;
  } else if (value && value >= 50) {
    message += ` We appreciate your continued support.`;
  }

  // Add cancel attempts context
  if (cancelAttempts > 0) {
    message += ` We understand you've had concerns before, and we're committed to addressing them.`;
  }

  return message;
}

/**
 * Generate email template content
 */
export async function generateEmailTemplate(
  templateType: string,
  context: AIAgentContext,
  personalizedMessage: string
): Promise<EmailContent> {
  const { plan, value, daysUntilEnd, userEmail, alertType } = context;

  // Get base template
  const baseTemplate = getEmailTemplate(templateType);

  // Generate subject
  const subject = generateSubject(templateType, context);

  // Generate HTML content
  const html = generateHTMLContent(baseTemplate, context, personalizedMessage, subject);

  // Generate plain text content
  const text = generateTextContent(baseTemplate, context, personalizedMessage);

  return {
    subject,
    html,
    text,
  };
}

/**
 * Get base email template structure
 */
function getEmailTemplate(templateType: string): {
  header: string;
  footer: string;
  ctaButton?: string;
  ctaLink?: string;
} {
  const templates: Record<string, any> = {
    renewal_reminder: {
      header: 'Subscription Renewal Reminder',
      footer: 'Thank you for being a valued customer!',
      ctaButton: 'Review Subscription',
      ctaLink: '{{dashboard_url}}/subscription',
    },
    expiring_soon: {
      header: 'Your Subscription is Expiring Soon',
      footer: 'We hope to continue serving you!',
      ctaButton: 'Renew Now with Special Offer',
      ctaLink: '{{dashboard_url}}/renew?offer=special',
    },
    expired_recovery: {
      header: 'We Miss You! Special Offer Inside',
      footer: 'We\'d love to have you back!',
      ctaButton: 'Reactivate with 40% Off',
      ctaLink: '{{dashboard_url}}/reactivate?discount=40',
    },
    retention_offer: {
      header: 'Exclusive Offer Just for You',
      footer: 'Thank you for your continued support!',
      ctaButton: 'Claim Your Offer',
      ctaLink: '{{dashboard_url}}/retention-offer',
    },
    generic_alert: {
      header: 'Important Update About Your Subscription',
      footer: 'If you have any questions, please contact our support team.',
      ctaButton: 'View Details',
      ctaLink: '{{dashboard_url}}/subscription',
    },
  };

  return templates[templateType] || templates.generic_alert;
}

/**
 * Generate email subject line
 */
function generateSubject(templateType: string, context: AIAgentContext): string {
  const { plan, daysUntilEnd, value } = context;

  const subjects: Record<string, string> = {
    renewal_reminder: `Your ${plan} subscription renews in ${daysUntilEnd} days`,
    expiring_soon: daysUntilEnd <= 3
      ? `⏰ URGENT: Your subscription expires in ${daysUntilEnd} day(s)!`
      : `Your subscription expires in ${daysUntilEnd} days - Special offer inside`,
    expired_recovery: `We miss you! 40% off to come back`,
    retention_offer: `Exclusive offer for your ${plan} subscription`,
    generic_alert: `Update about your ${plan} subscription`,
  };

  return subjects[templateType] || subjects.generic_alert;
}

/**
 * Generate HTML email content
 */
function generateHTMLContent(
  template: any,
  context: AIAgentContext,
  personalizedMessage: string,
  subject: string
): string {
  const { plan, value, daysUntilEnd, userEmail } = context;
  const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3001';

  // Replace template variables
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #003A78 0%, #1F9D55 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${template.header}</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">${personalizedMessage}</p>
    
    ${value ? `<div style="background: #e8f5e9; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #1F9D55;">
        <strong>Subscription Value:</strong> $${value.toFixed(2)}/month
      </p>
    </div>` : ''}
    
    ${daysUntilEnd <= 7 ? `<div style="background: #fff4e6; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f39c12;">
      <p style="margin: 0; font-size: 14px; color: #f39c12;">
        <strong>⏰ Time Remaining:</strong> ${daysUntilEnd} day(s)
      </p>
    </div>` : ''}
    
    ${template.ctaButton ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${template.ctaLink?.replace('{{dashboard_url}}', dashboardUrl)}" 
         style="display: inline-block; background: #003A78; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        ${template.ctaButton}
      </a>
    </div>
    ` : ''}
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">${template.footer}</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated message from RetentionOS.<br>
      If you have questions, contact us at support@retentionos.com
    </p>
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Generate plain text email content
 */
function generateTextContent(
  template: any,
  context: AIAgentContext,
  personalizedMessage: string
): string {
  const { plan, value, daysUntilEnd } = context;
  const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:3001';

  let text = `${template.header}\n\n`;
  text += `${personalizedMessage}\n\n`;

  if (value) {
    text += `Subscription Value: $${value.toFixed(2)}/month\n\n`;
  }

  if (daysUntilEnd <= 7) {
    text += `⏰ Time Remaining: ${daysUntilEnd} day(s)\n\n`;
  }

  if (template.ctaButton) {
    text += `${template.ctaButton}: ${template.ctaLink?.replace('{{dashboard_url}}', dashboardUrl)}\n\n`;
  }

  text += `${template.footer}\n\n`;
  text += `---\n`;
  text += `This is an automated message from RetentionOS.\n`;
  text += `If you have questions, contact us at support@retentionos.com\n`;

  return text;
}

