/**
 * User Model
 * Represents users from connected SaaS products
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

interface UserAttributes {
  id: number;
  externalId: string | null;
  email: string | null;
  plan: string | null;
  region: string | null;
  churnScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'externalId' | 'email' | 'plan' | 'region' | 'churnScore' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public externalId!: string | null;
  public email!: string | null;
  public plan!: string | null;
  public region!: string | null;
  public churnScore!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    externalId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: 'external_id',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    plan: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    churnScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'churn_score',
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
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['external_id'], unique: true },
      { fields: ['email'] },
      { fields: ['plan'] },
      { fields: ['region'] },
    ],
  }
);

export default User;

