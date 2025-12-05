/**
 * Admin Account Model
 * Represents admin users with roles
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';

export enum AdminRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  ANALYST = 'analyst',
  READONLY = 'readonly',
}

interface AdminAccountAttributes {
  id: number;
  email: string;
  passwordHash: string;
  role: AdminRole;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdminAccountCreationAttributes extends Optional<AdminAccountAttributes, 'id' | 'role' | 'createdAt' | 'updatedAt'> {
  email: string;
  passwordHash: string;
}

class AdminAccount extends Model<AdminAccountAttributes, AdminAccountCreationAttributes> implements AdminAccountAttributes {
  public id!: number;
  public email!: string;
  public passwordHash!: string;
  public role!: AdminRole;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AdminAccount.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'password_hash',
    },
    role: {
      type: DataTypes.ENUM(...Object.values(AdminRole)),
      allowNull: false,
      defaultValue: AdminRole.READONLY,
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
    tableName: 'admin_accounts',
    timestamps: true,
    indexes: [
      { fields: ['email'], unique: true },
      { fields: ['role'] },
    ],
  }
);

export default AdminAccount;

