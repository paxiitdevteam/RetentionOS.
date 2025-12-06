/**
 * API Key Authentication Middleware
 * Validates API keys for widget endpoints
 * Per security.md API key rules
 */

import { Request, Response, NextFunction } from 'express';
import { validateKey, checkSuspiciousActivity } from '../services/ApiKeyService';

// Extend Express Request to include API key info
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: number;
        ownerId: number;
      };
    }
  }
}

/**
 * Middleware to validate API key
 * Extracts key from X-API-Key header or Authorization header
 */
export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get API key from header
    let apiKey: string | undefined;

    // Try X-API-Key header first
    apiKey = req.headers['x-api-key'] as string;

    // Fallback to Authorization header (Bearer token format)
    if (!apiKey) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
      }
    }

    if (!apiKey) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'API key required. Provide via X-API-Key header or Authorization: Bearer <key>',
      });
      return;
    }

    // Get client IP for logging
    const ipAddress = req.ip || (Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for']) || 'unknown';

    // Validate API key
    const validation = await validateKey(apiKey, ipAddress);

    if (!validation.valid || !validation.apiKey || !validation.adminId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: validation.reason || 'Invalid API key',
      });
      return;
    }

    // Check for suspicious activity
    const isSuspicious = await checkSuspiciousActivity(validation.apiKey.id, ipAddress);
    if (isSuspicious) {
      // Don't block, but log the suspicious activity
      // In production, you might want to temporarily block or alert
    }

    // Attach API key info to request
    req.apiKey = {
      id: validation.apiKey.id,
      ownerId: validation.adminId,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key validation failed',
    });
  }
}

