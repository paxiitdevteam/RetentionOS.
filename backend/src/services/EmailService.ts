/**
 * Email Service
 * Handles sending emails to users and company
 * Supports SMTP and email service providers
 */

import nodemailer from 'nodemailer';
import EmailTemplate from '../models/EmailTemplate';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  template?: string;
  metadata?: Record<string, any>;
  from?: string;
}

export interface CompanyEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

// Email transporter (configured from environment)
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function getTransporter(): nodemailer.Transporter {
  if (transporter) {
    return transporter;
  }

  // Configure from environment variables
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  // If no SMTP config, use test account (for development)
  if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
    console.warn('⚠️  No SMTP credentials found. Using test account. Emails will not be sent in production.');
    transporter = nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'test@ethereal.email',
        pass: 'test',
      },
    });
  } else {
    transporter = nodemailer.createTransporter(smtpConfig);
  }

  return transporter;
}

/**
 * Send email to user
 */
export async function sendEmailToUser(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const mailTransporter = getTransporter();
    const fromEmail = options.from || process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@retentionos.com';

    const mailOptions = {
      from: `RetentionOS <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    // In development/test mode, log instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('📧 [DEV MODE] Email would be sent:');
      console.log('   To:', options.to);
      console.log('   Subject:', options.subject);
      console.log('   Template:', options.template);
      return { success: true, messageId: 'dev-mode-logged' };
    }

    const info = await mailTransporter.sendMail(mailOptions);

    // Log email sent (for audit)
    if (options.template) {
      await logEmailSent({
        to: options.to,
        template: options.template,
        subject: options.subject,
        messageId: info.messageId,
        metadata: options.metadata,
      });
    }

    console.log(`✅ Email sent to ${options.to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Error sending email to ${options.to}:`, error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send email to company/team
 */
export async function sendEmailToCompany(options: CompanyEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const mailTransporter = getTransporter();
    const companyEmail = process.env.COMPANY_EMAIL || process.env.SMTP_USER || 'alerts@retentionos.com';
    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    // Add priority indicator to subject
    const priorityPrefix = options.priority === 'urgent' ? '🚨 URGENT: ' : 
                          options.priority === 'high' ? '⚠️ HIGH: ' : 
                          options.priority === 'medium' ? '📢 ' : '';

    const mailOptions = {
      from: `RetentionOS Alerts <${process.env.SMTP_USER || 'alerts@retentionos.com'}>`,
      to: recipients,
      subject: `${priorityPrefix}${options.subject}`,
      html: options.html,
      text: options.text,
    };

    // In development/test mode, log instead of sending
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      console.log('📧 [DEV MODE] Company email would be sent:');
      console.log('   To:', recipients);
      console.log('   Subject:', mailOptions.subject);
      console.log('   Priority:', options.priority);
      return { success: true, messageId: 'dev-mode-logged' };
    }

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`✅ Company email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ Error sending company email:`, error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Log email sent (for tracking and analytics)
 */
async function logEmailSent(data: {
  to: string;
  template: string;
  subject: string;
  messageId: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    // Create email log entry (you can create an EmailLog model if needed)
    // For now, we'll just log to console
    console.log(`📧 Email logged: ${data.template} to ${data.to}`);
  } catch (error) {
    // Silent fail for logging
    console.error('Error logging email:', error);
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const mailTransporter = getTransporter();
    await mailTransporter.verify();
    return { success: true, message: 'Email configuration is valid' };
  } catch (error: any) {
    return { success: false, error: error.message || 'Email configuration test failed' };
  }
}

