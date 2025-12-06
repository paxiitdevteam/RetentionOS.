/**
 * AI Weight Model
 * Stores AI model weights for churn prediction
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

interface AIWeightAttributes {
  id: number;
  weightName: string;
  weightValue: number;
  description: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AIWeightCreationAttributes extends Optional<AIWeightAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {
  weightName: string;
  weightValue: number;
}

class AIWeight extends Model<AIWeightAttributes, AIWeightCreationAttributes> implements AIWeightAttributes {
  public id!: number;
  public weightName!: string;
  public weightValue!: number;
  public description!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AIWeight.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    weightName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'weight_name',
    },
    weightValue: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 1.0,
      field: 'weight_value',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'ai_weights',
    timestamps: true,
    indexes: [
      { fields: ['weight_name'], unique: true },
    ],
  }
);

export default AIWeight;

