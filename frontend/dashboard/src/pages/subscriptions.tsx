/**
 * Subscriptions Monitoring Page
 * Shows upcoming subscriptions, alerts, and proactive retention status
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

interface UpcomingSubscription {
  subscriptionId: number;
  userId: number;
  userEmail: string | null;
  plan: string;
  value: number | null;
  endDate: string;
  daysUntilEnd: number;
  status: string;
  cancelAttempts: number;
}

interface Alert {
  id: number;
  subscriptionId: number;
  userId: number;
  alertType: string;
  message: string;
  read: boolean;
  createdAt: string;
  subscription?: {
    id: number;
    user?: {
      email: string;
      plan: string;
    };
  };
}

const Subscriptions: NextPage = () => {
  const { isAuthenticated } = useAuth();
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<UpcomingSubscription[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'alerts' | 'stats'>('subscriptions');
  const [daysFilter, setDaysFilter] = useState(30);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, daysFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subscriptionsRes, alertsRes, statsRes] = await Promise.all([
        apiClient.getUpcomingSubscriptions(daysFilter),
        apiClient.getAlerts(50),
        apiClient.getSubscriptionStats(),
      ]);

      if (subscriptionsRes.success) {
        setUpcomingSubscriptions(subscriptionsRes.subscriptions);
      }
      if (alertsRes.success) {
        setAlerts(alertsRes.alerts);
      }
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (error: any) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRetention = async () => {
    if (!confirm('Trigger proactive retention for all subscriptions expiring in 7 days?')) {
      return;
    }

    try {
      const response = await apiClient.triggerProactiveRetention(7);
      if (response.success) {
        alert(`✅ Triggered ${response.triggered} retention flows (${response.failed} failed)`);
        loadData();
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to trigger retention'}`);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      const response = await apiClient.checkAlerts();
      if (response.success) {
        alert(`✅ Checked and sent ${response.count} alerts`);
        loadData();
      }
    } catch (error: any) {
      alert(`Error: ${error.message || 'Failed to check alerts'}`);
    }
  };

  const handleMarkAlertAsRead = async (alertId: number) => {
    try {
      await apiClient.markAlertAsRead(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)));
    } catch (error: any) {
      console.error('Error marking alert as read:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Subscription Monitoring - RetentionOS Dashboard</title>
        <meta name="description" content="Monitor subscriptions and proactive retention" />
      </Head>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#003A78' }}>Subscription Monitoring</h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleCheckAlerts}
              style={{
                padding: '10px 20px',
                background: '#003A78',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Check Alerts
            </button>
            <button
              onClick={handleTriggerRetention}
              style={{
                padding: '10px 20px',
                background: '#1F9D55',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Trigger Retention (7 days)
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e0e0e0' }}>
          <button
            onClick={() => setActiveTab('subscriptions')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'subscriptions' ? '#003A78' : 'transparent',
              color: activeTab === 'subscriptions' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'subscriptions' ? '2px solid #003A78' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Upcoming Subscriptions
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'alerts' ? '#003A78' : 'transparent',
              color: activeTab === 'alerts' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'alerts' ? '2px solid #003A78' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Alerts ({alerts.filter((a) => !a.read).length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'stats' ? '#003A78' : 'transparent',
              color: activeTab === 'stats' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'stats' ? '2px solid #003A78' : '2px solid transparent',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Statistics
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
        ) : (
          <>
            {activeTab === 'subscriptions' && (
              <div>
                <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>Show subscriptions expiring in:</label>
                  <select
                    value={daysFilter}
                    onChange={(e) => setDaysFilter(parseInt(e.target.value))}
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>

                <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>User Email</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Plan</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Value</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Days Until End</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 600 }}>Cancel Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingSubscriptions.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#666' }}>
                            No upcoming subscriptions found
                          </td>
                        </tr>
                      ) : (
                        upcomingSubscriptions.map((sub) => (
                          <tr key={sub.subscriptionId} style={{ borderTop: '1px solid #e0e0e0' }}>
                            <td style={{ padding: '12px', fontSize: '14px' }}>{sub.userEmail || 'N/A'}</td>
                            <td style={{ padding: '12px', fontSize: '14px' }}>{sub.plan}</td>
                            <td style={{ padding: '12px', fontSize: '14px' }}>${sub.value?.toFixed(2) || '0.00'}</td>
                            <td style={{ padding: '12px', fontSize: '14px' }}>
                              <span
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  background: sub.daysUntilEnd <= 7 ? '#fee' : sub.daysUntilEnd <= 14 ? '#fff4e6' : '#e8f5e9',
                                  color: sub.daysUntilEnd <= 7 ? '#c33' : sub.daysUntilEnd <= 14 ? '#f39c12' : '#1F9D55',
                                  fontWeight: 600,
                                }}
                              >
                                {sub.daysUntilEnd} days
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontSize: '14px' }}>{sub.status}</td>
                            <td style={{ padding: '12px', fontSize: '14px' }}>{sub.cancelAttempts}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div>
                <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  {alerts.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No alerts</div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        style={{
                          padding: '16px',
                          borderBottom: '1px solid #e0e0e0',
                          background: alert.read ? 'white' : '#f0f4f8',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#003A78',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                              }}
                            >
                              {alert.alertType.replace(/_/g, ' ')}
                            </span>
                            {!alert.read && (
                              <span
                                style={{
                                  padding: '2px 6px',
                                  borderRadius: '12px',
                                  background: '#e74c3c',
                                  color: 'white',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                }}
                              >
                                NEW
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '14px', color: '#333', marginBottom: '4px' }}>{alert.message}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {alert.subscription?.user?.email || 'User'} • {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {!alert.read && (
                          <button
                            onClick={() => handleMarkAlertAsRead(alert.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              color: '#003A78',
                              border: '1px solid #003A78',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Active</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#003A78' }}>{stats.totalActive}</div>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Expiring in 7 Days</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#e74c3c' }}>{stats.expiringIn7Days}</div>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Expiring in 30 Days</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#f39c12' }}>{stats.expiringIn30Days}</div>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Value at Risk</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#1F9D55' }}>${stats.totalValueAtRisk.toFixed(2)}</div>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Avg Days Until Expiration</div>
                  <div style={{ fontSize: '32px', fontWeight: 700, color: '#003A78' }}>{stats.averageDaysUntilExpiration}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Subscriptions;

