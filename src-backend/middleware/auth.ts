/**
 * Authentication Middleware
 * Validates JWT tokens and attaches admin info to request
 * Per security.md authentication rules
 */

import { Request, Response, NextFunction } from 'express';
import { verifyJwt, JwtPayload } from '../services/AuthService';

// Extend Express Request to include admin info
declare global {
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

/**
 * Middleware to verify JWT token
 * Extracts token from Authorization header or cookie
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header (Bearer token)
    let token: string | undefined;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Try to get from cookie (HTTP-only cookie)
      token = req.cookies?.token;
    }

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authentication token provided',
      });
      return;
    }

    // Verify token
    const payload = await verifyJwt(token);
    if (!payload) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Attach admin info to request
    req.admin = payload;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}

/**
 * Middleware to check if admin has required role
 * Must be used after authenticate middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

/**
 * Middleware to require Owner role
 */
export const requireOwner = requireRole('owner');

/**
 * Middleware to require Owner or Admin role
 */
export const requireAdmin = requireRole('owner', 'admin');
