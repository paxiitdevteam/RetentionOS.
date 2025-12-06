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

    // Read migration file
    const migrationPath = join(__dirname, '../migrations/001_initial_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await sequelize.query(statement);
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

