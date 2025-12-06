/**
 * Analytics Service
 * Generate values for the admin dashboard
 * Per backend-services.md specification
 */

import { Op, Sequelize } from 'sequelize';
import OfferEvent from '../models/OfferEvent';
import ChurnReason from '../models/ChurnReason';

export interface SummaryMetrics {
  totalRevenueSaved: number;
  totalUsersSaved: number;
  totalOffersShown: number;
  totalOffersAccepted: number;
  acceptanceRate: number;
  averageRevenuePerSavedUser: number;
}

export interface TimeSeriesDataPoint {
  date: string; // ISO date string
  value: number;
}

export interface OfferPerformance {
  offerType: string;
  totalShown: number;
  totalAccepted: number;
  acceptanceRate: number;
  totalRevenueSaved: number;
  averageRevenuePerAcceptance: number;
}

export interface ChurnReasonData {
  reasonCode: string | null;
  count: number;
  percentage: number;
}

/**
 * Get overall summary metrics
 * @returns Summary metrics object
 */
export async function getSummaryMetrics(): Promise<SummaryMetrics> {
  // Get all accepted offers with revenue saved
  const acceptedOffers = await OfferEvent.findAll({
    where: {
      accepted: true,
    },
  });

  // Calculate total revenue saved
  const totalRevenueSaved = acceptedOffers.reduce(
    (sum, event) => sum + (event.revenueSaved || 0),
    0
  );

  // Calculate unique users saved (users who accepted at least one offer)
  const uniqueUsersSaved = new Set(
    acceptedOffers
      .filter(e => e.userId !== null)
      .map(e => e.userId)
  ).size;

  // Get total offers shown
  const totalOffersShown = await OfferEvent.count();

  // Get total offers accepted
  const totalOffersAccepted = acceptedOffers.length;

  // Calculate acceptance rate
  const acceptanceRate = totalOffersShown > 0
    ? (totalOffersAccepted / totalOffersShown) * 100
    : 0;

  // Calculate average revenue per saved user
  const averageRevenuePerSavedUser = uniqueUsersSaved > 0
    ? totalRevenueSaved / uniqueUsersSaved
    : 0;

  return {
    totalRevenueSaved: Math.round(totalRevenueSaved * 100) / 100,
    totalUsersSaved: uniqueUsersSaved,
    totalOffersShown,
    totalOffersAccepted,
    acceptanceRate: Math.round(acceptanceRate * 100) / 100,
    averageRevenuePerSavedUser: Math.round(averageRevenuePerSavedUser * 100) / 100,
  };
}

/**
 * Get revenue saved over time
 * @param days Number of days to look back (default: 30)
 * @returns Array of time-series data points
 */
export async function getSavedRevenueOverTime(days: number = 30): Promise<TimeSeriesDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query revenue saved grouped by date
  const results = await OfferEvent.findAll({
    where: {
      accepted: true,
      createdAt: {
        [Op.gte]: startDate,
      },
    },
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
      [Sequelize.fn('SUM', Sequelize.col('revenue_saved')), 'total'],
    ],
    group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
    raw: true,
  });

  // Format results
  return results.map((row: any) => ({
    date: row.date.toISOString().split('T')[0],
    value: parseFloat(row.total || 0),
  }));
}

/**
 * Get users saved over time
 * @param days Number of days to look back (default: 30)
 * @returns Array of time-series data points
 */
export async function getSavedUsersOverTime(days: number = 30): Promise<TimeSeriesDataPoint[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Query unique users saved grouped by date
  const results = await OfferEvent.findAll({
    where: {
      accepted: true,
      createdAt: {
        [Op.gte]: startDate,
      },
      userId: {
        [Op.ne]: null,
      },
    },
    attributes: [
      [Sequelize.fn('DATE', Sequelize.col('created_at')), 'date'],
      [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('user_id'))), 'count'],
    ],
    group: [Sequelize.fn('DATE', Sequelize.col('created_at'))],
    order: [[Sequelize.fn('DATE', Sequelize.col('created_at')), 'ASC']],
    raw: true,
  });

  // Format results
  return results.map((row: any) => ({
    date: row.date.toISOString().split('T')[0],
    value: parseInt(row.count || 0, 10),
  }));
}

/**
 * Get offer performance metrics
 * @returns Array of offer performance objects
 */
export async function getOfferPerformance(): Promise<OfferPerformance[]> {
  // Get all offer events grouped by offer type
  const results = await OfferEvent.findAll({
    attributes: [
      'offerType',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'totalShown'],
      [
        Sequelize.fn('SUM', Sequelize.literal('CASE WHEN accepted = true THEN 1 ELSE 0 END')),
        'totalAccepted',
      ],
      [
        Sequelize.fn('SUM', Sequelize.literal('CASE WHEN accepted = true THEN revenue_saved ELSE 0 END')),
        'totalRevenueSaved',
      ],
    ],
    group: ['offerType'],
    order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
    raw: true,
  });

  // Format and calculate metrics
  return results.map((row: any) => {
    const totalShown = parseInt(row.totalShown || 0, 10);
    const totalAccepted = parseInt(row.totalAccepted || 0, 10);
    const totalRevenueSaved = parseFloat(row.totalRevenueSaved || 0);
    const acceptanceRate = totalShown > 0 ? (totalAccepted / totalShown) * 100 : 0;
    const averageRevenuePerAcceptance = totalAccepted > 0
      ? totalRevenueSaved / totalAccepted
      : 0;

    return {
      offerType: row.offerType || 'unknown',
      totalShown,
      totalAccepted,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      totalRevenueSaved: Math.round(totalRevenueSaved * 100) / 100,
      averageRevenuePerAcceptance: Math.round(averageRevenuePerAcceptance * 100) / 100,
    };
  });
}

/**
 * Get aggregated churn reason data
 * @returns Array of churn reason objects with counts and percentages
 */
export async function getChurnReasons(): Promise<ChurnReasonData[]> {
  // Get all churn reasons grouped by reason code
  const results = await ChurnReason.findAll({
    attributes: [
      'reasonCode',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['reasonCode'],
    order: [[Sequelize.fn('COUNT', Sequelize.col('id')), 'DESC']],
    raw: true,
  });

  // Calculate total count for percentage calculation
  const totalCount = results.reduce(
    (sum, row: any) => sum + parseInt(row.count || 0, 10),
    0
  );

  // Format results with percentages
  return results.map((row: any) => {
    const count = parseInt(row.count || 0, 10);
    const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;

    return {
      reasonCode: row.reasonCode || 'unknown',
      count,
      percentage: Math.round(percentage * 100) / 100,
    };
  });
}

