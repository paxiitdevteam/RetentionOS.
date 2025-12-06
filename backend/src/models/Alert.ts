/**
 * Alert Model
 * Represents alerts and notifications for subscription lifecycle events
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import Subscription from './Subscription';
import User from './User';

export type AlertType =
  | 'renewal_reminder'
  | 'expiring_soon'
  | 'expired'
  | 'auto_retention_triggered'
  | 'retention_offer_sent'
  | 'subscription_renewed'
  | 'subscription_canceled';

interface AlertAttributes {
  id: number;
  subscriptionId: number;
  userId: number;
  alertType: AlertType;
  message: string;
  metadata: Record<string, any> | null;
  emailSent: boolean;
  read: boolean;
  createdAt?: Date;
}

interface AlertCreationAttributes extends Optional<AlertAttributes, 'id' | 'metadata' | 'emailSent' | 'read' | 'createdAt'> {
  subscriptionId: number;
  userId: number;
  alertType: AlertType;
  message: string;
}

class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: number;
  public subscriptionId!: number;
  public userId!: number;
  public alertType!: AlertType;
  public message!: string;
  public metadata!: Record<string, any> | null;
  public emailSent!: boolean;
  public read!: boolean;
  public readonly createdAt!: Date;

  // Associations
  public subscription?: Subscription;
  public user?: User;
}

Alert.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    subscriptionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'subscription_id',
      references: {
        model: 'subscriptions',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    alertType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'alert_type',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const value = this.getDataValue('metadata');
        return value ? (typeof value === 'string' ? JSON.parse(value) : value) : null;
      },
      set(value: any) {
        this.setDataValue('metadata', value ? JSON.stringify(value) : null);
      },
    },
    emailSent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'email_sent',
    },
    read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'alerts',
    timestamps: false, // We use created_at manually
    indexes: [
      { fields: ['subscription_id'] },
      { fields: ['user_id'] },
      { fields: ['alert_type'] },
      { fields: ['read'] },
      { fields: ['created_at'] },
    ],
  }
);

// Associations
Alert.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });
Alert.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Alert;

