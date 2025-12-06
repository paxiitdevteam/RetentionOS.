/**
 * Environment Variable Validation Script
 * Validates all required environment variables are set
 */

const requiredVars = {
  production: [
    'NODE_ENV',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
  ],
  development: [
    'NODE_ENV',
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'JWT_SECRET',
  ],
};

function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredVars[env] || requiredVars.development;
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters long');
  }

  // Check database password strength
  if (process.env.DB_PASSWORD && process.env.DB_PASSWORD.length < 12) {
    warnings.push('DB_PASSWORD should be at least 12 characters long');
  }

  // Report results
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    warnings.forEach(w => console.warn(`   - ${w}`));
  }

  console.log('✅ All required environment variables are set');
  return true;
}

if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };

