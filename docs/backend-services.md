# RetentionOS - Backend Services Blueprint

This document defines all core backend services, their functions, inputs, outputs, and storage requirements.

---

## Architecture Overview

RetentionOS backend uses a modular service architecture. Each service is isolated, testable, and has clear inputs and outputs.

---

## Core Services

### 1. Auth Service

**Purpose:** Handle admin authentication and JWT creation.

**Functions:**
- `createAdminAccount(email, passwordHash)` - Create new admin account
- `validateCredentials(email, password)` - Verify login credentials
- `generateJwt(adminId)` - Generate JWT token for authenticated admin
- `verifyJwt(token)` - Validate and decode JWT token

**Inputs:**
- `email` - Admin email address
- `password` - Admin password (hashed)

**Outputs:**
- `jwt` - JSON Web Token
- `adminId` - Admin account ID
- Error codes for invalid credentials

**Storage:**
- `AdminAccounts` table
- `APIKeys` table

---

### 2. API Key Service

**Purpose:** Issue and validate API keys for widgets.

**Functions:**
- `generateApiKey(adminId)` - Create new API key for admin
- `rotateApiKey(keyId)` - Generate new key and invalidate old one
- `validateKey(key)` - Check if API key is valid and active
- `recordLastUsed(keyId)` - Update last used timestamp

**Inputs:**
- `key` - API key string
- `adminId` - Admin account ID

**Outputs:**
- Valid or invalid state
- Admin reference

**Storage:**
- `APIKeys` table

---

### 3. User Service

**Purpose:** Store and retrieve user details from connected SaaS products.

**Functions:**
- `findOrCreateUser(externalId)` - Find existing user or create new
- `updateUserPlan(userId, plan)` - Update user's subscription plan
- `updateRegion(userId, region)` - Update user's geographic region
- `updateChurnScore(userId, score)` - Update calculated churn risk score

**Inputs:**
- `externalId` - External user identifier from SaaS product
- `plan` - Subscription plan name
- `region` - Geographic region code

**Outputs:**
- User record object

**Storage:**
- `Users` table

---

### 4. Subscription Service

**Purpose:** Manage subscription data and keep Stripe in sync.

**Functions:**
- `getSubscriptionByStripeId(stripeId)` - Retrieve subscription by Stripe ID
- `updateSubscriptionStatus(subId, status)` - Update subscription status
- `applyPause(subId)` - Pause subscription via Stripe
- `applyDowngrade(subId, newPlan)` - Downgrade subscription plan
- `applyDiscount(subId, percent)` - Apply discount to subscription

**Inputs:**
- `subscriptionId` - Internal subscription ID
- `stripeSubscriptionId` - Stripe subscription ID
- `plan` - New plan name (for downgrade)
- `discount` - Discount percentage

**Outputs:**
- Updated subscription object

**Storage:**
- `Subscriptions` table
- Stripe API

---

### 5. Flow Service

**Purpose:** Store and deliver retention flows that define the steps shown to users.

**Functions:**
- `getActiveFlowForUser(userId, plan, region)` - Get appropriate flow for user context
- `createFlow(flowData)` - Create new retention flow
- `updateFlow(flowId, steps)` - Update flow steps
- `calculateFlowRanking(flowId)` - Calculate flow performance ranking

**Inputs:**
- Flow JSON structure
- Admin edits
- Rules engine output

**Outputs:**
- Flow steps array
- Flow metadata

**Storage:**
- `Flows` table

---

### 6. Rules Engine Service

**Purpose:** Select the best set of retention steps for each user.

**Functions:**
- `segmentUser(user)` - Categorize user into segment
- `matchFlowToSegment(segment)` - Find best flow for user segment
- `rankOffersByBaseRules(offers)` - Order offers by baseline logic

**Segmentation Variables:**
- `plan` - Subscription plan tier
- `monthly value` - Monthly revenue value
- `region` - Geographic region
- `usage level` - Optional usage metrics

**Outputs:**
- List of steps ordered by baseline logic

**Storage:**
- Uses `Users`, `Subscriptions`, and `Flows` tables

---

### 7. Retention Service (Core)

**Purpose:** Main logic that drives the entire cancel interception system.

**Functions:**
- `startRetentionFlow(userId, subscriptionId)` - Initialize retention flow
- `processUserDecision(flowId, offerType, accepted, revenueValue)` - Process user's choice
- `callStripeUpdateActions()` - Execute Stripe API calls
- `logEvent(eventData)` - Log retention event

**Inputs:**
- User request from widget
- Flow steps
- Offer decision

**Outputs:**
- Next step in flow
- Final result
- Analytics updates

**Storage:**
- `OfferEvents` table
- `ChurnReasons` table
- Stripe API

---

### 8. Event Logging Service

**Purpose:** Store every cancel attempt, offer shown, action taken, and final result.

**Functions:**
- `logCancelAttempt(userId, flowId)` - Log initial cancel attempt
- `logOfferShown(flowId, offerType)` - Log when offer is displayed
- `logOfferDecision(userId, flowId, offerType, accepted, revenueSaved)` - Log user's decision

**Outputs:**
- Entries in `OfferEvents` table
- Entries in `ChurnReasons` table

**Storage:**
- `OfferEvents` table
- `ChurnReasons` table

---

### 9. Analytics Service

**Purpose:** Generate values for the admin dashboard.

**Functions:**
- `getSummaryMetrics()` - Get overall summary (revenue saved, users saved)
- `getSavedRevenueOverTime(days)` - Get revenue saved trend
- `getSavedUsersOverTime(days)` - Get users saved trend
- `getOfferPerformance()` - Get performance metrics per offer type
- `getChurnReasons()` - Get aggregated churn reason data

**Outputs:**
- Numbers
- Tables
- Time-series arrays

**Storage:**
- Reads from `OfferEvents` table
- Reads from `ChurnReasons` table
- Reads from `Subscriptions` table

---

### 10. Stripe Integration Service

**Purpose:** Sync subscription lifecycle events.

**Functions:**
- `handleSubscriptionUpdated(event)` - Process subscription update webhook
- `handleSubscriptionCancelled(event)` - Process cancellation webhook
- `handleInvoicePaid(event)` - Process payment webhook
- `handleTrialEnding(event)` - Process trial ending webhook

**Outputs:**
- Updated subscription records
- Internal events to analytics

**Storage:**
- `Subscriptions` table
- `Users` table
- Event logs

---

## Service Dependencies

```
Retention Service (Core)
├── User Service
├── Subscription Service
├── Flow Service
├── Rules Engine Service
├── Stripe Integration Service
└── Event Logging Service

Analytics Service
├── Event Logging Service
└── Subscription Service

Auth Service
└── API Key Service (for admin API keys)

API Key Service
└── Auth Service (for validation)
```

---

## Service Implementation Notes

### Error Handling
All services should return consistent error objects:
```typescript
{
  success: boolean,
  error?: {
    code: string,
    message: string
  },
  data?: any
}
```

### Testing
Each service should have:
- Unit tests for all functions
- Integration tests for database operations
- Mock implementations for external APIs (Stripe)

### Logging
All services should log:
- Function entry/exit
- Errors
- Important state changes

---

*This document is part of the RetentionOS technical specification.*

