/**
 * Models Index
 * Exports all models and initializes associations
 */

import User from './User';
import Subscription from './Subscription';
import Flow from './Flow';
import OfferEvent from './OfferEvent';
import ChurnReason from './ChurnReason';
import AdminAccount from './AdminAccount';
import ApiKey from './ApiKey';
import AuditLog from './AuditLog';

// Initialize all associations
// (Associations are defined in individual model files)

export {
  User,
  Subscription,
  Flow,
  OfferEvent,
  ChurnReason,
  AdminAccount,
  ApiKey,
  AuditLog,
};

export default {
  User,
  Subscription,
  Flow,
  OfferEvent,
  ChurnReason,
  AdminAccount,
  ApiKey,
  AuditLog,
};

