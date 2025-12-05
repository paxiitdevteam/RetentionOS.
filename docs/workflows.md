# RetentionOS Workflows

## Retention Flow Workflow

1. **Detection**: Widget detects cancel button click
2. **Initialization**: Widget calls `/retention/start` with user context
3. **Flow Selection**: Backend selects appropriate flow based on:
   - User plan
   - Region
   - Churn score
   - Flow ranking
4. **Display**: Widget renders modal with flow steps
5. **Interaction**: User interacts with offers
6. **Decision**: Widget sends decision to `/retention/decision`
7. **Processing**: Backend processes decision:
   - Updates subscription (if accepted)
   - Logs event
   - Updates analytics
   - Sends webhook (if configured)
8. **Completion**: Widget shows success/failure state

## Admin Dashboard Workflow

1. **Login**: Admin authenticates via `/admin/login`
2. **Dashboard**: View analytics summary
3. **Analytics**: Drill into specific metrics
4. **Flow Builder**: Create/edit retention flows
5. **Settings**: Manage API keys and account

## Analytics Calculation Workflow

1. **Event Collection**: All retention events logged to `offer_events`
2. **Aggregation**: Analytics engine calculates:
   - Saved revenue (sum of revenue_saved where accepted=true)
   - Saved users (count of unique users where accepted=true)
   - Offer performance (success rate per offer type)
   - Churn reasons (aggregated from churn_reasons table)
3. **Caching**: Results cached in Redis
4. **Display**: Dashboard fetches cached analytics

