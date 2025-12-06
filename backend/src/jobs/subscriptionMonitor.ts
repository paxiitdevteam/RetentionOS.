/**
 * Subscription Monitor Job
 * Scheduled job to check subscriptions and trigger proactive retention
 * Run this daily via cron or scheduler
 */

import {
  checkAndSendAlerts,
  triggerProactiveRetention,
  getSubscriptionStats,
} from '../services/SubscriptionMonitorService';
import { getAlertStats } from '../services/AlertService';

/**
 * Run daily subscription monitoring
 * This should be called by a cron job or scheduler
 */
export async function runDailySubscriptionMonitor(): Promise<void> {
  console.log('🔄 Starting daily subscription monitor...');
  const startTime = Date.now();

  try {
    // 1. Check and send alerts for upcoming subscriptions
    console.log('📧 Checking alerts for upcoming subscriptions...');
    const alerts = await checkAndSendAlerts([30, 14, 7, 3, 1]);
    console.log(`✅ Sent ${alerts.length} alerts`);

    // 2. Trigger proactive retention for subscriptions expiring in 7 days
    console.log('🎯 Triggering proactive retention for subscriptions expiring in 7 days...');
    const retentionResults = await triggerProactiveRetention(7);
    const successful = retentionResults.filter((r) => r.success).length;
    const failed = retentionResults.filter((r) => !r.success).length;
    console.log(`✅ Triggered ${successful} retention flows (${failed} failed)`);

    // 3. Get statistics
    const stats = await getSubscriptionStats();
    const alertStats = await getAlertStats();

    console.log('📊 Subscription Statistics:');
    console.log(`   Total Active: ${stats.totalActive}`);
    console.log(`   Expiring in 7 days: ${stats.expiringIn7Days}`);
    console.log(`   Expiring in 30 days: ${stats.expiringIn30Days}`);
    console.log(`   Total Value at Risk: $${stats.totalValueAtRisk}`);
    console.log(`   Unread Alerts: ${alertStats.unread}`);

    const duration = Date.now() - startTime;
    console.log(`✅ Daily subscription monitor completed in ${duration}ms`);
  } catch (error: any) {
    console.error('❌ Error in daily subscription monitor:', error);
    throw error;
  }
}

/**
 * Run subscription monitor (can be called manually or via cron)
 */
if (require.main === module) {
  runDailySubscriptionMonitor()
    .then(() => {
      console.log('✅ Monitor job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Monitor job failed:', error);
      process.exit(1);
    });
}

