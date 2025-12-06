/**
 * Analytics Page
 * Detailed analytics with charts and data visualization
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingState, Alert, Card } from '../components/ui';

interface OfferPerformance {
  offerType: string;
  totalShown: number;
  totalAccepted: number;
  acceptanceRate: number;
  totalRevenueSaved: number;
  averageRevenuePerAcceptance: number;
}

interface ChurnReason {
  reasonCode: string | null;
  count: number;
  percentage: number;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

const COLORS = ['#003A78', '#1F9D55', '#4A90E2', '#F5A623', '#D0021B'];

const Analytics: NextPage = () => {
  const { isAuthenticated } = useAuth();
  const [offerPerformance, setOfferPerformance] = useState<OfferPerformance[]>([]);
  const [churnReasons, setChurnReasons] = useState<ChurnReason[]>([]);
  const [revenueData, setRevenueData] = useState<TimeSeriesData[]>([]);
  const [usersData, setUsersData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
    }
  }, [isAuthenticated, days]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [offersRes, reasonsRes, revenueRes, usersRes] = await Promise.all([
        apiClient.getOfferPerformance(days),
        apiClient.getChurnReasons(),
        apiClient.getRevenueOverTime(days),
        apiClient.getUsersOverTime(days),
      ]);

      if (offersRes.success) setOfferPerformance(offersRes.offers);
      if (reasonsRes.success) setChurnReasons(reasonsRes.reasons);
      if (revenueRes.success) setRevenueData(revenueRes.data);
      if (usersRes.success) setUsersData(usersRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics');
      console.error('Error loading analytics:', err);
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
        <title>Analytics - RetentionOS Dashboard</title>
        <meta name="description" content="RetentionOS Analytics" />
      </Head>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#003A78', margin: 0 }}>
            Analytics
          </h1>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading analytics...
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

        {!loading && !error && (
          <>
            {/* Revenue Over Time Chart */}
            <Card padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
                Revenue Saved Over Time
              </h2>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#003A78" strokeWidth={2} name="Revenue Saved ($)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No revenue data available
                </div>
              )}
            </Card>

            {/* Users Saved Over Time Chart */}
            <Card padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
                Users Saved Over Time
              </h2>
              {usersData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={usersData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#1F9D55" strokeWidth={2} name="Users Saved" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No user data available
                </div>
              )}
            </Card>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              {/* Offer Performance Chart */}
              <Card padding="lg">
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
                  Offer Performance
                </h2>
                {offerPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={offerPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="offerType" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="acceptanceRate" fill="#003A78" name="Acceptance Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    No offer data available
                  </div>
                )}
              </Card>

              {/* Churn Reasons Chart */}
              <Card padding="lg">
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
                  Churn Reasons
                </h2>
                {churnReasons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={churnReasons}
                        dataKey="count"
                        nameKey="reasonCode"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {churnReasons.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    No churn reason data available
                  </div>
                )}
              </Card>
            </div>

            {/* Offer Performance Table */}
            <Card padding="lg" style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
                Offer Performance Details
              </h2>
              {offerPerformance.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: 600 }}>Offer Type</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Shown</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Accepted</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Acceptance Rate</th>
                      <th style={{ padding: '12px', textAlign: 'right', color: '#666', fontWeight: 600 }}>Revenue Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offerPerformance.map((offer, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', color: '#333', textTransform: 'capitalize' }}>{offer.offerType}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>{offer.totalShown.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#1F9D55', fontWeight: 600 }}>{offer.totalAccepted.toLocaleString()}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#666' }}>{offer.acceptanceRate.toFixed(1)}%</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#003A78', fontWeight: 600 }}>
                          ${offer.totalRevenueSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  No offer performance data available
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;

