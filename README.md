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

### Prerequisites

- Node.js 20+ 
- MariaDB 10.5+ or MySQL 8.0+ (on NAS)
- Redis 7+
- Docker & Docker Compose (optional)
- Git Bash (Windows) or Bash (Linux/macOS)

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

5. **Docker Setup (Alternative)**
```bash
cd infra
docker-compose up
```

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
