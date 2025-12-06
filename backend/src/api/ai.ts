/**
 * AI API Routes
 * Churn risk prediction, offer recommendations, and message suggestions
 */

import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
  calculateChurnRisk,
  recommendBestOffer,
  suggestMessage,
  updateModelWithEvent,
  getAIPerformanceMetrics,
  initializeAIWeights,
} from '../services/AIService';
import { OfferEvent } from '../models/OfferEvent';
import AIWeight from '../models/AIWeight';

const router = Router();

/**
 * Initialize AI weights on startup
 */
initializeAIWeights().catch(console.error);

/**
 * GET /admin/ai/churn-risk/:userId
 * Get churn risk score for a user
 * Requires authentication
 */
router.get('/churn-risk/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid user ID',
      });
      return;
    }

    const riskResult = await calculateChurnRisk(userId);

    res.json({
      success: true,
      risk: riskResult,
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to calculate churn risk',
    });
  }
});

/**
 * GET /admin/ai/recommendations/:userId
 * Get offer and message recommendations for a user
 * Requires authentication
 */
router.get('/recommendations/:userId', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid user ID',
      });
      return;
    }

    const flowId = req.query.flowId ? parseInt(req.query.flowId as string) : undefined;

    // Get churn risk
    const riskResult = await calculateChurnRisk(userId);

    // Get offer recommendation
    const offerRecommendation = await recommendBestOffer(userId, flowId);

    // Get message suggestion for recommended offer
    const messageSuggestion = await suggestMessage(userId, offerRecommendation.offerType);

    res.json({
      success: true,
      recommendations: {
        churnRisk: riskResult,
        offer: offerRecommendation,
        message: messageSuggestion,
      },
    });
  } catch (error: any) {
    if (error.message === 'User not found') {
      res.status(404).json({
        error: 'Not Found',
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get recommendations',
    });
  }
});

/**
 * POST /admin/ai/update-weights
 * Manually update AI model weights
 * Requires authentication and admin role
 */
router.post('/update-weights', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const { weights } = req.body;

    if (!weights || typeof weights !== 'object') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Weights object is required',
      });
      return;
    }

    // Update weights
    const updates = [];
    for (const [name, value] of Object.entries(weights)) {
      if (typeof value !== 'number' || value < 0 || value > 10) {
        res.status(400).json({
          error: 'Bad Request',
          message: `Invalid weight value for ${name}: must be between 0 and 10`,
        });
        return;
      }

      const [weight] = await AIWeight.findOrCreate({
        where: { weightName: name },
        defaults: { weightName: name, weightValue: value },
      });

      await weight.update({ weightValue: value });
      updates.push({ name, value });
    }

    res.json({
      success: true,
      message: 'Weights updated successfully',
      weights: updates,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update weights',
    });
  }
});

/**
 * GET /admin/ai/performance
 * Get AI model performance metrics
 * Requires authentication
 */
router.get('/performance', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const metrics = await getAIPerformanceMetrics();

    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to get performance metrics',
    });
  }
});

/**
 * POST /admin/ai/update-event
 * Update AI model with new offer event
 * Requires authentication
 */
router.post('/update-event', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.admin) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
      return;
    }

    const { eventId } = req.body;

    if (!eventId || typeof eventId !== 'number') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Event ID is required',
      });
      return;
    }

    const event = await OfferEvent.findByPk(eventId);
    if (!event) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Event not found',
      });
      return;
    }

    await updateModelWithEvent(event);

    res.json({
      success: true,
      message: 'Model updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to update model',
    });
  }
});

export default router;

