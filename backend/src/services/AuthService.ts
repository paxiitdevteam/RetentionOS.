/**
 * Auth Service
 * Handles admin authentication and JWT creation
 * Per backend-services.md specification
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import AdminAccount, { AdminRole } from '../models/AdminAccount';
import AuditLog from '../models/AuditLog';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-min-256-bits';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const BCRYPT_COST = 12; // Per security.md requirement

export interface LoginResult {
  adminId: number;
  email: string;
  role: AdminRole;
  token: string;
}

export interface JwtPayload {
  adminId: number;
  email: string;
  role: AdminRole;
  iat: number;
  exp: number;
}

/**
 * Create new admin account
 * @param email Admin email address
 * @param password Plain text password (will be hashed)
 * @param role Admin role (defaults to readonly)
 * @returns Created admin account
 */
export async function createAdminAccount(
  email: string,
  password: string,
  role: AdminRole = AdminRole.READONLY
): Promise<AdminAccount> {
  // Validate password strength (per security.md)
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/.test(password)) {
    throw new Error('Password must contain uppercase, lowercase, number, and special character');
  }

  // Check if email already exists
  const existing = await AdminAccount.findOne({ where: { email } });
  if (existing) {
    throw new Error('Email already registered');
  }

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  // Create admin account
  const admin = await AdminAccount.create({
    email,
    passwordHash,
    role,
  });

  // Log account creation
  await AuditLog.create({
    adminId: admin.id,
    action: 'admin_account_created',
    ip: 'system',
    description: 'Admin account created',
    beforeState: null,
    afterState: { email, role },
  });

  return admin;
}

/**
 * Validate login credentials
 * @param email Admin email address
 * @param password Plain text password
 * @returns Admin account if valid, null if invalid
 */
export async function validateCredentials(
  email: string,
  password: string
): Promise<AdminAccount | null> {
  try {
    // Find admin by email
    const admin = await AdminAccount.findOne({ where: { email } });
    if (!admin) {
      // Don't reveal if email exists (security best practice)
      return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return null;
    }

    return admin;
  } catch (error: any) {
    // If it's a database connection error, re-throw with a clearer message
    if (error.name === 'SequelizeConnectionError' || 
        error.message?.includes('SSPI') || 
        error.message?.includes('connection') ||
        error.message?.includes('authentication') ||
        error.message?.includes('auth_gssapi_client')) {
      // Create a consistent error that will be caught by the API handler
      const dbError = new Error('Database connection failed. Please check database configuration and ensure the database is running.');
      (dbError as any).name = 'SequelizeConnectionError';
      (dbError as any).originalError = error;
      throw dbError;
    }
    // For other errors, re-throw as-is
    throw error;
  }
}

/**
 * Generate JWT token for authenticated admin
 * @param adminId Admin account ID
 * @returns JWT token string
 */
export async function generateJwt(adminId: number): Promise<string> {
  // Get admin account
  const admin = await AdminAccount.findByPk(adminId);
  if (!admin) {
    throw new Error('Admin account not found');
  }

  // Create JWT payload
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
  };

  // Generate token with expiration
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return token;
}

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Verify admin still exists and is active
    const admin = await AdminAccount.findByPk(decoded.adminId);
    if (!admin) {
      return null;
    }

    // Verify role hasn't changed
    if (admin.role !== decoded.role) {
      return null; // Role changed, token invalid
    }

    return decoded;
  } catch (error) {
    // Token invalid, expired, or malformed
    return null;
  }
}

/**
 * Login admin and return JWT token
 * @param email Admin email
 * @param password Plain text password
 * @param ipAddress Client IP address
 * @param userAgent Client user agent
 * @returns Login result with token
 */
export async function login(
  email: string,
  password: string,
  ipAddress: string,
  userAgent?: string
): Promise<LoginResult> {
  // Validate credentials
  const admin = await validateCredentials(email, password);
  if (!admin) {
    // Log failed login attempt
    await AuditLog.create({
      adminId: null, // Unknown admin
      action: 'login_failed',
      ip: ipAddress,
      description: `Failed login attempt for ${email}`,
      beforeState: null,
      afterState: { email, reason: 'invalid_credentials' },
    });

    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = await generateJwt(admin.id);

  // Log successful login
  await AuditLog.create({
    adminId: admin.id,
    action: 'login_success',
    ip: ipAddress,
    description: `Successful login for ${email}`,
    beforeState: null,
    afterState: { email, role: admin.role },
  });

  return {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    token,
  };
}

/**
 * Logout admin (invalidate session)
 * Note: With JWT, logout is client-side (delete token)
 * This function logs the logout event
 * @param adminId Admin account ID
 * @param ipAddress Client IP address
 * @param userAgent Client user agent
 */
export async function logout(
  adminId: number,
  ipAddress: string,
  userAgent?: string
): Promise<void> {
  // Log logout event
  await AuditLog.create({
    adminId,
    action: 'logout',
    ip: ipAddress,
    description: `Logout for admin ${adminId}`,
    beforeState: null,
    afterState: { adminId },
  });
}

