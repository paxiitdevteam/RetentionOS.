# RetentionOS - AI Engine Specification

This document defines the AI engine architecture, functions, and implementation details for RetentionOS.

---

## Overview

RetentionOS uses a simple, safe AI engine for suggestions and prediction. This is not heavy ML. It is lightweight and explainable.

---

## 1. Purpose of the AI Engine

- Predict which users are at high risk of churning
- Recommend which retention offer to show first
- Recommend message text that increases acceptance rate
- Learn from historical data to improve over time

---

## 2. AI Inputs

### User Profile
- `plan` - Subscription plan tier
- `region` - Geographic region
- `history` - User interaction history
- `value` - Monthly revenue value
- `cancel attempts` - Number of previous cancel attempts

### Behavioral Data
- `past offers` - Historical offers shown to user
- `accepted or rejected` - User response history
- `flow success rates` - Success rates of different flows

### Context Data
- `time of cancellation` - When user attempts to cancel
- `payment status` - Current payment status
- `trial vs paid` - Whether user is on trial or paid plan

---

## 3. AI Outputs

- **Churn risk score** - Number from 0 to 100
- **Predicted best offer type** - Recommended offer (pause, downgrade, discount, support)
- **Suggested retention message text** - Customized message for user
- **Ranking of offers** - Ordered list of offers for the flow

---

## 4. AI Architecture

### Layer 1: Rule-based Logic
Simple segmentation based on user attributes.

**Examples:**
- High-value users → Show discount first
- Users close to renewal → Show pause option
- Users on discounted plans → Show downgrade option

### Layer 2: Pattern Scoring
Compute performance based on offer history.

**Examples:**
- Discount accepted by 40% of users
- Pause accepted by 55% of users
- Downgrade accepted by 20% of users

### Layer 3: Predictive Scoring
Use logistic scoring based on raw data.

**Formula:**
```
risk = weightA * behavior + weightB * value + weightC * history
```

### Layer 4: Suggestion Layer
- Pick top message templates
- Pick top offer ordering
- Select fallback if no patterns exist

---

## 5. AI Engine Functions

### calculateChurnRisk(userId)

**Purpose:** Calculate churn risk score for a user.

**Inputs:**
- `user data` - User profile information
- `subscription data` - Subscription details
- `offer history` - Historical offer interactions

**Output:**
- `score` - Number from 0 to 100 (0 = low risk, 100 = high risk)

**Algorithm:**
1. Gather user attributes
2. Check historical behavior patterns
3. Apply weighted scoring model
4. Return normalized risk score

---

### recommendBestOffer(userId, flowId)

**Purpose:** Recommend the best retention offer for a user.

**Inputs:**
- `past offers` - Historical offer data
- `segment` - User segment classification
- `risk score` - Calculated churn risk

**Output:**
- `offerType` - Recommended offer type (pause, downgrade, discount, support)

**Algorithm:**
1. Get user segment
2. Check segment-specific offer performance
3. Consider churn risk level
4. Return highest-performing offer for segment

---

### suggestMessage(userId, offerType)

**Purpose:** Generate or select retention message text.

**Inputs:**
- `offer history` - Past offer interactions
- `message library` - Available message templates

**Output:**
- `short retention message` - Customized message text

**Algorithm:**
1. Select base template for offer type
2. Personalize with user data if available
3. Return formatted message

---

### updateModelWithEvent(event)

**Purpose:** Update AI model weights based on new events.

**Inputs:**
- `offer decision` - User's decision (accepted/rejected)
- `revenue saved` - Revenue impact if accepted
- `time` - Timestamp of event

**Output:**
- `adjusted weights` - Updated model weights

**Algorithm:**
1. Calculate event impact
2. Adjust segment-specific weights
3. Update offer performance scores
4. Store updated weights

---

## 6. Message Templates (Starter Set)

### Pause
"You can pause your plan. No charges until you resume."

### Downgrade
"Switch to a lighter plan. Keep your data and pay less."

### Discount
"Take a short discount period if cost is the reason."

### Support
"Tell us what blocked your experience. We respond fast."

---

## 7. Storage for AI Engine

### AIWeights Table
Stores model weights and configuration:
- `segment` - User segment identifier
- `weight_behavior` - Weight for behavior factor
- `weight_value` - Weight for value factor
- `weight_history` - Weight for history factor
- `updated_at` - Last update timestamp

### OfferPerformance Table
Tracks offer performance metrics:
- `offer_type` - Type of offer (pause, downgrade, etc.)
- `segment` - User segment
- `acceptance_rate` - Percentage of users who accepted
- `revenue_saved_avg` - Average revenue saved
- `sample_size` - Number of events
- `last_calculated` - Last calculation timestamp

### MessagePerformance Table
Tracks message template performance:
- `message_template_id` - Template identifier
- `offer_type` - Associated offer type
- `acceptance_rate` - Acceptance rate for this message
- `sample_size` - Number of times shown
- `last_updated` - Last update timestamp

**Data Update Frequency:** Daily (via scheduled job)

---

## 8. Safety and Constraints

### Data Privacy
- No personal data analysis beyond fields provided
- No PII (Personally Identifiable Information) stored in AI models
- All data anonymized for model training

### Text Generation
- No generation of long text
- Only template-based message suggestions
- Maximum message length: 200 characters

### Model Complexity
- No black-box ML needed for MVP
- All algorithms are explainable
- Rule-based logic is primary method

### Explainability
- System explains why an offer is recommended
- Risk scores include contributing factors
- Offer rankings show reasoning

---

## 9. Implementation Phases

### Phase 1: MVP (Rule-based only)
- Simple segmentation
- Fixed offer ordering
- Template messages only

### Phase 2: Pattern Scoring
- Historical performance tracking
- Segment-specific offer ranking
- Basic message personalization

### Phase 3: Predictive Scoring
- Churn risk calculation
- Weighted scoring model
- Dynamic offer selection

### Phase 4: Learning System
- Automatic weight adjustment
- A/B testing framework
- Performance optimization

---

## 10. API Endpoints

### GET /admin/ai/churn-risk/:userId
Returns churn risk score for a user.

### GET /admin/ai/recommendations/:userId
Returns recommended offers and messages.

### POST /admin/ai/update-weights
Manually update model weights (admin only).

### GET /admin/ai/performance
Returns AI model performance metrics.

---

## 11. Testing Strategy

### Unit Tests
- Test each AI function with mock data
- Verify scoring calculations
- Test edge cases (no history, new users)

### Integration Tests
- Test with real database data
- Verify weight updates
- Test message generation

### Performance Tests
- Measure response times
- Test with large datasets
- Verify daily update job performance

---

*This document is part of the RetentionOS technical specification.*

