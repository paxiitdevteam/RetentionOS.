/**
 * Database Configuration
 * Sequelize configuration for RetentionOS
 * Uses MariaDB/MySQL (multiplatform compatible)
 */

import { Options } from 'sequelize';

export const dbConfig: Options = {
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
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
  dialectOptions: {
    // Enable for MariaDB/MySQL compatibility
    timezone: 'local',
  },
};

