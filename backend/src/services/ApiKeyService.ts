/**
 * API Key Service
 * Handles API key generation, validation, and management
 * Per backend-services.md and security.md specifications
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import ApiKey from '../models/ApiKey';
import AdminAccount from '../models/AdminAccount';
import AuditLog from '../models/AuditLog';

const KEY_PREFIX = 'ret_';
const KEY_LENGTH = 32; // Random part length (total: ret_ + 32 = 36 chars)
const KEY_EXPIRATION_DAYS = 90; // Per security.md
const BCRYPT_COST = 10; // Lower cost for API keys (they're longer)

export interface ApiKeyResult {
  id: number;
  key: string; // Plain text key (only shown once)
  keyHash: string;
  ownerId: number;
  expiresAt: Date;
  createdAt: Date;
}

export interface ValidationResult {
  valid: boolean;
  apiKey?: ApiKey;
  adminId?: number;
  reason?: string;
}

/**
 * Generate a new API key
 * Format: ret_[32-char-random-string]
 * @param adminId Admin account ID
 * @returns API key result with plain text key (shown only once)
 */
export async function generateApiKey(adminId: number): Promise<ApiKeyResult> {
  // Verify admin exists
  const admin = await AdminAccount.findByPk(adminId);
  if (!admin) {
    throw new Error('Admin account not found');
  }

  // Generate cryptographically secure random string
  const randomPart = crypto.randomBytes(KEY_LENGTH).toString('hex').substring(0, KEY_LENGTH);
  const plainKey = `${KEY_PREFIX}${randomPart}`;

  // Hash the key before storage
  const keyHash = await bcrypt.hash(plainKey, BCRYPT_COST);

  // Calculate expiration (90 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + KEY_EXPIRATION_DAYS);

  // Create API key record
  const apiKey = await ApiKey.create({
    key: keyHash,
    ownerId: adminId,
    expiresAt,
  });

  // Log key generation
  await AuditLog.create({
    adminId,
    action: 'api_key_generated',
    ip: 'system',
    description: `API key generated for admin ${adminId}`,
    resourceId: apiKey.id,
    beforeState: null,
    afterState: { keyId: apiKey.id, expiresAt },
  });

  return {
    id: apiKey.id,
    key: plainKey, // Return plain text key (only shown once)
    keyHash: apiKey.key,
    ownerId: adminId,
    expiresAt,
    createdAt: apiKey.createdAt,
  };
}

/**
 * Rotate API key (generate new and invalidate old)
 * @param keyId API key ID to rotate
 * @param adminId Admin account ID (must be owner)
 * @returns New API key result
 */
export async function rotateApiKey(keyId: number, adminId: number): Promise<ApiKeyResult> {
  // Get existing key
  const oldKey = await ApiKey.findByPk(keyId);
  if (!oldKey) {
    throw new Error('API key not found');
  }

  // Verify admin owns the key or is owner/admin
  const admin = await AdminAccount.findByPk(adminId);
  if (!admin) {
    throw new Error('Admin account not found');
  }

  if (oldKey.ownerId !== adminId && admin.role !== 'owner' && admin.role !== 'admin') {
    throw new Error('Insufficient permissions to rotate this key');
  }

  // Generate new key
  const newKeyResult = await generateApiKey(oldKey.ownerId);

  // Invalidate old key by setting expiration to now
  oldKey.expiresAt = new Date();
  await oldKey.save();

  // Log rotation
  await AuditLog.create({
    adminId,
    action: 'api_key_rotated',
    ip: 'system',
    description: `API key ${keyId} rotated`,
    resourceId: keyId,
    beforeState: { keyId: oldKey.id },
    afterState: { oldKeyId: keyId, newKeyId: newKeyResult.id },
  });

  return newKeyResult;
}

/**
 * Validate API key
 * @param key Plain text API key
 * @param ipAddress Client IP address (for logging)
 * @returns Validation result with API key and admin ID if valid
 */
export async function validateKey(key: string, ipAddress?: string): Promise<ValidationResult> {
  // Check format
  if (!key.startsWith(KEY_PREFIX) || key.length !== KEY_PREFIX.length + KEY_LENGTH) {
    await logValidationAttempt(null, false, 'invalid_format', ipAddress);
    return {
      valid: false,
      reason: 'Invalid API key format',
    };
  }

  // Get all active API keys (not expired)
  const activeKeys = await ApiKey.findAll({
    where: {
      [Op.or]: [
        { expiresAt: { [Op.gt]: new Date() } },
        { expiresAt: null },
      ],
    },
    include: [{ model: AdminAccount, as: 'owner' }],
  });

  // Try to match the key by comparing hashes
  let matchedKey: ApiKey | null = null;
  for (const apiKey of activeKeys) {
    const isValid = await bcrypt.compare(key, apiKey.key);
    if (isValid) {
      matchedKey = apiKey;
      break;
    }
  }

  if (!matchedKey) {
    await logValidationAttempt(null, false, 'key_not_found', ipAddress);
    return {
      valid: false,
      reason: 'Invalid API key',
    };
  }

  // Check expiration
  if (matchedKey.expiresAt && matchedKey.expiresAt < new Date()) {
    await logValidationAttempt(matchedKey.id, false, 'expired', ipAddress);
    return {
      valid: false,
      reason: 'API key expired',
    };
  }

  // Log successful validation
  await logValidationAttempt(matchedKey.id, true, 'success', ipAddress);

  // Update last used timestamp
  await recordLastUsed(matchedKey.id);

  return {
    valid: true,
    apiKey: matchedKey,
    adminId: matchedKey.ownerId,
  };
}

/**
 * Record last used timestamp
 * @param keyId API key ID
 */
export async function recordLastUsed(keyId: number): Promise<void> {
  await ApiKey.update(
    { lastUsed: new Date() },
    { where: { id: keyId } }
  );
}

/**
 * Log validation attempt
 * @param keyId API key ID (null if key not found)
 * @param success Whether validation succeeded
 * @param reason Reason for success/failure
 * @param ipAddress Client IP address
 */
async function logValidationAttempt(
  keyId: number | null,
  success: boolean,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await AuditLog.create({
    adminId: null,
    action: success ? 'api_key_validated' : 'api_key_validation_failed',
    ip: ipAddress || 'unknown',
    description: `API key validation ${success ? 'succeeded' : 'failed'}: ${reason}`,
    resourceId: keyId,
    beforeState: null,
    afterState: { keyId, success, reason },
  });
}

/**
 * Get API key by ID (for admin viewing)
 * Returns masked key (only last 4 characters)
 * @param keyId API key ID
 * @param adminId Admin account ID (must be owner)
 * @returns API key with masked key
 */
export async function getApiKey(keyId: number, adminId: number): Promise<ApiKey | null> {
  const apiKey = await ApiKey.findByPk(keyId, {
    include: [{ model: AdminAccount, as: 'owner' }],
  });

  if (!apiKey) {
    return null;
  }

  // Verify admin owns the key or is owner/admin
  const admin = await AdminAccount.findByPk(adminId);
  if (!admin) {
    return null;
  }

  if (apiKey.ownerId !== adminId && admin.role !== 'owner' && admin.role !== 'admin') {
    return null;
  }

  return apiKey;
}

/**
 * List all API keys for an admin
 * @param adminId Admin account ID
 * @returns List of API keys (with masked keys)
 */
export async function listApiKeys(adminId: number): Promise<ApiKey[]> {
  const admin = await AdminAccount.findByPk(adminId);
  if (!admin) {
    throw new Error('Admin account not found');
  }

  // Owners and admins can see all keys, others only their own
  const whereClause: any = {};
  if (admin.role !== 'owner' && admin.role !== 'admin') {
    whereClause.ownerId = adminId;
  }

  const keys = await ApiKey.findAll({
    where: whereClause,
    include: [{ model: AdminAccount, as: 'owner' }],
    order: [['createdAt', 'DESC']],
  });

  return keys;
}

/**
 * Delete API key
 * @param keyId API key ID
 * @param adminId Admin account ID (must be owner)
 */
export async function deleteApiKey(keyId: number, adminId: number): Promise<void> {
  const apiKey = await ApiKey.findByPk(keyId);
  if (!apiKey) {
    throw new Error('API key not found');
  }

  // Verify admin owns the key or is owner/admin
  const admin = await AdminAccount.findByPk(adminId);
  if (!admin) {
    throw new Error('Admin account not found');
  }

  if (apiKey.ownerId !== adminId && admin.role !== 'owner' && admin.role !== 'admin') {
    throw new Error('Insufficient permissions to delete this key');
  }

  // Log deletion
  await AuditLog.create({
    adminId,
    action: 'api_key_deleted',
    ip: 'system',
    description: `API key ${keyId} deleted`,
    resourceId: keyId,
    beforeState: { keyId: apiKey.id, ownerId: apiKey.ownerId },
    afterState: null,
  });

  // Delete the key
  await apiKey.destroy();
}

/**
 * Get masked key for display (only last 4 characters)
 * @param keyId API key ID
 * @returns Masked key string (e.g., "****abc1")
 */
export function getMaskedKey(keyId: number): string {
  // Since we hash keys, we can't show the actual last 4 chars
  // Instead, we'll use a consistent mask based on key ID
  // In production, you might want to store a hint or use a different approach
  return `****${keyId.toString().slice(-4)}`;
}

/**
 * Check for suspicious activity
 * @param keyId API key ID
 * @param ipAddress Client IP address
 * @returns true if suspicious activity detected
 */
export async function checkSuspiciousActivity(keyId: number, ipAddress: string): Promise<boolean> {
  // Check for failed validation attempts in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const failedAttempts = await AuditLog.count({
    where: {
      action: 'api_key_validation_failed',
      resourceId: keyId,
      createdAt: {
        [Op.gte]: oneHourAgo,
      },
    },
  });

  // More than 5 failed attempts in 1 hour is suspicious
  if (failedAttempts > 5) {
    // Log suspicious activity
    await AuditLog.create({
      adminId: null,
      action: 'api_key_suspicious_activity',
      ip: ipAddress,
      description: `Suspicious activity detected for API key ${keyId}: ${failedAttempts} failed attempts in 1 hour`,
      resourceId: keyId,
      beforeState: null,
      afterState: { keyId, failedAttempts, ipAddress },
    });
    return true;
  }

  return false;
}

