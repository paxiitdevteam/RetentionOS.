/**
 * ROI Service
 * Calculates Return on Investment and revenue impact metrics
 * Helps SaaS owners understand the value RetentionOS provides
 */

import { getSummaryMetrics } from './AnalyticsService';
import Subscription from '../models/Subscription';
import OfferEvent from '../models/OfferEvent';
import { Op } from 'sequelize';

export interface ROIMetrics {
  // Revenue Metrics
  totalRevenueSaved: number;
  monthlyRevenueSaved: number;
  annualRevenueSaved: number;
  
  // Cost Metrics
  retentionOSMonthlyCost: number;
  retentionOSAnnualCost: number;
  
  // ROI Metrics
  monthlyROI: number; // Percentage
  annualROI: number; // Percentage
  roiMultiplier: number; // How many dollars returned per dollar spent
  
  // Efficiency Metrics
  costPerSavedCustomer: number;
  revenuePerDollarSpent: number;
  
  // Break-even Analysis
  breakEvenDays: number;
  breakEvenDate: Date | null;
  
  // Forecast Metrics
  projectedAnnualRevenue: number;
  projectedAnnualROI: number;
  
  // Risk Metrics
  revenueAtRisk: number; // Revenue that would be lost without RetentionOS
  customersAtRisk: number;
  
  // Performance Metrics
  totalCustomersSaved: number;
  averageRevenuePerSavedCustomer: number;
  
  // Time Period
  calculationPeriod: {
    startDate: Date;
    endDate: Date;
    days: number;
  };
}

export interface ROITrendData {
  date: string;
  revenueSaved: number;
  cost: number;
  roi: number;
  cumulativeROI: number;
}

/**
 * Calculate comprehensive ROI metrics
 * @param monthlyCost Monthly cost of RetentionOS subscription
 * @param days Number of days to analyze (default: 30)
 * @returns Complete ROI metrics
 */
export async function calculateROI(
  monthlyCost: number = 99, // Default to Growth plan
  days: number = 30
): Promise<ROIMetrics> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get summary metrics
  const summary = await getSummaryMetrics();

  // Calculate time-based revenue saved
  const totalRevenueSaved = summary.totalRevenueSaved || 0;
  const dailyRevenueSaved = days > 0 ? totalRevenueSaved / days : 0;
  const monthlyRevenueSaved = dailyRevenueSaved * 30;
  const annualRevenueSaved = dailyRevenueSaved * 365;

  // Calculate costs
  const retentionOSMonthlyCost = monthlyCost;
  const retentionOSAnnualCost = monthlyCost * 12;
  const periodCost = (monthlyCost / 30) * days;

  // Calculate ROI
  const monthlyROI = retentionOSMonthlyCost > 0
    ? ((monthlyRevenueSaved - retentionOSMonthlyCost) / retentionOSMonthlyCost) * 100
    : 0;
  
  const annualROI = retentionOSAnnualCost > 0
    ? ((annualRevenueSaved - retentionOSAnnualCost) / retentionOSAnnualCost) * 100
    : 0;

  const roiMultiplier = periodCost > 0
    ? totalRevenueSaved / periodCost
    : 0;

  // Calculate efficiency metrics
  const totalCustomersSaved = summary.totalSavedUsers || 0;
  const costPerSavedCustomer = totalCustomersSaved > 0
    ? periodCost / totalCustomersSaved
    : 0;

  const revenuePerDollarSpent = periodCost > 0
    ? totalRevenueSaved / periodCost
    : 0;

  // Calculate break-even
  const breakEvenDays = dailyRevenueSaved > 0
    ? Math.ceil(retentionOSMonthlyCost / dailyRevenueSaved)
    : Infinity;

  const breakEvenDate = breakEvenDays !== Infinity && breakEvenDays < 365
    ? new Date(Date.now() + breakEvenDays * 24 * 60 * 60 * 1000)
    : null;

  // Calculate projections
  const projectedAnnualRevenue = annualRevenueSaved;
  const projectedAnnualROI = annualROI;

  // Calculate revenue at risk (estimate based on churn rate)
  // This is revenue that would be lost if RetentionOS wasn't used
  const revenueAtRisk = totalRevenueSaved; // Simplified: assume all saved revenue was at risk
  const customersAtRisk = totalCustomersSaved;

  // Calculate average revenue per saved customer
  const averageRevenuePerSavedCustomer = totalCustomersSaved > 0
    ? totalRevenueSaved / totalCustomersSaved
    : 0;

  return {
    totalRevenueSaved,
    monthlyRevenueSaved,
    annualRevenueSaved,
    retentionOSMonthlyCost,
    retentionOSAnnualCost,
    monthlyROI,
    annualROI,
    roiMultiplier,
    costPerSavedCustomer,
    revenuePerDollarSpent,
    breakEvenDays: breakEvenDays === Infinity ? 0 : breakEvenDays,
    breakEvenDate,
    projectedAnnualRevenue,
    projectedAnnualROI,
    revenueAtRisk,
    customersAtRisk,
    totalCustomersSaved,
    averageRevenuePerSavedCustomer,
    calculationPeriod: {
      startDate,
      endDate,
      days,
    },
  };
}

/**
 * Get ROI trend over time
 * @param monthlyCost Monthly cost of RetentionOS
 * @param days Number of days to analyze
 * @returns Array of daily ROI data points
 */
export async function getROITrend(
  monthlyCost: number = 99,
  days: number = 30
): Promise<ROITrendData[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get offer events grouped by date
  const offerEvents = await OfferEvent.findAll({
    where: {
      accepted: true,
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    },
    attributes: [
      [OfferEvent.sequelize!.fn('DATE', OfferEvent.sequelize!.col('created_at')), 'date'],
      [OfferEvent.sequelize!.fn('SUM', OfferEvent.sequelize!.col('revenue_saved')), 'revenue'],
    ],
    group: [OfferEvent.sequelize!.fn('DATE', OfferEvent.sequelize!.col('created_at'))],
    order: [[OfferEvent.sequelize!.fn('DATE', OfferEvent.sequelize!.col('created_at')), 'ASC']],
    raw: true,
  });

  const dailyCost = monthlyCost / 30;
  let cumulativeRevenue = 0;
  let cumulativeCost = 0;

  const trendData: ROITrendData[] = [];

  // Fill in all days, even if no events
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Find revenue for this date
    const dayEvent = offerEvents.find((e: any) => {
      const eventDate = new Date(e.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });

    const dayRevenue = dayEvent ? parseFloat(dayEvent.revenue as string) || 0 : 0;
    cumulativeRevenue += dayRevenue;
    cumulativeCost += dailyCost;

    const dayROI = dailyCost > 0
      ? ((dayRevenue - dailyCost) / dailyCost) * 100
      : 0;

    const cumulativeROI = cumulativeCost > 0
      ? ((cumulativeRevenue - cumulativeCost) / cumulativeCost) * 100
      : 0;

    trendData.push({
      date: dateStr,
      revenueSaved: dayRevenue,
      cost: dailyCost,
      roi: dayROI,
      cumulativeROI,
    });
  }

  return trendData;
}

/**
 * Get revenue impact forecast
 * Projects future revenue saved based on current trends
 * @param monthlyCost Monthly cost of RetentionOS
 * @param forecastDays Number of days to forecast (default: 90)
 * @returns Forecast data
 */
export async function getRevenueForecast(
  monthlyCost: number = 99,
  forecastDays: number = 90
): Promise<{
  currentMonthlyRevenue: number;
  projectedRevenue: Array<{
    date: string;
    projectedRevenue: number;
    projectedROI: number;
    cumulativeRevenue: number;
  }>;
  forecastConfidence: number; // 0-100
}> {
  const roi = await calculateROI(monthlyCost, 30);
  const currentMonthlyRevenue = roi.monthlyRevenueSaved;

  // Simple linear projection (can be enhanced with ML later)
  const dailyRevenue = currentMonthlyRevenue / 30;
  const dailyCost = monthlyCost / 30;

  const projectedRevenue = [];
  let cumulativeRevenue = 0;

  for (let i = 1; i <= forecastDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const projectedDailyRevenue = dailyRevenue;
    cumulativeRevenue += projectedDailyRevenue;
    const cumulativeCost = dailyCost * i;

    const projectedROI = cumulativeCost > 0
      ? ((cumulativeRevenue - cumulativeCost) / cumulativeCost) * 100
      : 0;

    projectedRevenue.push({
      date: dateStr,
      projectedRevenue: projectedDailyRevenue,
      projectedROI,
      cumulativeRevenue,
    });
  }

  // Confidence based on data quality (simplified)
  const forecastConfidence = 75; // Can be enhanced with statistical analysis

  return {
    currentMonthlyRevenue,
    projectedRevenue,
    forecastConfidence,
  };
}

