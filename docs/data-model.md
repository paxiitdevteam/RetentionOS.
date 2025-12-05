# RetentionOS Data Model

## Database Schema

### users
- id (PK)
- external_id
- email
- plan
- region
- churn_score
- created_at
- updated_at

### subscriptions
- id (PK)
- user_id (FK)
- stripe_subscription_id
- value
- status
- cancel_attempts
- created_at
- updated_at

### flows
- id (PK)
- name
- steps (JSONB)
- ranking_score
- language
- created_at
- updated_at

### offer_events
- id (PK)
- user_id (FK)
- flow_id (FK)
- offer_type
- accepted
- revenue_saved
- created_at

### churn_reasons
- id (PK)
- user_id (FK)
- reason_code
- reason_text
- created_at

### admin_accounts
- id (PK)
- email
- password_hash
- created_at
- updated_at

### api_keys
- id (PK)
- key
- owner_id (FK)
- created_at
- last_used

### audit_logs
- id (PK)
- admin_id (FK)
- action
- created_at

