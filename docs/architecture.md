# RetentionOS Architecture

## System Overview

RetentionOS is a universal retention engine for SaaS founders. The platform intercepts cancel events, shows tailored retention flows, saves users, and produces strong analytics.

## Components

### Backend API
- Express.js server
- MariaDB/MySQL database (multiplatform)
- Redis for caching
- JWT authentication
- Stripe webhook integration

### Frontend Dashboard
- Next.js application
- Admin authentication
- Analytics visualization
- Flow builder interface

### Widget SDK
- Vanilla JavaScript
- Modal system
- API integration
- Cancel button detection

## Data Flow

1. User clicks cancel button
2. Widget detects event
3. Widget calls `/retention/start`
4. Backend returns flow JSON
5. Widget displays modal
6. User makes decision
7. Widget calls `/retention/decision`
8. Backend logs event and updates analytics

## Technology Stack

- **Backend**: Node.js, Express, TypeScript, MariaDB/MySQL, Sequelize
- **Frontend Dashboard**: Next.js, React, TypeScript, TailwindCSS
- **Widget**: Vanilla JavaScript, Webpack
- **Infrastructure**: Docker, Docker Compose, Nginx

