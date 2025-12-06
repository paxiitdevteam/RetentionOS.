/**
 * AI Dashboard Page
 * Display AI performance metrics, churn risk predictions, and recommendations
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { LoadingState, Alert, Card } from '../components/ui';

interface AIPerformanceMetrics {
  totalOffers: number;
  totalAccepted: number;
  overallAcceptanceRate: number;
  offerPerformance: Array<{
    offerType: string;
    totalShown: number;
    totalAccepted: number;
    acceptanceRate: number;
    avgRevenueSaved: number;
  }>;
  weights: Array<{
    name: string;
    value: number;
  }>;
}

const AIPage: NextPage = () => {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<AIPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadMetrics();
    }
  }, [isAuthenticated]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getAIPerformance();
      if (response.success) {
        setMetrics(response.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load AI metrics');
      console.error('Error loading AI metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>AI Analytics - RetentionOS Dashboard</title>
        <meta name="description" content="AI Performance and Metrics" />
      </Head>

      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#003A78', marginBottom: '32px' }}>
          AI Analytics
        </h1>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading AI metrics...
          </div>
        )}

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

        {metrics && !loading && (
          <>
            {/* Overall Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
                marginBottom: '32px',
              }}
            >
              <Card padding="lg">
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Offers Shown
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#003A78', marginBottom: '8px' }}>
                  {metrics.totalOffers.toLocaleString()}
                </div>
              </Card>

              <Card padding="lg">
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Accepted
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#1F9D55', marginBottom: '8px' }}>
                  {metrics.totalAccepted.toLocaleString()}
                </div>
              </Card>

              <Card padding="lg">
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Overall Acceptance Rate
                </div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#003A78', marginBottom: '8px' }}>
                  {metrics.overallAcceptanceRate.toFixed(1)}%
                </div>
              </Card>
            </div>

            {/* Offer Performance Table */}
            <Card padding="lg" style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '20px' }}>
                Offer Performance by Type
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Offer Type</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Shown</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Accepted</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Acceptance Rate</th>
                    <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Avg Revenue Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.offerPerformance.map((offer, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', color: '#333', textTransform: 'capitalize', fontWeight: 500 }}>
                        {offer.offerType}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>
                        {offer.totalShown.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#1F9D55', fontWeight: 600 }}>
                        {offer.totalAccepted.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#003A78', fontWeight: 600 }}>
                        {offer.acceptanceRate.toFixed(1)}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>
                        ${offer.avgRevenueSaved.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {metrics.offerPerformance.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        No offer performance data yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            {/* AI Weights */}
            <Card padding="lg">
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '20px' }}>
                AI Model Weights
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {metrics.weights.map((weight, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '16px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', fontWeight: 500 }}>
                      {weight.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#003A78' }}>
                      {weight.value.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AIPage;

