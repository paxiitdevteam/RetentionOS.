/**
 * Status API Routes
 * Returns current project development status
 */

import { Router, Request, Response } from 'express';
import { testConnection } from '../db';

const router = Router();

/**
 * GET /status
 * Get current project development status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbConnected = await testConnection();

    // Calculate overall progress
    const phases = {
      'Phase 1: Setup & Foundation': 'completed',
      'Phase 2.1: Database Setup': 'completed',
      'Phase 2.2: Authentication Service': 'completed',
      'Phase 2.3: API Key Service': 'completed',
      'Phase 2.4: Core Services': 'completed',
      'Phase 2.5: Retention Endpoints': 'completed',
      'Phase 2.6: Admin Endpoints': 'completed',
      'Phase 2.7: Stripe Integration': 'completed',
      'Phase 3: Widget + Backend': 'completed',
      'Phase 4: Analytics Engine': 'completed',
      'Phase 5: Dashboard Integration': 'completed',
      'Phase 6: Flow Builder (MVP)': 'completed',
      'Phase 7: AI Integration (Optional MVP)': 'completed',
      'Phase 8: Frontend UI (Final)': 'completed',
      'Phase 9: Deployment': 'completed',
      'Phase 10: Marketing Website': 'completed',
    };

    const completedPhases = Object.values(phases).filter(s => s === 'completed').length;
    const totalPhases = Object.keys(phases).length;
    const progressPercent = Math.round((completedPhases / totalPhases) * 100);

    // Backend status
    const backendStatus = {
      server: 'running',
      database: dbConnected ? 'connected' : 'disconnected',
      models: 8,
      totalModels: 8,
      healthEndpoints: 2,
      totalHealthEndpoints: 2,
      apiEndpoints: 16, // admin: login, logout, me, api-keys (5), analytics (5), flows (4), retention: start, decision, flow (3), stripe: webhook (1)
      totalApiEndpoints: 16,
      services: 10, // Auth, API Key, User, Subscription, Flow, Rules Engine, Retention, Event Logging, Analytics, Stripe
      totalServices: 10,
    };

    // PMS status
    const pmsStatus = {
      backend: 'implemented',
      dashboard: 'implemented',
      widget: 'implemented',
      version: '1.0.0',
    };

    // Database status
    const databaseStatus = {
      type: 'MariaDB/MySQL',
      connection: dbConnected ? 'ready' : 'error',
      modelsCreated: 8,
      totalModels: 8,
      migrations: 'ready',
      seedScript: 'ready',
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      progress: {
        percent: progressPercent,
        completed: completedPhases,
        total: totalPhases,
        phases,
      },
      backend: backendStatus,
      database: databaseStatus,
      pms: pmsStatus,
      stats: {
        databaseModels: 8,
        phasesComplete: completedPhases,
        overallProgress: `${progressPercent}%`,
        database: 'MariaDB',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get status',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;

