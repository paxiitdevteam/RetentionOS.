# RetentionOS Development Plan

## Phase 1: Setup and Foundation ✅
- [x] Create folder structure
- [x] Initialize backend environment
- [x] Initialize Next.js dashboard
- [x] Initialize widget package
- [x] Setup Docker configuration
- [ ] Create database migrations
- [ ] Setup environment variables

## Phase 2: Backend API Foundation
- [ ] Implement admin authentication (JWT)
- [ ] Implement API key system
- [ ] Create database models
- [ ] Implement Stripe webhook handlers
- [ ] Build core endpoints:
  - POST /retention/start
  - POST /retention/decision
  - GET /retention/flow
  - POST /admin/login
  - GET /admin/analytics/summary
  - GET /admin/analytics/offers
  - GET /admin/analytics/reasons
  - POST /admin/flows
  - PUT /admin/flows/:id
  - GET /admin/flows

## Phase 3: Widget + Backend Connection
- [ ] Implement cancel button detection
- [ ] Build widget API client
- [ ] Create modal component
- [ ] Connect widget to backend endpoints
- [ ] Handle success/fail states

## Phase 4: Analytics Engine
- [ ] Implement saved revenue calculation
- [ ] Implement saved users calculation
- [ ] Implement offer performance metrics
- [ ] Implement churn reasons aggregation
- [ ] Build trend line calculations
- [ ] Expose analytics endpoints

## Phase 5: Dashboard Integration
- [ ] Implement admin JWT auth
- [ ] Build overview page
- [ ] Create saved revenue chart
- [ ] Create saved users chart
- [ ] Build top reasons table
- [ ] Build offer performance table
- [ ] Create user timeline

## Phase 6: Flow Builder (MVP)
- [ ] Backend CRUD for flows
- [ ] Flow validation
- [ ] Flow ranking score
- [ ] Dashboard flow list
- [ ] Flow edit view
- [ ] Step editor
- [ ] Preview modal

## Phase 7: AI Integration (Optional MVP)
- [ ] Churn risk prediction
- [ ] Offer ranking
- [ ] Text suggestions
- [ ] Learning from event history
- [ ] AI endpoints

## Phase 8: Frontend UI (Final)
- [ ] Dashboard navigation
- [ ] Clean card components
- [ ] Table components
- [ ] Chart components
- [ ] Drag-and-drop flow builder
- [ ] Widget modal UI
- [ ] Responsive layout
- [ ] CTA buttons
- [ ] Feedback field

## Phase 9: Deployment
- [ ] Docker-compose setup
- [ ] Nginx reverse proxy
- [ ] CDN build for widget
- [ ] Database migrations
- [ ] Production env variables
- [ ] Logging and monitoring

