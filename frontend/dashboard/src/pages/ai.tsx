/**
 * AI Agent Dashboard Page
 * Display AI agent activity, email logs, alert processing, and performance metrics
 * Makes the AI agent visible and transparent for both SaaS owners and users
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { MessageModal } from '../components/Modal';

interface AIAgentActivity {
  id: number;
  subscriptionId: number;
  userId: number;
  alertType: string;
  action: string;
  priority: string;
  message: string;
  status: 'success' | 'failed';
  timestamp: string;
  metadata?: any;
}

interface EmailLog {
  id: number;
  to: string;
  subject: string;
  template: string;
  status: 'sent' | 'failed';
  timestamp: string;
  metadata?: any;
}

interface AIAgentStats {
  totalProcessed: number;
  successful: number;
  failed: number;
  emailsSent: number;
  alertsProcessed: number;
  retentionFlowsTriggered: number;
  companyNotificationsSent: number;
  last24Hours: {
    processed: number;
    successful: number;
    failed: number;
  };
}

const AIPage: NextPage = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'activity' | 'emails' | 'performance'>('activity');
  const [activity, setActivity] = useState<AIAgentActivity[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<AIAgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'activity') {
        const [activityRes, statsRes] = await Promise.all([
          apiClient.getAIAgentActivity(),
          apiClient.getAIAgentStats(),
        ]);
        if (activityRes.success) setActivity(activityRes.activity || []);
        if (statsRes.success) setStats(statsRes.stats);
      } else if (activeTab === 'emails') {
        const emailRes = await apiClient.getEmailLogs();
        if (emailRes.success) setEmailLogs(emailRes.logs || []);
      } else if (activeTab === 'performance') {
        const [performanceRes, statsRes] = await Promise.all([
          apiClient.getAIPerformance(),
          apiClient.getAIAgentStats(),
        ]);
        if (performanceRes.success) {
          // Performance metrics handled separately
        }
        if (statsRes.success) setStats(statsRes.stats);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load AI agent data');
      console.error('Error loading AI agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPending = async () => {
    try {
      setProcessing(true);
      const result = await apiClient.processPendingAlertsWithAI();
      if (result.success) {
        setShowMessageModal({
          type: 'success',
          title: 'Success',
          message: `Processed ${result.processed} alerts (${result.successful} successful, ${result.failed} failed)`,
        });
        loadData();
      }
    } catch (err: any) {
      setShowMessageModal({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to process alerts',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#D0021B';
      case 'high': return '#F5A623';
      case 'medium': return '#4A90E2';
      case 'low': return '#666';
      default: return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? '#1F9D55' : '#D0021B';
  };

  return (
    <Layout>
      <Head>
        <title>AI Automation - RetentionOS</title>
        <meta name="description" content="AI automation activity, email logs, and performance monitoring" />
      </Head>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#003A78', margin: 0, marginBottom: '8px' }}>
              🤖 AI Automation
            </h1>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Automated monitoring, email alerts, and retention flow triggers
            </p>
          </div>
          <button
            onClick={handleProcessPending}
            disabled={processing}
            style={{
              padding: '10px 20px',
              background: processing ? '#ccc' : '#003A78',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: processing ? 'not-allowed' : 'pointer',
            }}
          >
            {processing ? 'Processing...' : '🔄 Process Pending Alerts'}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: '#fee',
              color: '#c33',
              padding: '16px',
              borderRadius: '6px',
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase' }}>
                Total Processed
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#003A78' }}>
                {stats.totalProcessed.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Last 24h: {stats.last24Hours.processed}
              </div>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase' }}>
                Success Rate
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#1F9D55' }}>
                {stats.totalProcessed > 0 ? ((stats.successful / stats.totalProcessed) * 100).toFixed(1) : 0}%
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {stats.successful} successful
              </div>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase' }}>
                Emails Sent
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#4A90E2' }}>
                {stats.emailsSent.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                To users & company
              </div>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500, textTransform: 'uppercase' }}>
                Retention Flows
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#F5A623' }}>
                {stats.retentionFlowsTriggered.toLocaleString()}
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Auto-triggered
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e0e0e0' }}>
          <button
            onClick={() => setActiveTab('activity')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'activity' ? '#003A78' : 'transparent',
              color: activeTab === 'activity' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'activity' ? '3px solid #003A78' : '3px solid transparent',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📋 Recent Activity
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'emails' ? '#003A78' : 'transparent',
              color: activeTab === 'emails' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'emails' ? '3px solid #003A78' : '3px solid transparent',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📧 Email Logs
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            style={{
              padding: '12px 24px',
              background: activeTab === 'performance' ? '#003A78' : 'transparent',
              color: activeTab === 'performance' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'performance' ? '3px solid #003A78' : '3px solid transparent',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            📊 Performance Metrics
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading AI agent data...
          </div>
        )}

        {/* Activity Tab */}
        {!loading && activeTab === 'activity' && (
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', margin: 0 }}>
                Recent AI Agent Activity
              </h2>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px', margin: 0 }}>
                Real-time view of AI agent actions: alerts processed, emails sent, retention flows triggered
              </p>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {activity.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No activity yet. AI automation will process alerts automatically when subscriptions expire.
                </div>
              ) : (
                activity.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f0f0f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: getPriorityColor(item.priority) + '20',
                            color: getPriorityColor(item.priority),
                            textTransform: 'uppercase',
                          }}
                        >
                          {item.priority}
                        </span>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: getStatusColor(item.status) + '20',
                            color: getStatusColor(item.status),
                          }}
                        >
                          {item.status}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                          {item.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                        {item.message}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        Alert: {item.alertType} • Subscription #{item.subscriptionId} • User #{item.userId} • {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Email Logs Tab */}
        {!loading && activeTab === 'emails' && (
          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e0e0e0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', margin: 0 }}>
                Email Logs
              </h2>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '8px', margin: 0 }}>
                All emails sent by AI agent to users and company notifications
              </p>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {emailLogs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No emails sent yet. AI automation will send emails automatically when processing alerts.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Time</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>To</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Subject</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Template</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#666', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#333', fontWeight: 500 }}>
                          {log.to}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#333' }}>
                          {log.subject}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                          <span style={{ padding: '4px 8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '11px' }}>
                            {log.template}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: getStatusColor(log.status) + '20',
                              color: getStatusColor(log.status),
                            }}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {!loading && activeTab === 'performance' && (
          <div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #e0e0e0', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
                Automation Performance Overview
              </h2>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>
                AI automation automatically monitors subscriptions, sends personalized emails, and triggers retention flows.
                All actions are logged and visible here for complete transparency.
              </p>
              {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Alerts Processed</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#003A78' }}>{stats.alertsProcessed}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Company Notifications</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#4A90E2' }}>{stats.companyNotificationsSent}</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Last 24h Success Rate</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#1F9D55' }}>
                      {stats.last24Hours.processed > 0
                        ? ((stats.last24Hours.successful / stats.last24Hours.processed) * 100).toFixed(1)
                        : 0}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && (
          <MessageModal
            isOpen={!!showMessageModal}
            onClose={() => setShowMessageModal(null)}
            type={showMessageModal.type}
            title={showMessageModal.title}
            message={showMessageModal.message}
          />
        )}
      </div>
    </Layout>
  );
};

export default AIPage;
