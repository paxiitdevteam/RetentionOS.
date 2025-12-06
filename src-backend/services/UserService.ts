/**
 * User Service
 * Store and retrieve user details from connected SaaS products
 * Per backend-services.md specification
 */

import User from '../models/User';

/**
 * Find existing user or create new
 * @param externalId External user identifier from SaaS product
 * @param email User email (optional)
 * @param plan User subscription plan (optional)
 * @param region User geographic region (optional)
 * @returns User record
 */
export async function findOrCreateUser(
  externalId: string,
  email?: string,
  plan?: string,
  region?: string
): Promise<User> {
  // Try to find existing user by external ID
  let user = await User.findOne({ where: { externalId } });

  if (!user) {
    // Create new user
    user = await User.create({
      externalId,
      email: email || null,
      plan: plan || null,
      region: region || null,
      churnScore: 0,
    });
  } else {
    // Update existing user if new data provided
    const updates: Partial<User> = {};
    if (email && email !== user.email) updates.email = email;
    if (plan && plan !== user.plan) updates.plan = plan;
    if (region && region !== user.region) updates.region = region;

    if (Object.keys(updates).length > 0) {
      await user.update(updates);
      await user.reload();
    }
  }

  return user;
}

/**
 * Update user's subscription plan
 * @param userId User ID
 * @param plan New plan name
 * @returns Updated user record
 */
export async function updateUserPlan(userId: number, plan: string): Promise<User> {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await user.update({ plan });
  await user.reload();

  return user;
}

/**
 * Update user's geographic region
 * @param userId User ID
 * @param region Region code
 * @returns Updated user record
 */
export async function updateRegion(userId: number, region: string): Promise<User> {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await user.update({ region });
  await user.reload();

  return user;
}

/**
 * Update calculated churn risk score
 * @param userId User ID
 * @param score Churn risk score (0-100)
 * @returns Updated user record
 */
export async function updateChurnScore(userId: number, score: number): Promise<User> {
  // Validate score range
  if (score < 0 || score > 100) {
    throw new Error('Churn score must be between 0 and 100');
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await user.update({ churnScore: score });
  await user.reload();

  return user;
}

/**
 * Get user by ID
 * @param userId User ID
 * @returns User record or null
 */
export async function getUserById(userId: number): Promise<User | null> {
  return await User.findByPk(userId);
}

/**
 * Get user by external ID
 * @param externalId External user identifier
 * @returns User record or null
 */
export async function getUserByExternalId(externalId: string): Promise<User | null> {
  return await User.findOne({ where: { externalId } });
}

