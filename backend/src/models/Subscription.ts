/**
 * Subscription Model
 * Represents user subscriptions and Stripe integration
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import User from './User';

interface SubscriptionAttributes {
  id: number;
  userId: number;
  stripeSubscriptionId: string | null;
  value: number | null;
  status: string | null;
  cancelAttempts: number;
  startDate: Date | null;
  endDate: Date | null;
  renewalDate: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SubscriptionCreationAttributes extends Optional<SubscriptionAttributes, 'id' | 'stripeSubscriptionId' | 'value' | 'status' | 'cancelAttempts' | 'startDate' | 'endDate' | 'renewalDate' | 'createdAt' | 'updatedAt'> {
  userId: number;
}

class Subscription extends Model<SubscriptionAttributes, SubscriptionCreationAttributes> implements SubscriptionAttributes {
  public id!: number;
  public userId!: number;
  public stripeSubscriptionId!: string | null;
  public value!: number | null;
  public status!: string | null;
  public cancelAttempts!: number;
  public startDate!: Date | null;
  public endDate!: Date | null;
  public renewalDate!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public user?: User;
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    stripeSubscriptionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'stripe_subscription_id',
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      get() {
        const value = this.getDataValue('value');
        return value ? parseFloat(value.toString()) : null;
      },
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    cancelAttempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'cancel_attempts',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_date',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_date',
    },
    renewalDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'renewal_date',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'subscriptions',
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['stripe_subscription_id'], unique: true },
      { fields: ['status'] },
      { fields: ['end_date'] },
      { fields: ['renewal_date'] },
    ],
  }
);

// Associations
Subscription.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Subscription;

