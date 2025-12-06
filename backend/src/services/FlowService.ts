/**
 * Flow Service
 * Store and deliver retention flows that define the steps shown to users
 * Per backend-services.md specification
 */

import { Op } from 'sequelize';
import Flow from '../models/Flow';
import { OfferEvent } from '../models/OfferEvent';

export interface FlowStep {
  type: 'pause' | 'downgrade' | 'discount' | 'support' | 'feedback';
  title: string;
  message: string;
  config?: Record<string, any>;
}

export interface FlowData {
  name: string;
  steps: FlowStep[];
  language?: string;
}

/**
 * Get active flow for user based on context
 * @param userId User ID
 * @param plan User subscription plan
 * @param region User geographic region
 * @returns Flow record or null
 */
export async function getActiveFlowForUser(
  userId: number,
  plan?: string,
  region?: string
): Promise<Flow | null> {
  // Get user's language preference (default to 'en')
  const language = 'en'; // TODO: Get from user preferences

  // Find flows matching user context
  // Priority: 1) Active flows with highest ranking score, 2) Language match
  const flow = await Flow.findOne({
    where: {
      language,
      // Only get flows with ranking score > 0 (active flows)
      rankingScore: {
        [Op.gt]: 0,
      },
    },
    order: [['rankingScore', 'DESC']],
    limit: 1,
  });

  return flow;
}

/**
 * Create new retention flow
 * @param flowData Flow data with name and steps
 * @returns Created flow record
 */
export async function createFlow(flowData: FlowData): Promise<Flow> {
  // Validate steps
  if (!flowData.steps || !Array.isArray(flowData.steps) || flowData.steps.length === 0) {
    throw new Error('Flow must have at least one step');
  }

  // Validate step types
  const validTypes = ['pause', 'downgrade', 'discount', 'support', 'feedback'];
  for (const step of flowData.steps) {
    if (!validTypes.includes(step.type)) {
      throw new Error(`Invalid step type: ${step.type}`);
    }
  }

  const flow = await Flow.create({
    name: flowData.name,
    steps: flowData.steps,
    language: flowData.language || 'en',
    rankingScore: 0, // New flows start with 0 score
  });

  return flow;
}

/**
 * Update flow steps
 * @param flowId Flow ID
 * @param steps New steps array
 * @returns Updated flow record
 */
export async function updateFlow(flowId: number, steps: FlowStep[]): Promise<Flow> {
  // Validate steps
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    throw new Error('Flow must have at least one step');
  }

  // Validate step types
  const validTypes = ['pause', 'downgrade', 'discount', 'support', 'feedback'];
  for (const step of steps) {
    if (!validTypes.includes(step.type)) {
      throw new Error(`Invalid step type: ${step.type}`);
    }
  }

  const flow = await Flow.findByPk(flowId);
  if (!flow) {
    throw new Error('Flow not found');
  }

  await flow.update({ steps });
  await flow.reload();

  return flow;
}

/**
 * Calculate flow performance ranking
 * Based on offer acceptance rates and revenue saved
 * @param flowId Flow ID
 * @returns Updated flow with new ranking score
 */
export async function calculateFlowRanking(flowId: number): Promise<Flow> {
  const flow = await Flow.findByPk(flowId);
  if (!flow) {
    throw new Error('Flow not found');
  }

  // Get all offer events for this flow
  const offerEvents = await OfferEvent.findAll({
    where: { flowId },
  });

  if (offerEvents.length === 0) {
    // No events yet, keep score at 0
    return flow;
  }

  // Calculate metrics
  const totalOffers = offerEvents.length;
  const acceptedOffers = offerEvents.filter(e => e.accepted).length;
  const acceptanceRate = totalOffers > 0 ? (acceptedOffers / totalOffers) * 100 : 0;

  // Calculate total revenue saved
  const totalRevenueSaved = offerEvents
    .filter(e => e.accepted && e.revenueSaved)
    .reduce((sum, e) => sum + (e.revenueSaved || 0), 0);

  // Calculate ranking score (0-100)
  // Formula: (acceptance_rate * 0.6) + (revenue_factor * 0.4)
  // Revenue factor is normalized (assume max $1000 per saved user = 100 points)
  const revenueFactor = Math.min((totalRevenueSaved / 10), 100); // $1000 = 100 points
  const rankingScore = Math.round(
    (acceptanceRate * 0.6) + (revenueFactor * 0.4)
  );

  // Update flow with new ranking score
  await flow.update({ rankingScore });
  await flow.reload();

  return flow;
}

/**
 * Get flow by ID
 * @param flowId Flow ID
 * @returns Flow record or null
 */
export async function getFlowById(flowId: number): Promise<Flow | null> {
  return await Flow.findByPk(flowId);
}

/**
 * List all flows
 * @param language Optional language filter
 * @returns Array of flow records
 */
export async function listFlows(language?: string): Promise<Flow[]> {
  const whereClause: any = {};
  if (language) {
    whereClause.language = language;
  }

  return await Flow.findAll({
    where: whereClause,
    order: [['rankingScore', 'DESC'], ['createdAt', 'DESC']],
  });
}

/**
 * Delete flow
 * @param flowId Flow ID
 */
export async function deleteFlow(flowId: number): Promise<void> {
  const flow = await Flow.findByPk(flowId);
  if (!flow) {
    throw new Error('Flow not found');
  }

  await flow.destroy();
}

/**
 * Duplicate flow
 * @param flowId Flow ID to duplicate
 * @param newName Optional new name (defaults to "Copy of {original name}")
 * @returns New flow record
 */
export async function duplicateFlow(flowId: number, newName?: string): Promise<Flow> {
  const originalFlow = await Flow.findByPk(flowId);
  if (!originalFlow) {
    throw new Error('Flow not found');
  }

  const flowName = newName || `Copy of ${originalFlow.name}`;

  const newFlow = await Flow.create({
    name: flowName,
    steps: originalFlow.steps,
    language: originalFlow.language,
    rankingScore: 0, // New flow starts with 0 score
  });

  return newFlow;
}

/**
 * Update flow (full update including name, steps, language)
 * @param flowId Flow ID
 * @param flowData Updated flow data
 * @returns Updated flow record
 */
export async function updateFlowFull(flowId: number, flowData: Partial<FlowData>): Promise<Flow> {
  const flow = await Flow.findByPk(flowId);
  if (!flow) {
    throw new Error('Flow not found');
  }

  // Validate steps if provided
  if (flowData.steps) {
    if (!Array.isArray(flowData.steps) || flowData.steps.length === 0) {
      throw new Error('Flow must have at least one step');
    }

    const validTypes = ['pause', 'downgrade', 'discount', 'support', 'feedback'];
    for (const step of flowData.steps) {
      if (!validTypes.includes(step.type)) {
        throw new Error(`Invalid step type: ${step.type}`);
      }
    }
  }

  // Update fields
  const updateData: any = {};
  if (flowData.name !== undefined) updateData.name = flowData.name;
  if (flowData.steps !== undefined) updateData.steps = flowData.steps;
  if (flowData.language !== undefined) updateData.language = flowData.language;

  await flow.update(updateData);
  await flow.reload();

  return flow;
}

/**
 * Validate flow structure and content
 * @param flowData Flow data to validate
 * @returns Validation result with errors array
 */
export interface FlowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateFlow(flowData: FlowData): FlowValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name
  if (!flowData.name || flowData.name.trim().length === 0) {
    errors.push('Flow name is required');
  } else if (flowData.name.length > 255) {
    errors.push('Flow name must be 255 characters or less');
  }

  // Validate steps
  if (!flowData.steps || !Array.isArray(flowData.steps)) {
    errors.push('Flow must have a steps array');
    return { valid: false, errors, warnings };
  }

  if (flowData.steps.length === 0) {
    errors.push('Flow must have at least one step');
  }

  if (flowData.steps.length > 10) {
    warnings.push('Flows with more than 10 steps may have lower conversion rates');
  }

  // Validate each step
  const validTypes = ['pause', 'downgrade', 'discount', 'support', 'feedback'];
  flowData.steps.forEach((step, index) => {
    if (!step.type || !validTypes.includes(step.type)) {
      errors.push(`Step ${index + 1}: Invalid step type "${step.type}"`);
    }

    if (!step.title || step.title.trim().length === 0) {
      errors.push(`Step ${index + 1}: Title is required`);
    }

    if (!step.message || step.message.trim().length === 0) {
      errors.push(`Step ${index + 1}: Message is required`);
    }

    // Type-specific validation
    if (step.type === 'discount' && (!step.config || !step.config.percentage)) {
      errors.push(`Step ${index + 1}: Discount step must have a percentage in config`);
    }

    if (step.type === 'downgrade' && (!step.config || !step.config.plan)) {
      warnings.push(`Step ${index + 1}: Downgrade step should specify a target plan`);
    }
  });

  // Validate language
  if (flowData.language && flowData.language.length !== 2) {
    warnings.push('Language code should be 2 characters (e.g., "en", "es")');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get flow templates (pre-built flows)
 * @returns Array of template flow data
 */
export function getFlowTemplates(): FlowData[] {
  return [
    {
      name: 'Standard Retention Flow',
      language: 'en',
      steps: [
        {
          type: 'pause',
          title: 'Wait, before you go...',
          message: 'We hate to see you leave! Would you like to pause your subscription instead?',
        },
        {
          type: 'discount',
          title: 'Special Offer Just For You',
          message: 'Get 20% off your next 3 months!',
          config: { percentage: 20, duration: 3 },
        },
        {
          type: 'feedback',
          title: 'Help Us Improve',
          message: 'We\'d love to hear why you\'re canceling. Your feedback helps us improve.',
        },
      ],
    },
    {
      name: 'Aggressive Retention Flow',
      language: 'en',
      steps: [
        {
          type: 'pause',
          title: 'Pause Your Subscription',
          message: 'Take a break without losing your data. You can resume anytime!',
        },
        {
          type: 'downgrade',
          title: 'Downgrade Instead?',
          message: 'Switch to a lower plan that might better fit your needs.',
          config: { plan: 'basic' },
        },
        {
          type: 'discount',
          title: '50% Off Next 6 Months',
          message: 'We want to keep you! Here\'s a special discount.',
          config: { percentage: 50, duration: 6 },
        },
        {
          type: 'support',
          title: 'Talk to Our Team',
          message: 'Our support team can help find a solution that works for you.',
        },
      ],
    },
    {
      name: 'Simple Feedback Flow',
      language: 'en',
      steps: [
        {
          type: 'feedback',
          title: 'Why Are You Leaving?',
          message: 'Your feedback is valuable to us. Please let us know why you\'re canceling.',
        },
      ],
    },
  ];
}

/**
 * Activate flow (set ranking score > 0)
 * @param flowId Flow ID
 * @returns Updated flow
 */
export async function activateFlow(flowId: number): Promise<Flow> {
  const flow = await Flow.findByPk(flowId);
  if (!flow) {
    throw new Error('Flow not found');
  }

  // Validate flow before activation
  const validation = validateFlow({
    name: flow.name,
    steps: flow.steps as FlowStep[],
    language: flow.language,
  });

  if (!validation.valid) {
    throw new Error(`Flow validation failed: ${validation.errors.join(', ')}`);
  }

  // Set ranking score to 1 if it's 0 (activate)
  if (flow.rankingScore === 0) {
    await flow.update({ rankingScore: 1 });
    await flow.reload();
  }

  return flow;
}

/**
 * Deactivate flow (set ranking score to 0)
 * @param flowId Flow ID
 * @returns Updated flow
 */
export async function deactivateFlow(flowId: number): Promise<Flow> {
  const flow = await Flow.findByPk(flowId);
  if (!flow) {
    throw new Error('Flow not found');
  }

  await flow.update({ rankingScore: 0 });
  await flow.reload();

  return flow;
}

