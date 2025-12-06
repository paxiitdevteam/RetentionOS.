/**
 * Message Performance Model
 * Tracks message template performance
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

interface MessagePerformanceAttributes {
  id: number;
  messageTemplate: string;
  offerType: string;
  totalShown: number;
  totalAccepted: number;
  acceptanceRate: number;
  lastUpdated?: Date;
  createdAt?: Date;
}

interface MessagePerformanceCreationAttributes extends Optional<MessagePerformanceAttributes, 'id' | 'totalShown' | 'totalAccepted' | 'acceptanceRate' | 'lastUpdated' | 'createdAt'> {
  messageTemplate: string;
  offerType: string;
}

class MessagePerformance extends Model<MessagePerformanceAttributes, MessagePerformanceCreationAttributes> implements MessagePerformanceAttributes {
  public id!: number;
  public messageTemplate!: string;
  public offerType!: string;
  public totalShown!: number;
  public totalAccepted!: number;
  public acceptanceRate!: number;
  public readonly lastUpdated!: Date;
  public readonly createdAt!: Date;
}

MessagePerformance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    messageTemplate: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'message_template',
    },
    offerType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'offer_type',
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
    tableName: 'message_performance',
    timestamps: false,
    indexes: [
      { fields: ['message_template'] },
      { fields: ['offer_type'] },
    ],
  }
);

export default MessagePerformance;

