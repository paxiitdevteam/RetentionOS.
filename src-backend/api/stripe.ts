/**
 * Stripe Webhook API Routes
 * Handles Stripe webhook events
 */

import express, { Router, Request, Response } from 'express';
import {
  processWebhookEvent,
  verifyWebhookSignature,
} from '../services/StripeService';

const router = Router();

/**
 * POST /stripe/webhook
 * Stripe webhook endpoint
 * Validates webhook signature and processes events
 * 
 * NOTE: express.raw() middleware is applied at server level for this route
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Missing Stripe signature',
      });
      return;
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Webhook secret not configured',
      });
      return;
    }

    // Verify webhook signature
    // req.body is already a Buffer from express.raw()
    let event;
    try {
      event = verifyWebhookSignature(req.body, signature, webhookSecret);
    } catch (error: any) {
      console.error('❌ Webhook signature verification failed:', error);
      res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid webhook signature',
      });
      return;
    }

    // Process webhook event asynchronously
    // Acknowledge immediately to Stripe (< 200ms target)
    res.status(200).json({ received: true });

    // Process event in background (don't await)
    processWebhookEvent(event).catch((error) => {
      console.error(`❌ Error processing webhook event ${event.id}:`, error);
      // In production, you might want to queue this for retry
    });
  } catch (error: any) {
    console.error('❌ Error handling webhook:', error);
    // Still acknowledge to Stripe to prevent retries
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * GET /stripe/webhook/test
 * Test endpoint to verify Stripe integration is working
 * Requires authentication in production
 */
router.get('/webhook/test', async (req: Request, res: Response) => {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    res.json({
      success: true,
      configured: {
        secretKey: !!stripeSecretKey,
        webhookSecret: !!webhookSecret,
      },
      message: stripeSecretKey && webhookSecret
        ? 'Stripe integration is configured'
        : 'Stripe integration is not fully configured',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message || 'Failed to check Stripe configuration',
    });
  }
});

export default router;

