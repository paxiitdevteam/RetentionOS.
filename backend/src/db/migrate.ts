/**
 * Database Migration Runner
 * Runs SQL migrations from files
 */

import dotenv from 'dotenv';
dotenv.config();

import { readFileSync } from 'fs';
import { join } from 'path';
import { sequelize } from './index';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🔄 Running database migrations...');

    // Get all migration files in order
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_add_subscription_dates_and_alerts.sql',
    ];

    for (const migrationFile of migrationFiles) {
      console.log(`📄 Running migration: ${migrationFile}`);
      const migrationPath = join(__dirname, '../migrations', migrationFile);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');

      // Split by semicolons and execute each statement
      // For prepared statements, we need to handle them differently
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await sequelize.query(statement);
          } catch (error: any) {
            // Ignore errors for columns/tables that already exist
            if (error.message && (
              error.message.includes('Duplicate column') ||
              error.message.includes('already exists') ||
              error.message.includes('Duplicate key')
            )) {
              console.log(`⚠️  Skipping (already exists): ${statement.substring(0, 50)}...`);
            } else {
              throw error;
            }
          }
        }
      }
    }

    console.log('✅ Database migrations completed successfully.');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    throw error;
  }
};

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

