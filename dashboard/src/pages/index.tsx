/**
 * RetentionOS Dashboard - Overview Page
 * Main dashboard with analytics summary
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { LoadingState, Alert, Card } from '../components/ui';

interface SummaryData {
  totalRevenueSaved: number;
  totalUsersSaved: number;
  totalOffersShown: number;
  totalOffersAccepted: number;
  acceptanceRate: number;
  averageRevenuePerSavedUser: number;
}

const Dashboard: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated) {
      loadSummary();
    }
  }, [isAuthenticated, authLoading]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAnalyticsSummary();
      if (response.success) {
        setSummary(response.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading summary:', err);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#F5F5F5'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Loading...</div>
          <div style={{ fontSize: '14px' }}>Checking authentication</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#F5F5F5'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          Redirecting to login...
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Overview - RetentionOS Dashboard</title>
        <meta name="description" content="RetentionOS Dashboard Overview" />
      </Head>

      <div>

        {loading && <LoadingState message="Loading analytics..." />}

        {error && (
          <div style={{ marginBottom: '24px' }}>
            <Alert type="error" title="Error loading analytics">
              {error}
            </Alert>
          </div>
        )}

        {summary && !loading && (
          <>
            {/* Metric Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '40px',
              }}
            >
              <MetricCard
                title="Revenue Saved"
                value={`$${summary.totalRevenueSaved.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                subtitle="Total revenue saved from retention"
              />
              <MetricCard
                title="Users Saved"
                value={summary.totalUsersSaved}
                subtitle="Users who accepted retention offers"
              />
              <MetricCard
                title="Acceptance Rate"
                value={`${summary.acceptanceRate.toFixed(1)}%`}
                subtitle={`${summary.totalOffersAccepted} of ${summary.totalOffersShown} offers`}
              />
              <MetricCard
                title="Avg Revenue/User"
                value={`$${summary.averageRevenuePerSavedUser.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
                subtitle="Average revenue saved per user"
              />
            </div>

            {/* Quick Stats */}
            <div
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '32px',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#003A78',
                  marginBottom: '16px',
                }}
              >
                Quick Stats
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Total Offers Shown
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#333' }}>
                    {summary.totalOffersShown.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                    Total Offers Accepted
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 600, color: '#1F9D55' }}>
                    {summary.totalOffersAccepted.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Section */}
            <Card padding="lg">
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#003A78',
                  marginBottom: '16px',
                }}
              >
                System Status
              </h2>
              <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                <p>✅ Dashboard connected to backend API</p>
                <p>✅ Analytics data loaded successfully</p>
                <p>📊 View detailed analytics on the Analytics page</p>
                <p>🔄 Manage retention flows on the Flows page</p>
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
