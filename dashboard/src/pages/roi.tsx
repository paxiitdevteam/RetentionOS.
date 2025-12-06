/**
 * ROI Dashboard Page
 * Shows Return on Investment metrics and revenue impact analysis
 */

import { NextPage } from 'next';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import apiClient from '../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { LoadingState, Card } from '../components/ui';

interface ROIMetrics {
  totalRevenueSaved: number;
  monthlyRevenueSaved: number;
  annualRevenueSaved: number;
  retentionOSMonthlyCost: number;
  retentionOSAnnualCost: number;
  monthlyROI: number;
  annualROI: number;
  roiMultiplier: number;
  costPerSavedCustomer: number;
  revenuePerDollarSpent: number;
  breakEvenDays: number;
  breakEvenDate: string | null;
  projectedAnnualRevenue: number;
  projectedAnnualROI: number;
  revenueAtRisk: number;
  customersAtRisk: number;
  totalCustomersSaved: number;
  averageRevenuePerSavedCustomer: number;
  calculationPeriod: {
    startDate: string;
    endDate: string;
    days: number;
  };
}

interface ROITrendData {
  date: string;
  revenueSaved: number;
  cost: number;
  roi: number;
  cumulativeROI: number;
}

interface ForecastData {
  date: string;
  projectedRevenue: number;
  projectedROI: number;
  cumulativeRevenue: number;
}

const ROI: NextPage = () => {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<ROIMetrics | null>(null);
  const [trendData, setTrendData] = useState<ROITrendData[]>([]);
  const [forecast, setForecast] = useState<{ currentMonthlyRevenue: number; projectedRevenue: ForecastData[]; forecastConfidence: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyCost, setMonthlyCost] = useState<number | undefined>(undefined); // Auto-detect by default
  const [days, setDays] = useState(30);
  const [autoDetectedCost, setAutoDetectedCost] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadROIData();
    }
  }, [isAuthenticated, monthlyCost, days]);

  const loadROIData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsRes, trendRes, forecastRes] = await Promise.all([
        apiClient.getROIMetrics(monthlyCost, days),
        apiClient.getROITrend(monthlyCost, days),
        apiClient.getRevenueForecast(monthlyCost, 90),
      ]);

      if (metricsRes.success) {
        setMetrics(metricsRes.metrics);
        // Store auto-detected cost for display
        if (!monthlyCost && metricsRes.metrics.retentionOSMonthlyCost) {
          setAutoDetectedCost(metricsRes.metrics.retentionOSMonthlyCost);
        }
      }
      if (trendRes.success) setTrendData(trendRes.trend);
      if (forecastRes.success) setForecast(forecastRes.forecast);
    } catch (err: any) {
      setError(err.message || 'Failed to load ROI data');
      console.error('Error loading ROI data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>ROI Calculator - RetentionOS Dashboard</title>
        <meta name="description" content="RetentionOS ROI Calculator and Revenue Impact Analysis" />
      </Head>

      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#003A78', margin: 0 }}>
              ROI Calculator
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
              Measure the return on investment and revenue impact of RetentionOS
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>
                Monthly Cost {autoDetectedCost && `(Auto: $${autoDetectedCost})`}:
              </label>
              <input
                type="number"
                value={monthlyCost ?? ''}
                onChange={(e) => setMonthlyCost(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder={autoDetectedCost ? `Auto: $${autoDetectedCost}` : 'Auto-detect'}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  width: '120px',
                }}
              />
              {monthlyCost && (
                <button
                  onClick={() => setMonthlyCost(undefined)}
                  style={{
                    marginLeft: '8px',
                    padding: '4px 8px',
                    fontSize: '12px',
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Reset to Auto
                </button>
              )}
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#666', marginRight: '8px' }}>Days:</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{
                  padding: '6px 10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '24px',
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : metrics ? (
          <>
            {/* Key ROI Metrics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <Card style={{ padding: '24px', background: 'linear-gradient(135deg, #003A78 0%, #0056b3 100%)', color: 'white' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Monthly ROI</div>
                <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>
                  {formatPercentage(metrics.monthlyROI)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {formatCurrency(metrics.monthlyRevenueSaved)} saved / {formatCurrency(metrics.retentionOSMonthlyCost)} cost
                </div>
              </Card>

              <Card style={{ padding: '24px', background: 'linear-gradient(135deg, #1F9D55 0%, #2ECC71 100%)', color: 'white' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>ROI Multiplier</div>
                <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>
                  {metrics.roiMultiplier.toFixed(1)}x
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {formatCurrency(metrics.revenuePerDollarSpent)} per dollar spent
                </div>
              </Card>

              <Card style={{ padding: '24px', background: 'linear-gradient(135deg, #4A90E2 0%, #6BB6FF 100%)', color: 'white' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Annual ROI</div>
                <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>
                  {formatPercentage(metrics.annualROI)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {formatCurrency(metrics.annualRevenueSaved)} projected
                </div>
              </Card>

              <Card style={{ padding: '24px', background: 'linear-gradient(135deg, #F5A623 0%, #FFC857 100%)', color: 'white' }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Break-Even</div>
                <div style={{ fontSize: '36px', fontWeight: 700, marginBottom: '4px' }}>
                  {metrics.breakEvenDays > 0 ? `${metrics.breakEvenDays} days` : 'N/A'}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {metrics.breakEvenDate ? formatDate(metrics.breakEvenDate) : 'Already profitable'}
                </div>
              </Card>
            </div>

            {/* Revenue Impact Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <Card style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Revenue Saved
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1F9D55' }}>
                  {formatCurrency(metrics.totalRevenueSaved)}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Over {metrics.calculationPeriod.days} days
                </div>
              </Card>

              <Card style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Monthly Revenue Saved
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1F9D55' }}>
                  {formatCurrency(metrics.monthlyRevenueSaved)}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Projected monthly
                </div>
              </Card>

              <Card style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Annual Revenue Saved
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#1F9D55' }}>
                  {formatCurrency(metrics.annualRevenueSaved)}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Projected annual
                </div>
              </Card>

              <Card style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Customers Saved
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#4A90E2' }}>
                  {metrics.totalCustomersSaved}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  {formatCurrency(metrics.averageRevenuePerSavedCustomer)} avg per customer
                </div>
              </Card>

              <Card style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cost per Saved Customer
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#F5A623' }}>
                  {formatCurrency(metrics.costPerSavedCustomer)}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Efficiency metric
                </div>
              </Card>

              <Card style={{ padding: '20px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Revenue at Risk
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#D0021B' }}>
                  {formatCurrency(metrics.revenueAtRisk)}
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                  Without RetentionOS
                </div>
              </Card>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              {/* ROI Trend Chart */}
              <Card style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#003A78', marginBottom: '20px' }}>
                  ROI Trend Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any) => formatPercentage(value)}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="cumulativeROI"
                      stroke="#003A78"
                      fill="#003A78"
                      fillOpacity={0.3}
                      name="Cumulative ROI %"
                    />
                    <Area
                      type="monotone"
                      dataKey="roi"
                      stroke="#1F9D55"
                      fill="#1F9D55"
                      fillOpacity={0.2}
                      name="Daily ROI %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Revenue vs Cost Chart */}
              <Card style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#003A78', marginBottom: '20px' }}>
                  Revenue Saved vs Cost
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(value)}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Bar dataKey="revenueSaved" fill="#1F9D55" name="Revenue Saved" />
                    <Bar dataKey="cost" fill="#F5A623" name="Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Revenue Forecast */}
            {forecast && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Cumulative Revenue Chart */}
                <Card style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#003A78', marginBottom: '20px' }}>
                    Cumulative Revenue Forecast
                  </h3>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    Confidence: {forecast.forecastConfidence}%
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecast.projectedRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cumulativeRevenue"
                        stroke="#1F9D55"
                        strokeWidth={2}
                        name="Cumulative Revenue Saved"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* ROI Forecast Chart */}
                <Card style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#003A78', marginBottom: '20px' }}>
                    Projected ROI Forecast
                  </h3>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                    Confidence: {forecast.forecastConfidence}%
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={forecast.projectedRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatPercentage(value)}
                      />
                      <Tooltip
                        formatter={(value: any) => formatPercentage(value)}
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="projectedROI"
                        stroke="#003A78"
                        strokeWidth={2}
                        name="Projected ROI %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            )}

            {/* Summary Section */}
            <Card style={{ padding: '24px', background: '#f8f9fa' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#003A78', marginBottom: '16px' }}>
                Summary
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Investment</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                    {formatCurrency(metrics.retentionOSMonthlyCost)}/month ({formatCurrency(metrics.retentionOSAnnualCost)}/year)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Return</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#1F9D55' }}>
                    {formatCurrency(metrics.monthlyRevenueSaved)}/month ({formatCurrency(metrics.annualRevenueSaved)}/year)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Net Benefit</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#003A78' }}>
                    {formatCurrency(metrics.monthlyRevenueSaved - metrics.retentionOSMonthlyCost)}/month
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Calculation Period</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                    {formatDate(metrics.calculationPeriod.startDate)} - {formatDate(metrics.calculationPeriod.endDate)}
                  </div>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            No ROI data available. Start using RetentionOS to see your ROI metrics.
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ROI;

