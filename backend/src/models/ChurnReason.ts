/**
 * Churn Reason Model
 * Stores reasons users cancel
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import User from './User';

interface ChurnReasonAttributes {
  id: number;
  userId: number | null;
  reasonCode: string | null;
  reasonText: string | null;
  createdAt?: Date;
}

interface ChurnReasonCreationAttributes extends Optional<ChurnReasonAttributes, 'id' | 'userId' | 'reasonCode' | 'reasonText' | 'createdAt'> {}

class ChurnReason extends Model<ChurnReasonAttributes, ChurnReasonCreationAttributes> implements ChurnReasonAttributes {
  public id!: number;
  public userId!: number | null;
  public reasonCode!: string | null;
  public reasonText!: string | null;
  public readonly createdAt!: Date;

  // Associations
  public user?: User;
}

ChurnReason.init(
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
    reasonCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'reason_code',
    },
    reasonText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reason_text',
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
    tableName: 'churn_reasons',
    timestamps: false, // Only created_at, no updated_at
    indexes: [
      { fields: ['user_id'] },
      { fields: ['reason_code'] },
      { fields: ['created_at'] },
    ],
  }
);

// Associations
ChurnReason.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default ChurnReason;

