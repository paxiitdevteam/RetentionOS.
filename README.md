# RetentionOS

<div align="center">

**Universal SaaS Churn-Reduction Platform**

[![GitHub](https://img.shields.io/github/license/paxiitdevteam/RetentionOS)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

</div>

## 🎯 Overview

RetentionOS is a production-grade retention engine for SaaS founders. The platform intercepts cancel events, shows tailored retention flows, saves users, and produces strong analytics.

### Key Features

- 🎯 **Cancel Event Interception** - Automatically detects and intercepts cancel button clicks
- 💰 **Revenue Recovery** - Tailored retention flows to save at-risk customers
- 📊 **Analytics Dashboard** - Comprehensive analytics on saved revenue, users, and offer performance
- 🔧 **Flow Builder** - Visual flow builder to create custom retention strategies
- 🤖 **AI-Powered** - Churn prediction and intelligent offer ranking
- 🔌 **Easy Integration** - Simple widget SDK for quick implementation

## 🏗️ Project Structure

```
retentionos/
├── backend/          # Node.js/Express API with TypeScript
│   ├── src/
│   │   ├── api/     # API route handlers
│   │   ├── services/# Business logic
│   │   ├── db/      # Database configuration
│   │   ├── models/  # Data models
│   │   └── ...
│   └── tests/       # Backend tests
│
├── frontend/
│   ├── dashboard/   # Next.js admin dashboard
│   └── widget/      # Embeddable JavaScript widget SDK
│
├── infra/           # Docker and environment configs
└── docs/            # Documentation
```

## 🚀 Quick Start

### Three Independent Servers

RetentionOS uses **three separate servers** that run independently:

#### 1. Root Server (Port 8000) - Status Page
**Purpose:** Project status page and API proxy  
**Location:** Root directory

```bash
# Install root dependencies
npm install

# Start root server
npm start
# or use the startup script (Git Bash - recommended)
./start.sh
```

**Access:**
- Status page: http://localhost:8000/
- Health check: http://localhost:8000/health

**Note:** This is NOT the backend API - it's just for the status page.

---

#### 2. Backend API Server (Port 3000) - Main Backend
**Purpose:** REST API, database, business logic  
**Location:** `backend/` directory

```bash
cd backend
npm install
npm run dev  # Runs on port 3000
```

**Access:**
- Health check: http://localhost:3000/health
- Database check: http://localhost:3000/health/db
- Status API: http://localhost:3000/status
- Admin API: http://localhost:3000/admin/*

**This is the main backend API** - all API logic runs here.

---

#### 3. Dashboard Server (Port 3001) - Admin UI
**Purpose:** Next.js admin dashboard  
**Location:** `frontend/dashboard/` directory

```bash
cd frontend/dashboard
npm install
npm run dev  # Runs on port 3001
```

**Access:**
- Dashboard: http://localhost:3001/

**This is the admin interface** - login, analytics, flow builder.

---

### Widget Build

```bash
cd frontend/widget
npm install
npm run build
```

### Start All Servers

Run each server in a separate terminal:

```bash
# Terminal 1: Root Server (Status Page)
npm start

# Terminal 2: Backend API
cd backend && npm run dev

# Terminal 3: Dashboard (when ready)
cd frontend/dashboard && npm run dev
```

See [SERVERS.md](SERVERS.md) for detailed server structure documentation.

## Path Manager System (PMS)

PMS is implemented across all components as the single source of truth for paths and URLs:

- **Backend**: `backend/src/utils/pms.ts` - API path management
- **Dashboard**: `frontend/dashboard/src/utils/pms.ts` - Navigation and API paths
- **Widget**: `frontend/widget/src/pms.js` - API endpoint paths

All components use PMS for consistent path management and easy configuration.

### Prerequisites

- Node.js 20+ 
- MariaDB 10.5+ or MySQL 8.0+ (on NAS)
- Redis 7+
- Docker & Docker Compose (optional)
- **Git Bash (Windows)** - Required for Windows, no PowerShell needed! ✅
- Bash (Linux/macOS)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/paxiitdevteam/RetentionOS.git
cd RetentionOS
```

2. **Setup Backend**
```bash
cd backend
npm install
cp ../infra/environment/dev.env .env
npm run dev
```

3. **Setup Dashboard**
```bash
cd frontend/dashboard
npm install
npm run dev
```

4. **Build Widget**
```bash
cd frontend/widget
npm install
npm run build
```

5. **Docker Setup (Recommended)**
```bash
# Quick start with helper script
./docker-start.sh

# Or manually
docker-compose up -d

# View logs
./docker-logs.sh

# Stop services
./docker-stop.sh
```

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for complete Docker documentation.

## 📚 Documentation

- [Architecture Overview](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Data Model](docs/data-model.md)
- [Workflows](docs/workflows.md)
- [Development Plan](docs/development-plan.md)

## 🛠️ Development

### Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- MariaDB/MySQL + Sequelize (multiplatform)
- Redis
- JWT Authentication
- Stripe Integration

**Frontend Dashboard:**
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Recharts

**Widget:**
- Vanilla JavaScript
- Webpack
- CSS Modules

### Development Roadmap

See [docs/development-plan.md](docs/development-plan.md) for the complete phase-by-phase development plan.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: [https://github.com/paxiitdevteam/RetentionOS](https://github.com/paxiitdevteam/RetentionOS)
- **Issues**: [https://github.com/paxiitdevteam/RetentionOS/issues](https://github.com/paxiitdevteam/RetentionOS/issues)

## 👥 Team

Developed by [Paxi iTechnologie](https://paxiit.com)

---

<div align="center">
Made with ❤️ by Paxi iTechnologie
</div>
