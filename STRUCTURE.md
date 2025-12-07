# RetentionOS Project Structure

## ✅ Complete Folder Structure Created

```
retentionos/
├── .gitignore
├── README.md
├── STRUCTURE.md
│
├── src-backend/              # Backend source code (at root)
│   ├── api/                  # API route handlers
│   ├── services/             # Business logic services
│   ├── db/                   # Database configuration
│   │   └── index.ts
│   ├── migrations/           # Database migrations
│   │   └── 001_initial_schema.sql
│   ├── models/               # Sequelize/Prisma models
│   ├── rules/                # Retention flow rules engine
│   ├── analytics/            # Analytics calculation functions
│   ├── integrations/          # Third-party integrations (Stripe, etc.)
│   ├── middleware/           # Express middleware
│   │   └── auth.ts
│   └── utils/                # Utility functions
│
├── dashboard/                # Dashboard frontend (at root)
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── public/
│   └── src/
│       ├── pages/
│       │   ├── _app.tsx
│       │   └── index.tsx
│       ├── components/
│       ├── hooks/
│       ├── context/
│       ├── services/
│       └── styles/
│           └── globals.css
│
├── frontend/
│   ├── marketing-html/       # Marketing website
│   │   ├── package.json
│   │   ├── next.config.js
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── public/
│   │   └── src/
│   │       ├── pages/
│   │       │   ├── _app.tsx
│   │       │   └── index.tsx
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── context/
│   │       ├── services/
│   │       └── styles/
│   │           └── globals.css
│   │
│   └── widget/
│       ├── package.json
│       ├── README.md
│       ├── webpack.config.js
│       ├── build/
│       └── src/
│           ├── index.js
│           ├── modal/
│           │   └── Modal.js
│           └── api/
│               └── client.js
│
├── infra/
│   ├── docker-compose.yml
│   └── environment/
│       ├── dev.env
│       └── prod.env
│
└── docs/
    ├── architecture.md
    ├── api.md
    ├── data-model.md
    ├── workflows.md
    └── development-plan.md
```

## Configuration Files Created

### Backend (src-backend/)
- ✅ `package-backend.json` - Backend dependencies (at root)
- ✅ `tsconfig-backend.json` - TypeScript configuration (at root)
- ✅ `Dockerfile-backend` - Docker container configuration (at root)
- ✅ `src-backend/server.ts` - Express server entry point

### Frontend Dashboard (dashboard/)
- ✅ `package.json` - Next.js dependencies
- ✅ `next.config.js` - Next.js configuration
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `tailwind.config.js` - TailwindCSS with brand colors
- ✅ `postcss.config.js` - PostCSS configuration
- ✅ `_app.tsx` - Next.js app wrapper
- ✅ `globals.css` - Global styles with Inter font

### Widget
- ✅ `package.json` - Widget dependencies
- ✅ `webpack.config.js` - Webpack build configuration
- ✅ `README.md` - Widget documentation

### Infrastructure
- ✅ `docker-compose.yml` - Docker services (app, db, redis)
- ✅ `dev.env` - Development environment variables
- ✅ `prod.env` - Production environment variables

### Database
- ✅ `001_initial_schema.sql` - Complete database schema with all tables

## Next Steps

Follow the development roadmap in `docs/development-plan.md`:

1. **Phase 1: Setup and Foundation** ✅ (COMPLETE)
2. **Phase 2: Backend API Foundation** (Next)
3. **Phase 3: Widget + Backend Connection**
4. **Phase 4: Analytics Engine**
5. **Phase 5: Dashboard Integration**
6. **Phase 6: Flow Builder (MVP)**
7. **Phase 7: AI Integration (Optional MVP)**
8. **Phase 8: Frontend UI (Final)**
9. **Phase 9: Deployment**

## Brand Colors Configured

- Primary Blue: `#003A78`
- Primary Green: `#1F9D55`
- Grey 1: `#F5F5F5` (backgrounds)
- Grey 2: `#B5B5B5` (borders)
- Grey 3: `#333333` (text)
- Success: `#1F9D55`
- Warning: `#F0AD4E`
- Danger: `#D9534F`

## Typography

- Font Family: Inter (Google Fonts)
- Weights: Regular (400), Medium (500), Semi-bold (600), Bold (700)

