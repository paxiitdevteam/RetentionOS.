/**
 * Flow Model
 * Represents retention flows with steps
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

interface FlowAttributes {
  id: number;
  name: string;
  steps: object; // JSONB
  rankingScore: number;
  language: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FlowCreationAttributes extends Optional<FlowAttributes, 'id' | 'rankingScore' | 'language' | 'createdAt' | 'updatedAt'> {
  name: string;
  steps: object;
}

class Flow extends Model<FlowAttributes, FlowCreationAttributes> implements FlowAttributes {
  public id!: number;
  public name!: string;
  public steps!: object;
  public rankingScore!: number;
  public language!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Flow.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    steps: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    rankingScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'ranking_score',
    },
    language: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'en',
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
    tableName: 'flows',
    timestamps: true,
    indexes: [
      { fields: ['language'] },
      { fields: ['ranking_score'] },
    ],
  }
);

export default Flow;

