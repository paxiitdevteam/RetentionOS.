# RetentionOS - Complete Specification Document

This document contains all specifications for development, design, marketing, and deployment.

---

## PITCH DECK (TEXT FOR SLIDES)

### Slide 1. Title
**RetentionOS.**

Retention engine for SaaS founders.

---

### Slide 2. Problem
Users cancel.

Founders lose revenue.

Churn slows growth.

Most tools charge revenue share.

Founders want predictable cost.

---

### Slide 3. Market
Millions of subscription products worldwide.

Retention is cheaper than acquisition.

Demand for simple retention tools rising fast.

---

### Slide 4. Solution
RetentionOS intercepts cancellation events and gives users pause, downgrade, discount, or support flows.

The system saves users and provides data founders need.

---

### Slide 5. How it works
User clicks cancel.

Widget triggers flow.

Backend selects steps.

User accepts or rejects offers.

Stripe updates.

Analytics update.

Dashboard displays results.

---

### Slide 6. Product
Cancel interceptor.

Retention modal.

Flow builder.

Analytics dashboard.

AI suggestions.

Stripe integration.

Team roles.

---

### Slide 7. Benefits
Lower churn.

More saved revenue.

Clear insights.

Simple deployment.

Fixed pricing.

---

### Slide 8. Traction
Beta users.

Saved revenue events.

First flow performance results.

Positive feedback.

---

### Slide 9. Business model
Monthly fee.

Three tiers.

Zero revenue share.

---

### Slide 10. Roadmap
AI engine.

Agency mode.

More integrations.

Mobile SDK.

---

### Slide 11. Vision
Global retention layer for all subscription products.

---

### Slide 12. Ask
Advisors, early adopters, and partners.

---

## DEPLOYMENT SCRIPTS (CURSOR WILL GENERATE CODE FROM THIS OUTLINE)

### Goal
Deploy RetentionOS with Docker, Nginx, PostgreSQL, and a CDN bundle for the widget.

### Docker Tasks

#### Backend Dockerfile
- Create Dockerfile for backend
- Base on Node LTS or Python
- Expose port 8080
- Install production dependencies

#### Dashboard Dockerfile
- Create Dockerfile for dashboard
- Base on Node LTS
- Build Next app
- Serve with standalone server

#### Docker Compose
- Create docker-compose with backend, dashboard, postgres, redis
- Set network names
- Set volumes
- Set health checks

### Nginx Tasks
- Create nginx.conf
- Route /api to backend
- Route / to dashboard
- Set gzip
- Set SSL block for later use

### CDN Tasks
- Build widget as minified JS bundle
- Upload to public folder or CDN bucket
- Serve with long cache lifetime

### Environment Tasks
Set variables for production:
- JWT secret
- Stripe secret
- Database URL
- API key secret
- Redis URL

### Migration Tasks
- Run migrations on container start
- Create admin user if not exists

---

## MARKETING WEBSITE COPY (HOMEPAGE)

### Header
**RetentionOS.**

Protect your revenue. Stop churn.

### Subheader
Users try to cancel. You keep them.

Simple flows that save users and increase your monthly revenue.

### Section: Problem
Cancellation happens without guidance.

Revenue drops.

You guess why users leave.

Your growth slows.

### Section: Solution
RetentionOS triggers a flow when users try to cancel.

Pause. Downgrade. Discount. Support.

Each step adapts to the user profile.

The system collects data and improves over time.

### Section: Features
- Cancel interceptor
- Custom flows
- AI suggestions
- Analytics
- Stripe sync
- Multi-language flows

### Section: Why Founders Trust This
- Simple installation
- Fast results
- Fixed price
- Strong insights

### Section: Dashboard
- Saved revenue view
- Saved users view
- Churn reasons
- Offer performance
- Flow builder

### Section: Pricing
Clear monthly plans.

Zero revenue share.

Cancel anytime.

### Section: Call to Action
Start free today.

Deploy in minutes.

---

## FIGMA EXPORT PROMPT FOR CURSOR OR DESIGNER

### Create a full Figma project named RetentionOS UI

#### Artboards
Desktop 1440 width:
- Flow builder
- Analytics
- Dashboard home
- API keys
- User timeline
- Widget modal

#### Design System

**Color Tokens:**
- Primary blue: `#003A78`
- Primary green: `#1F9D55`
- Grey scale set from `#F5F5F5` to `#333333`

**Font Set:**
- Inter
  - Regular
  - Medium
  - Semibold

#### Components
- Top navigation bar
- Sidebar
- Card
- Button set
- Input set
- Modal container
- Chart container
- Table layout
- Flow step block
- Drag handle element

#### Widget Modal
- Centered box
- White background
- Title "Before you go"
- Pause button
- Downgrade button
- Discount button
- Support link
- Feedback input
- Continue cancel link

#### Dashboard Layout
- Three metric cards
- Line chart
- Offer table
- Sidebar menu

#### Flow Builder
- Left column: list of steps
- Middle column: step editor
- Right column: preview

#### Export Requirements
- Organize components in library pages
- Create variants for buttons and inputs
- Name layers cleanly
- Enable auto layout everywhere
- Use spacing rules defined earlier

---

## DEVELOPMENT NOTES

### Implementation Priority
1. Backend API Foundation
2. Widget + Backend Connection
3. Analytics Engine
4. Dashboard Integration
5. Flow Builder (MVP)
6. AI Integration (Optional MVP)
7. Frontend UI (Final)
8. Deployment
9. Marketing Website

### Key Technical Decisions
- Backend: Node.js/Express with TypeScript
- Frontend Dashboard: Next.js with React
- Widget: Vanilla JavaScript with Webpack
- Database: PostgreSQL with Sequelize
- Cache: Redis
- Deployment: Docker + Docker Compose + Nginx
- Authentication: JWT for admin, API keys for widgets

### Brand Guidelines
- Colors: Deep Blue (#003A78), Green (#1F9D55), Grey scale
- Typography: Inter font family
- Spacing: 24px sections, 16px cards, 12px buttons
- Border radius: 8px
- Modal max width: 420px

---

## NEXT STEPS FOR CURSOR

1. **Review this specification** before starting any phase
2. **Reference pitch deck** when building marketing materials
3. **Follow deployment outline** when creating Docker and Nginx configs
4. **Use marketing copy** for homepage and landing pages
5. **Follow Figma prompt** when designing UI components
6. **Maintain brand consistency** across all implementations

---

*Last Updated: Initial specification*
*Version: 1.0*

