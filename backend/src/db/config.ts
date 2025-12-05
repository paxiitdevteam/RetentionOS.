/**
 * Database Configuration
 * Sequelize configuration for RetentionOS
 */

import { SequelizeOptions } from 'sequelize-typescript';

export const dbConfig: SequelizeOptions = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'retentionos',
  username: process.env.DB_USER || 'retentionos',
  password: process.env.DB_PASSWORD || 'password',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 10,
    acquire: 5000,
    idle: 30000,
  },
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true,
  },
};

