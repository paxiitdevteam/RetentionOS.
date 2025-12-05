# RetentionOS Backend

Node.js/Express backend API for RetentionOS.

## Setup

### Prerequisites
- Node.js 20+
- MariaDB 10.5+ or MySQL 8.0+ (on NAS)
- Redis 7+
- Git Bash (Windows) or Bash (Linux/macOS)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Run database migrations:
```bash
npm run migrate
```

5. Seed database (creates default admin):
```bash
npm run seed
```

6. Start development server:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data
- `npm run db:setup` - Run migrations and seed

## Database

The backend uses MariaDB/MySQL with Sequelize ORM (multiplatform compatible).

### Models
- User
- Subscription
- Flow
- OfferEvent
- ChurnReason
- AdminAccount
- ApiKey
- AuditLog

### Migrations
Migrations are in `src/migrations/`. Run with `npm run migrate`.

## API Endpoints

### Health Checks
- `GET /health` - Basic health check
- `GET /health/db` - Database connection check

### Retention Endpoints (Coming Soon)
- `POST /retention/start` - Start retention flow
- `POST /retention/decision` - Process user decision
- `GET /retention/flow/:id` - Get flow details

### Admin Endpoints (Coming Soon)
- `POST /admin/login` - Admin authentication
- `GET /admin/analytics/*` - Analytics endpoints
- `GET /admin/flows` - Flow management

## Development

See [docs/development-plan.md](../docs/development-plan.md) for the complete development roadmap.

