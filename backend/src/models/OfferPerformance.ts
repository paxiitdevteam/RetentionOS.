/**
 * Offer Performance Model
 * Tracks offer performance by type and segment
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

interface OfferPerformanceAttributes {
  id: number;
  offerType: string;
  segment: string | null;
  totalShown: number;
  totalAccepted: number;
  acceptanceRate: number;
  avgRevenueSaved: number;
  lastUpdated?: Date;
  createdAt?: Date;
}

interface OfferPerformanceCreationAttributes extends Optional<OfferPerformanceAttributes, 'id' | 'segment' | 'totalShown' | 'totalAccepted' | 'acceptanceRate' | 'avgRevenueSaved' | 'lastUpdated' | 'createdAt'> {
  offerType: string;
}

class OfferPerformance extends Model<OfferPerformanceAttributes, OfferPerformanceCreationAttributes> implements OfferPerformanceAttributes {
  public id!: number;
  public offerType!: string;
  public segment!: string | null;
  public totalShown!: number;
  public totalAccepted!: number;
  public acceptanceRate!: number;
  public avgRevenueSaved!: number;
  public readonly lastUpdated!: Date;
  public readonly createdAt!: Date;
}

OfferPerformance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    offerType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'offer_type',
    },
    segment: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    totalShown: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_shown',
    },
    totalAccepted: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'total_accepted',
    },
    acceptanceRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'acceptance_rate',
    },
    avgRevenueSaved: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      field: 'avg_revenue_saved',
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_updated',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'offer_performance',
    timestamps: false,
    indexes: [
      { fields: ['offer_type'] },
      { fields: ['segment'] },
      { fields: ['offer_type', 'segment'], unique: true },
    ],
  }
);

export default OfferPerformance;

