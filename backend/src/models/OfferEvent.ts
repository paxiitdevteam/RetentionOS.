/**
 * Offer Event Model
 * Tracks all retention offer events
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import User from './User';
import Flow from './Flow';

interface OfferEventAttributes {
  id: number;
  userId: number | null;
  flowId: number | null;
  offerType: string | null;
  accepted: boolean;
  revenueSaved: number;
  createdAt?: Date;
}

interface OfferEventCreationAttributes extends Optional<OfferEventAttributes, 'id' | 'userId' | 'flowId' | 'offerType' | 'accepted' | 'revenueSaved' | 'createdAt'> {}

class OfferEvent extends Model<OfferEventAttributes, OfferEventCreationAttributes> implements OfferEventAttributes {
  public id!: number;
  public userId!: number | null;
  public flowId!: number | null;
  public offerType!: string | null;
  public accepted!: boolean;
  public revenueSaved!: number;
  public readonly createdAt!: Date;

  // Associations
  public user?: User;
  public flow?: Flow;
}

OfferEvent.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    flowId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'flow_id',
      references: {
        model: 'flows',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    offerType: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'offer_type',
    },
    accepted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    revenueSaved: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'revenue_saved',
      get() {
        const value = this.getDataValue('revenueSaved');
        return value ? parseFloat(value.toString()) : 0;
      },
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
    tableName: 'offer_events',
    timestamps: false, // Only created_at, no updated_at
    indexes: [
      { fields: ['user_id'] },
      { fields: ['flow_id'] },
      { fields: ['created_at'] },
      { fields: ['offer_type'] },
      { fields: ['accepted'] },
    ],
  }
);

// Associations
OfferEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });
OfferEvent.belongsTo(Flow, { foreignKey: 'flowId', as: 'flow' });

export default OfferEvent;

