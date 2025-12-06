/**
 * Retention API Routes
 * Handles retention flow endpoints for widgets
 * Uses API key authentication (not JWT)
 */

import { Router, Request, Response } from 'express';
import { authenticateApiKey } from '../middleware/apiKey';
import { startRetentionFlow, processUserDecision } from '../services/RetentionService';
import { getFlowById } from '../services/FlowService';
// Rate limiting - using express-rate-limit
// Note: express-rate-limit provides its own types, no @types package needed
const router = Router();

// Rate limiting for widget endpoints (30 requests per minute per API key)
// Per security.md: Widget API Limits - 30 requests per minute per site
const rateLimit = require('express-rate-limit');

const widgetRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many requests from this API key, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use API key as the rate limit key
    return req.apiKey?.id?.toString() || req.ip || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting if no API key (will be caught by auth middleware)
    return !req.apiKey;
  },
});

/**
 * POST /retention/start
 * Start a retention flow for a user
 * Requires API key authentication
 */
router.post('/start', authenticateApiKey, widgetRateLimit, async (req: Request, res: Response) => {
  try {
    const { userId, plan, region, email, stripeSubscriptionId, subscriptionValue } = req.body;

    // Validate required fields
    if (!userId || !plan || !region) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'userId, plan, and region are required',
      });
      return;
    }

    // Start retention flow
    const result = await startRetentionFlow(
      userId,
      plan,
      region,
      email,
      stripeSubscriptionId,
      subscriptionValue
    );

    res.json({
      success: true,
      flowId: result.flowId,
      steps: result.steps,
      language: result.language,
      segment: result.segment,
    });
  } catch (error: any) {
    console.error('Error starting retention flow:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to start retention flow',
    });
  }
});

/**
 * POST /retention/decision
 * Record user decision in retention flow
 * Requires API key authentication
 */
router.post('/decision', authenticateApiKey, widgetRateLimit, async (req: Request, res: Response) => {
  try {
    const { flowId, offerType, accepted, userId, revenueValue, reasonCode, reasonText } = req.body;

    // Validate required fields
    if (!flowId || !offerType || accepted === undefined) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'flowId, offerType, and accepted are required',
      });
      return;
    }

    // Validate offer type
    const validOfferTypes = ['pause', 'downgrade', 'discount', 'support', 'feedback'];
    if (!validOfferTypes.includes(offerType)) {
      res.status(400).json({
        error: 'Bad Request',
        message: `Invalid offerType. Must be one of: ${validOfferTypes.join(', ')}`,
      });
      return;
    }

    // Process user decision
    const result = await processUserDecision(
      flowId,
      offerType,
      accepted,
      userId,
      revenueValue,
      reasonCode,
      reasonText
    );

    res.json({
      success: result.success,
      message: result.message,
      revenueSaved: result.revenueSaved,
      subscriptionUpdated: result.subscriptionUpdated,
    });
  } catch (error: any) {
    console.error('Error processing decision:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to process decision',
    });
  }
});

/**
 * GET /retention/flow/:id
 * Get flow details by ID
 * Requires API key authentication
 */
router.get('/flow/:id', authenticateApiKey, async (req: Request, res: Response) => {
  try {
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
      },
    });
  } catch (error: any) {
    console.error('Error getting flow:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get flow',
    });
  }
});

export default router;

