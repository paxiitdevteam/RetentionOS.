/**
 * Audit Log Model
 * Tracks all administrative actions
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import AdminAccount from './AdminAccount';

interface AuditLogAttributes {
  id: number;
  adminId: number | null;
  action: string;
  ip: string | null;
  description: string | null;
  resourceId: number | null;
  beforeState: object | null;
  afterState: object | null;
  createdAt?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id' | 'adminId' | 'ip' | 'description' | 'resourceId' | 'beforeState' | 'afterState' | 'createdAt'> {
  action: string;
}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public adminId!: number | null;
  public action!: string;
  public ip!: string | null;
  public description!: string | null;
  public resourceId!: number | null;
  public beforeState!: object | null;
  public afterState!: object | null;
  public readonly createdAt!: Date;

  // Associations
  public admin?: AdminAccount;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'admin_id',
      references: {
        model: 'admin_accounts',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    action: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ip: {
      type: DataTypes.STRING(45), // IPv6 max length
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'resource_id',
    },
    beforeState: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'before_state',
    },
    afterState: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'after_state',
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
    tableName: 'audit_logs',
    timestamps: false, // Only created_at, no updated_at (append-only)
    indexes: [
      { fields: ['admin_id'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
      { fields: ['resource_id'] },
    ],
  }
);

// Associations
AuditLog.belongsTo(AdminAccount, { foreignKey: 'adminId', as: 'admin' });

export default AuditLog;

