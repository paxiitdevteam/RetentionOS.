/**
 * Admin API Routes
 * Handles authentication and admin endpoints
 */

import { Router, Request, Response } from 'express';
import { login, logout, updatePassword } from '../services/AuthService';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  generateApiKey,
  rotateApiKey,
  listApiKeys,
  getApiKey,
  deleteApiKey,
  getMaskedKey,
} from '../services/ApiKeyService';
import {
  getSummaryMetrics,
  getSavedRevenueOverTime,
  getSavedUsersOverTime,
  getOfferPerformance,
  getChurnReasons,
} from '../services/AnalyticsService';
import {
  listFlows,
  createFlow,
  updateFlow,
  getFlowById,
  deleteFlow,
  FlowData,
  duplicateFlow,
  updateFlowFull,
  validateFlow,
  getFlowTemplates,
  activateFlow,
  deactivateFlow,
  generateTemplatesFromDatabase,
  loadTemplatesFromUrl,
} from '../services/FlowService';

const router = Router();

/**
 * GET /admin/login
 * Returns method not allowed (login must be POST)
 * Also handles OPTIONS for CORS preflight
 */
router.get('/login', (req: Request, res: Response) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    message: 'Login endpoint requires POST method',
  });
});

router.options('/login', (req: Request, res: Response) => {
  res.status(200).end();
});

/**
 * POST /admin/login
 * Admin login endpoint
 * Returns JWT token in response and HTTP-only cookie
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
      });
      return;
    }

    // Get client info for audit logging
    const ipAddress = req.ip || (Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for']) || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Perform login
    const result = await login(email, password, ipAddress as string, userAgent);

    // Set HTTP-only cookie with token (per security.md)
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000, // 1 hour (matches JWT expiration)
    });

    // Return token in response (for clients that can't use cookies)
    res.json({
      success: true,
      admin: {
        id: result.adminId,
        email: result.email,
        role: result.role,
      },
      token: result.token, // Also return in body for flexibility
    });
  } catch (error: any) {
    // Check if it's a database connection error
    // This catches errors from AuthService.validateCredentials() and other DB operations
    if (error.name === 'SequelizeConnectionError' || 
        error.message?.includes('SSPI') || 
        error.message?.includes('connection') ||
        error.message?.includes('auth_gssapi_client') ||
        error.message?.includes('Database connection failed')) {
      console.error('Database connection error during login:', error);
      const originalError = (error as any).originalError || error;
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database connection failed. Please check database configuration and ensure the database is running.',
        details: process.env.NODE_ENV === 'development' ? originalError.message : undefined,
      });
      return;
    }

    // For other errors (invalid credentials, etc.), return 401
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Login failed',
    });
  }
});

/**
 * POST /admin/logout
 * Admin logout endpoint
 * Clears token cookie and logs logout event
 */
router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    // Get client info for audit logging
    const ipAddress = req.ip || (Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for']) || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Log logout event
    await logout(req.admin.adminId, ipAddress as string, userAgent);

    // Clear token cookie
    res.clearCookie('token');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Logout failed',
    });
  }
});

/**
 * GET /admin/me
 * Get current admin info
 * Requires authentication
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    res.json({
      success: true,
      admin: {
        id: req.admin.adminId,
        email: req.admin.email,
        role: req.admin.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get admin info',
    });
  }
});

/**
 * PUT /admin/password
 * Update admin password
 * Requires authentication
 */
router.put('/password', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Current password and new password are required',
      });
      return;
    }

    // Get client info for audit logging
    const ipAddress = req.ip || (Array.isArray(req.headers['x-forwarded-for']) 
      ? req.headers['x-forwarded-for'][0] 
      : req.headers['x-forwarded-for']) || 'unknown';

    // Update password
    await updatePassword(req.admin.adminId, currentPassword, newPassword, ipAddress as string);

    res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error: any) {
    // Check if it's a database connection error
    if (error.name === 'SequelizeConnectionError' || 
        error.message?.includes('SSPI') || 
        error.message?.includes('connection') ||
        error.message?.includes('auth_gssapi_client') ||
        error.message?.includes('Database connection failed')) {
      console.error('Database connection error during password update:', error);
      const originalError = (error as any).originalError || error;
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'Database connection failed. Please check database configuration and ensure the database is running.',
        details: process.env.NODE_ENV === 'development' ? originalError.message : undefined,
      });
      return;
    }

    // For validation errors (wrong password, weak password, etc.), return 400
    if (error.message?.includes('Current password') || 
        error.message?.includes('Password must')) {
      res.status(400).json({
        error: 'Bad Request',
        message: error.message || 'Password update failed',
      });
      return;
    }

    // For other errors, return 500
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update password',
    });
  }
});

/**
 * GET /admin/api-keys
 * List all API keys for current admin
 * Requires authentication
 */
router.get('/api-keys', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const keys = await listApiKeys(req.admin.adminId);

    // Mask keys for display (only show last 4 chars hint)
    const maskedKeys = keys.map(key => ({
      id: key.id,
      maskedKey: getMaskedKey(key.id),
      ownerId: key.ownerId,
      ownerEmail: (key as any).owner?.email || null,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      expiresAt: key.expiresAt,
      isExpired: key.expiresAt ? key.expiresAt < new Date() : false,
    }));

    res.json({
      success: true,
      keys: maskedKeys,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to list API keys',
    });
  }
});

/**
 * POST /admin/api-keys
 * Create new API key
 * Requires authentication
 */
router.post('/api-keys', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const result = await generateApiKey(req.admin.adminId);

    // Return the plain text key (only shown once)
    res.status(201).json({
      success: true,
      key: {
        id: result.id,
        key: result.key, // Plain text key - show only once!
        expiresAt: result.expiresAt,
        createdAt: result.createdAt,
      },
      warning: 'Store this key securely. It will not be shown again.',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to generate API key',
    });
  }
});

/**
 * GET /admin/api-keys/:id
 * Get API key details
 * Requires authentication
 */
router.get('/api-keys/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const keyId = parseInt(req.params.id);
    if (isNaN(keyId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid API key ID',
      });
      return;
    }

    const key = await getApiKey(keyId, req.admin.adminId);
    if (!key) {
      res.status(404).json({
        error: 'Not Found',
        message: 'API key not found',
      });
      return;
    }

    res.json({
      success: true,
      key: {
        id: key.id,
        maskedKey: getMaskedKey(key.id),
        ownerId: key.ownerId,
        ownerEmail: (key as any).owner?.email || null,
        createdAt: key.createdAt,
        lastUsed: key.lastUsed,
        expiresAt: key.expiresAt,
        isExpired: key.expiresAt ? key.expiresAt < new Date() : false,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get API key',
    });
  }
});

/**
 * PUT /admin/api-keys/:id/rotate
 * Rotate API key (generate new, invalidate old)
 * Requires authentication
 */
router.put('/api-keys/:id/rotate', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const keyId = parseInt(req.params.id);
    if (isNaN(keyId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid API key ID',
      });
      return;
    }

    const result = await rotateApiKey(keyId, req.admin.adminId);

    res.json({
      success: true,
      key: {
        id: result.id,
        key: result.key, // Plain text key - show only once!
        expiresAt: result.expiresAt,
        createdAt: result.createdAt,
      },
      warning: 'Store this key securely. It will not be shown again. Old key has been invalidated.',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to rotate API key',
    });
  }
});

/**
 * DELETE /admin/api-keys/:id
 * Delete API key
 * Requires authentication
 */
router.delete('/api-keys/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const keyId = parseInt(req.params.id);
    if (isNaN(keyId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid API key ID',
      });
      return;
    }

    await deleteApiKey(keyId, req.admin.adminId);

    res.json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete API key',
    });
  }
});

/**
 * GET /admin/analytics/summary
 * Get analytics summary (revenue saved, users saved)
 * Requires authentication
 */
router.get('/analytics/summary', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const summary = await getSummaryMetrics();

    res.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get analytics summary',
    });
  }
});

/**
 * GET /admin/analytics/offers
 * Get offer performance data
 * Requires authentication
 */
router.get('/analytics/offers', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    if (isNaN(days) || days < 1 || days > 365) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Days parameter must be between 1 and 365',
      });
      return;
    }

    const offerPerformance = await getOfferPerformance();

    res.json({
      success: true,
      offers: offerPerformance,
      period: {
        days,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get offer performance',
    });
  }
});

/**
 * GET /admin/analytics/reasons
 * Get churn reasons data
 * Requires authentication
 */
router.get('/analytics/reasons', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const reasons = await getChurnReasons();

    res.json({
      success: true,
      reasons,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get churn reasons',
    });
  }
});

/**
 * GET /admin/analytics/revenue-over-time
 * Get revenue saved over time
 * Requires authentication
 */
router.get('/analytics/revenue-over-time', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    if (isNaN(days) || days < 1 || days > 365) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Days parameter must be between 1 and 365',
      });
      return;
    }

    const data = await getSavedRevenueOverTime(days);

    res.json({
      success: true,
      data,
      period: {
        days,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get revenue over time',
    });
  }
});

/**
 * GET /admin/analytics/users-over-time
 * Get users saved over time
 * Requires authentication
 */
router.get('/analytics/users-over-time', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    if (isNaN(days) || days < 1 || days > 365) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Days parameter must be between 1 and 365',
      });
      return;
    }

    const data = await getSavedUsersOverTime(days);

    res.json({
      success: true,
      data,
      period: {
        days,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get users over time',
    });
  }
});

/**
 * GET /admin/flows
 * List all retention flows
 * Requires authentication
 */
router.get('/flows', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const language = req.query.language as string | undefined;
    const flows = await listFlows(language);

    res.json({
      success: true,
      flows: flows.map(flow => ({
        id: flow.id,
        name: flow.name,
        steps: flow.steps,
        language: flow.language,
        rankingScore: flow.rankingScore,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to list flows',
    });
  }
});

/**
 * POST /admin/flows
 * Create new retention flow
 * Requires authentication and admin role
 */
router.post('/flows', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const { name, steps, language } = req.body;

    // Validate input
    if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Name and steps array are required',
      });
      return;
    }

    const flowData: FlowData = {
      name,
      steps,
      language: language || 'en',
    };

    const flow = await createFlow(flowData);

    res.status(201).json({
      success: true,
      flow: {
        id: flow.id,
        name: flow.name,
        steps: flow.steps,
        language: flow.language,
        rankingScore: flow.rankingScore,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to create flow',
    });
  }
});

/**
 * GET /admin/flows/:id
 * Get flow by ID
 * Requires authentication
 */
router.get('/flows/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const flowId = parseInt(req.params.id);
    if (isNaN(flowId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid flow ID',
      });
      return;
    }

    const flow = await getFlowById(flowId);
    if (!flow) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Flow not found',
      });
      return;
    }

    res.json({
      success: true,
      flow: {
        id: flow.id,
        name: flow.name,
        steps: flow.steps,
        language: flow.language,
        rankingScore: flow.rankingScore,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get flow',
    });
  }
});

/**
 * PUT /admin/flows/:id
 * Update retention flow
 * Requires authentication and admin role
 */
router.put('/flows/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const flowId = parseInt(req.params.id);
    if (isNaN(flowId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid flow ID',
      });
      return;
    }

    const { steps } = req.body;

    // Validate input
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Steps array is required',
      });
      return;
    }

    const flow = await updateFlow(flowId, steps);

    res.json({
      success: true,
      flow: {
        id: flow.id,
        name: flow.name,
        steps: flow.steps,
        language: flow.language,
        rankingScore: flow.rankingScore,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.message === 'Flow not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update flow',
    });
  }
});

/**
 * DELETE /admin/flows/:id
 * Delete retention flow
 * Requires authentication and admin role
 */
router.delete('/flows/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const flowId = parseInt(req.params.id);
    if (isNaN(flowId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid flow ID',
      });
      return;
    }

    await deleteFlow(flowId);

    res.json({
      success: true,
      message: 'Flow deleted successfully',
    });
  } catch (error: any) {
    if (error.message === 'Flow not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to delete flow',
    });
  }
});

/**
 * POST /admin/flows/:id/duplicate
 * Duplicate a flow
 * Requires authentication and admin role
 */
router.post('/flows/:id/duplicate', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const flowId = parseInt(req.params.id);
    if (isNaN(flowId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid flow ID',
      });
      return;
    }

    const { name } = req.body;
    const newFlow = await duplicateFlow(flowId, name);

    res.status(201).json({
      success: true,
      flow: {
        id: newFlow.id,
        name: newFlow.name,
        steps: newFlow.steps,
        language: newFlow.language,
        rankingScore: newFlow.rankingScore,
        createdAt: newFlow.createdAt,
        updatedAt: newFlow.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.message === 'Flow not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to duplicate flow',
    });
  }
});

/**
 * PUT /admin/flows/:id/full
 * Update flow (full update including name, steps, language)
 * Requires authentication and admin role
 */
router.put('/flows/:id/full', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const flowId = parseInt(req.params.id);
    if (isNaN(flowId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid flow ID',
      });
      return;
    }

    const { name, steps, language } = req.body;
    const flow = await updateFlowFull(flowId, { name, steps, language });

    res.json({
      success: true,
      flow: {
        id: flow.id,
        name: flow.name,
        steps: flow.steps,
        language: flow.language,
        rankingScore: flow.rankingScore,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.message === 'Flow not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update flow',
    });
  }
});

/**
 * POST /admin/flows/validate
 * Validate flow structure
 * Requires authentication
 */
router.post('/flows/validate', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const { name, steps, language } = req.body;
    const validation = validateFlow({ name, steps, language });

    res.json({
      success: true,
      validation,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to validate flow',
    });
  }
});

/**
 * GET /admin/flows/templates
 * Get flow templates from source
 * Requires authentication
 */
router.get('/flows/templates', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const templates = getFlowTemplates();

    res.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get templates',
    });
  }
});

/**
 * POST /admin/flows/templates/from-database
 * Generate templates from subscription database
 * Requires authentication
 */
router.post('/flows/templates/from-database', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const { plan, minValue, maxValue, region } = req.body;
    const templates = await generateTemplatesFromDatabase(plan, minValue, maxValue, region);

    res.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to generate templates from database',
    });
  }
});

/**
 * POST /admin/flows/templates/from-url
 * Load templates from website URL
 * Requires authentication
 */
router.post('/flows/templates/from-url', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const { url } = req.body;
    if (!url) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'URL is required',
      });
      return;
    }

    const templates = await loadTemplatesFromUrl(url);

    res.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to load templates from URL',
    });
  }
});

/**
 * POST /admin/flows/templates/from-excel
 * Load templates from Excel file
 * Requires authentication
 * Note: File should be sent as multipart/form-data
 */
router.post('/flows/templates/from-excel', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    // For now, return error - Excel parsing requires additional setup
    // In production, use multer or similar for file upload
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Excel file upload requires file upload middleware. Please use the frontend file upload feature.',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to load templates from Excel',
    });
  }
});

/**
 * POST /admin/flows/templates/from-googlesheets
 * Load templates from Google Sheets
 * Requires authentication
 */
router.post('/flows/templates/from-googlesheets', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const { url } = req.body;
    if (!url) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Google Sheets URL is required',
      });
      return;
    }

    // Convert Google Sheets URL to CSV export format
    let csvUrl = url;
    if (url.includes('/spreadsheets/d/')) {
      const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch) {
        const sheetId = sheetIdMatch[1];
        const gidMatch = url.match(/[#&]gid=(\d+)/);
        const gid = gidMatch ? gidMatch[1] : '0';
        csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      }
    }

    // Fetch CSV from Google Sheets
    const https = require('https');
    const http = require('http');
    const urlModule = require('url');
    const parsedUrl = urlModule.parse(csvUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const csvText = await new Promise<string>((resolve, reject) => {
      const req = client.get(csvUrl, { headers: { 'User-Agent': 'RetentionOS/1.0' } }, (res: any) => {
        let data = '';
        res.on('data', (chunk: any) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`Failed to fetch Google Sheets: ${res.statusMessage}`));
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });

    // Parse CSV to templates (simplified - full parsing in frontend)
    const templates = parseCSVToTemplates(csvText);

    res.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to load templates from Google Sheets',
    });
  }
});

// Helper function to parse CSV to templates
function parseCSVToTemplates(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const templates: any[] = [];
  const templateMap = new Map<string, any>();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    const templateName = row['template_name'] || row['name'] || 'Imported Template';
    if (!templateMap.has(templateName)) {
      templateMap.set(templateName, {
        name: templateName,
        language: row['language'] || 'en',
        steps: [],
      });
    }

    const template = templateMap.get(templateName);
    if (row['step_type'] && row['step_title'] && row['step_message']) {
      let config = {};
      try {
        config = row['step_config'] ? JSON.parse(row['step_config']) : {};
      } catch (e) {
        // Ignore config parsing errors
      }
      template.steps.push({
        type: row['step_type'],
        title: row['step_title'],
        message: row['step_message'],
        config,
      });
    }
  }

  return Array.from(templateMap.values());
}

/**
 * GET /admin/subscriptions/upcoming
 * Get subscriptions expiring soon
 * Requires authentication
 */
router.get('/subscriptions/upcoming', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const subscriptions = await getUpcomingSubscriptions(days);

    res.json({
      success: true,
      subscriptions,
      count: subscriptions.length,
    });
  } catch (error: any) {
    console.error('Error getting upcoming subscriptions:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get upcoming subscriptions',
    });
  }
});

/**
 * GET /admin/subscriptions/needing-retention
 * Get subscriptions that need proactive retention
 * Requires authentication
 */
router.get('/subscriptions/needing-retention', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const subscriptions = await getSubscriptionsNeedingRetention();

    res.json({
      success: true,
      subscriptions,
      count: subscriptions.length,
    });
  } catch (error: any) {
    console.error('Error getting subscriptions needing retention:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get subscriptions needing retention',
    });
  }
});

/**
 * GET /admin/subscriptions/stats
 * Get subscription statistics
 * Requires authentication
 */
router.get('/subscriptions/stats', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const stats = await getSubscriptionStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error getting subscription stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get subscription stats',
    });
  }
});

/**
 * POST /admin/subscriptions/check-alerts
 * Check and send alerts for upcoming subscriptions
 * Requires authentication
 */
router.post('/subscriptions/check-alerts', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const alertDays = req.body.alertDays || [30, 14, 7, 3, 1];
    const alerts = await checkAndSendAlerts(alertDays);

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error: any) {
    console.error('Error checking alerts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to check alerts',
    });
  }
});

/**
 * POST /admin/subscriptions/trigger-retention
 * Manually trigger proactive retention for subscriptions expiring soon
 * Requires authentication
 */
router.post('/subscriptions/trigger-retention', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const daysBeforeEnd = req.body.daysBeforeEnd || 7;
    const results = await triggerProactiveRetention(daysBeforeEnd);

    res.json({
      success: true,
      results,
      triggered: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error: any) {
    console.error('Error triggering proactive retention:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to trigger proactive retention',
    });
  }
});

/**
 * GET /admin/alerts
 * Get unread alerts for admin dashboard
 * Requires authentication
 */
router.get('/alerts', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const alerts = await getUnreadAlerts(limit);

    res.json({
      success: true,
      alerts,
      count: alerts.length,
    });
  } catch (error: any) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get alerts',
    });
  }
});

/**
 * GET /admin/alerts/stats
 * Get alert statistics
 * Requires authentication
 */
router.get('/alerts/stats', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const stats = await getAlertStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('Error getting alert stats:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get alert stats',
    });
  }
});

/**
 * PUT /admin/alerts/:id/read
 * Mark alert as read
 * Requires authentication
 */
router.put('/alerts/:id/read', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const alertId = parseInt(req.params.id);
    const alert = await markAlertAsRead(alertId);

    res.json({
      success: true,
      alert,
    });
  } catch (error: any) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to mark alert as read',
    });
  }
});

/**
 * PUT /admin/subscriptions/:id/alerts/read-all
 * Mark all alerts as read for a subscription
 * Requires authentication
 */
router.put('/subscriptions/:id/alerts/read-all', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const subscriptionId = parseInt(req.params.id);
    const count = await markAllAlertsAsReadForSubscription(subscriptionId);

    res.json({
      success: true,
      count,
    });
  } catch (error: any) {
    console.error('Error marking alerts as read:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to mark alerts as read',
    });
  }
});

/**
 * POST /admin/flows/:id/activate
 * Activate flow (set ranking score > 0)
 * Requires authentication and admin role
 */
router.post('/flows/:id/activate', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const flowId = parseInt(req.params.id);
    if (isNaN(flowId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid flow ID',
      });
      return;
    }

    const flow = await activateFlow(flowId);

    res.json({
      success: true,
      flow: {
        id: flow.id,
        name: flow.name,
        steps: flow.steps,
        language: flow.language,
        rankingScore: flow.rankingScore,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.message === 'Flow not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    res.status(400).json({
      error: 'Bad Request',
      message: error.message || 'Failed to activate flow',
    });
  }
});

/**
 * POST /admin/flows/:id/deactivate
 * Deactivate flow (set ranking score to 0)
 * Requires authentication and admin role
 */
router.post('/flows/:id/deactivate', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const flowId = parseInt(req.params.id);
    if (isNaN(flowId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid flow ID',
      });
      return;
    }

    const flow = await deactivateFlow(flowId);

    res.json({
      success: true,
      flow: {
        id: flow.id,
        name: flow.name,
        steps: flow.steps,
        language: flow.language,
        rankingScore: flow.rankingScore,
        createdAt: flow.createdAt,
        updatedAt: flow.updatedAt,
      },
    });
  } catch (error: any) {
    if (error.message === 'Flow not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to deactivate flow',
    });
  }
});

export default router;

