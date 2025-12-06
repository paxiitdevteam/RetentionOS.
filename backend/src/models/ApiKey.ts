/**
 * API Key Model
 * Stores API keys for widget authentication
 */

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import AdminAccount from './AdminAccount';

interface ApiKeyAttributes {
  id: number;
  key: string; // Hashed key
  ownerId: number;
  createdAt?: Date;
  updatedAt?: Date;
  lastUsed: Date | null;
  expiresAt: Date | null;
}

interface ApiKeyCreationAttributes extends Optional<ApiKeyAttributes, 'id' | 'lastUsed' | 'expiresAt' | 'createdAt'> {
  key: string;
  ownerId: number;
}

class ApiKey extends Model<ApiKeyAttributes, ApiKeyCreationAttributes> implements ApiKeyAttributes {
  public id!: number;
  public key!: string;
  public ownerId!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public lastUsed!: Date | null;
  public expiresAt!: Date | null;

  // Associations
  public owner?: AdminAccount;
}

ApiKey.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'owner_id',
      references: {
        model: 'admin_accounts',
        key: 'id',
      },
      onDelete: 'CASCADE',
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
    lastUsed: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_used',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    tableName: 'api_keys',
    timestamps: true,
    indexes: [
      { fields: ['key'], unique: true },
      { fields: ['owner_id'] },
      { fields: ['expires_at'] },
    ],
  }
);

// Associations
ApiKey.belongsTo(AdminAccount, { foreignKey: 'ownerId', as: 'owner' });

export default ApiKey;

