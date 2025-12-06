/**
 * Database Seed Script
 * Creates initial admin user and sample data
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { AdminAccount } from '../models';
import { AdminRole } from '../models/AdminAccount';
import { sequelize } from './index';

export const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Seeding database...');

    // Check if admin already exists
    const existingAdmin = await AdminAccount.findOne({ where: { email: 'admin@retentionos.com' } });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists. Skipping seed.');
      return;
    }

    // Create default admin user
    const passwordHash = await bcrypt.hash('ChangeThisPassword123!', 12);
    
    const admin = await AdminAccount.create({
      email: 'admin@retentionos.com',
      passwordHash,
      role: AdminRole.OWNER,
    });

    console.log('✅ Created default admin user:');
    console.log(`   Email: admin@retentionos.com`);
    console.log(`   Password: ChangeThisPassword123!`);
    console.log(`   Role: ${admin.role}`);
    console.log('⚠️  IMPORTANT: Change the default password immediately!');

    console.log('✅ Database seeding completed.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seed script completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

