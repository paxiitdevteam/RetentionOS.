/**
 * Database Connection and Configuration
 * Sequelize setup for RetentionOS
 */

import { Sequelize } from 'sequelize';
import { dbConfig } from './config';

// Initialize Sequelize
export const sequelize = new Sequelize(
  dbConfig.database!,
  dbConfig.username!,
  dbConfig.password!,
  {
    ...dbConfig,
    dialect: 'mysql',
  }
);

// Test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Sync database (use migrations in production)
export const syncDatabase = async (force: boolean = false): Promise<void> => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

export default sequelize;
