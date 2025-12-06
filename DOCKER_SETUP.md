# 🐳 Docker Setup Guide - RetentionOS

Complete Docker Compose configuration for RetentionOS. Perfect for development and can be adapted for other projects.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Services Overview](#services-overview)
- [Configuration](#configuration)
- [Helper Scripts](#helper-scripts)
- [Development Workflow](#development-workflow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Reusing for Other Projects](#reusing-for-other-projects)

## 🚀 Quick Start

### Prerequisites

- ✅ Docker Desktop installed and running
- ✅ Git Bash (Windows) or Bash (Linux/macOS)

### Start Everything

```bash
# Option 1: Use helper script (recommended)
./docker-start.sh

# Option 2: Manual command
docker-compose up -d
```

### Access Services

Once started, services are available at:

- **Backend API**: http://localhost:3000
- **Dashboard**: http://localhost:3001
- **Marketing Site**: http://localhost:3002
- **Database**: localhost:3306
- **Redis**: localhost:6379

### Stop Everything

```bash
# Option 1: Use helper script
./docker-stop.sh

# Option 2: Manual command
docker-compose down
```

## 🏗️ Services Overview

### 1. Backend API (`retentionos-backend`)
- **Port**: 3000
- **Technology**: Node.js + Express + TypeScript
- **Purpose**: REST API, business logic, database operations
- **Health Check**: http://localhost:3000/health

### 2. Dashboard (`retentionos-dashboard`)
- **Port**: 3001
- **Technology**: Next.js + React + TypeScript
- **Purpose**: Admin interface, analytics, flow builder
- **Access**: http://localhost:3001

### 3. Marketing Site (`retentionos-marketing`)
- **Port**: 3002
- **Technology**: Node.js + Express
- **Purpose**: Public marketing website
- **Access**: http://localhost:3002

### 4. Database (`retentionos-db`)
- **Port**: 3306
- **Technology**: MariaDB 10.11
- **Purpose**: Data storage
- **Credentials**: See `.env` file

### 5. Redis (`retentionos-redis`)
- **Port**: 6379
- **Technology**: Redis 7
- **Purpose**: Caching, session storage
- **Access**: localhost:6379

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy from example
cp infra/environment/dev.env.example .env
```

Required variables:

```env
# Database
DB_NAME=retentionos_dev
DB_USER=retentionos
DB_PASSWORD=your_secure_password
DB_ROOT_PASSWORD=your_root_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# API Keys
API_KEY_SECRET=your_api_key_secret

# Stripe (optional for development)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### Docker Compose Files

- **`docker-compose.yml`** - Development (hot reload, volumes)
- **`docker-compose.prod.yml`** - Production (optimized, no volumes)

## 🛠️ Helper Scripts

All scripts are in the root directory:

### `./docker-start.sh`
Starts all services
```bash
./docker-start.sh
```

### `./docker-stop.sh`
Stops all services gracefully
```bash
./docker-stop.sh
```

### `./docker-logs.sh`
View logs from all services
```bash
./docker-logs.sh              # All services
./docker-logs.sh backend       # Backend only
./docker-logs.sh dashboard    # Dashboard only
./docker-logs.sh db           # Database only
```

### `./docker-status.sh`
Shows status of all services
```bash
./docker-status.sh
```

### `./docker-reset.sh`
⚠️ **WARNING**: Completely resets everything (deletes all data!)
```bash
./docker-reset.sh
```

## 💻 Development Workflow

### Starting Development

1. **Start Docker services:**
   ```bash
   ./docker-start.sh
   ```

2. **Wait for services to be healthy** (check Docker Desktop)

3. **Run database migrations:**
   ```bash
   docker-compose exec backend npm run migrate
   ```

4. **Seed database:**
   ```bash
   docker-compose exec backend npm run seed
   ```

5. **Access dashboard:**
   - Open http://localhost:3001
   - Login with: `admin@retentionos.com` / `ChangeThisPassword123!`

### Hot Reload

Development setup includes hot reload:
- **Backend**: Code changes auto-reload
- **Dashboard**: Next.js hot reload enabled
- **Marketing**: Server restarts on changes

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f dashboard
```

### Executing Commands

```bash
# Run command in backend container
docker-compose exec backend npm run migrate

# Access database
docker-compose exec db mysql -u retentionos -p retentionos_dev

# Access Redis CLI
docker-compose exec redis redis-cli
```

## 🚢 Production Deployment

### Using Production Compose

```bash
# Build and start
docker-compose -f docker-compose.prod.yml up -d --build

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Production Differences

- ✅ Optimized builds (multi-stage)
- ✅ No volume mounts (code baked in)
- ✅ Production environment variables
- ✅ Health checks enabled
- ✅ Resource limits (can be added)

## 🔧 Troubleshooting

### Services Won't Start

1. **Check Docker is running:**
   ```bash
   docker info
   ```

2. **Check port conflicts:**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

3. **View error logs:**
   ```bash
   docker-compose logs
   ```

### Database Connection Issues

1. **Check database is healthy:**
   ```bash
   docker-compose ps db
   ```

2. **Test connection:**
   ```bash
   docker-compose exec backend npm run test:db
   ```

3. **Reset database:**
   ```bash
   docker-compose down -v
   docker-compose up -d db
   ```

### Container Keeps Restarting

1. **Check logs:**
   ```bash
   docker-compose logs [service-name]
   ```

2. **Check health status:**
   ```bash
   docker-compose ps
   ```

3. **Restart specific service:**
   ```bash
   docker-compose restart [service-name]
   ```

### Out of Disk Space

```bash
# Clean up unused resources
docker system prune -a --volumes

# Remove specific volumes
docker volume rm retentionos_db_data
```

## 🔄 Reusing for Other Projects

### Template Structure

The Docker setup can be adapted for any project:

1. **Copy docker-compose.yml** to your project
2. **Update service names** (replace `retentionos-*` with your project name)
3. **Update ports** if needed
4. **Adjust Dockerfiles** for your stack
5. **Update environment variables**

### Example: New Project Setup

```yaml
# Change container names
container_name: myproject-backend  # was: retentionos-backend

# Change network name
networks:
  myproject-network:  # was: retentionos-network

# Change volume names
volumes:
  myproject_db_data:  # was: retentionos_db_data
```

### Common Adaptations

- **Different database**: Change `mariadb:10.11` to `postgres:15` or `mongodb:7`
- **Different ports**: Update port mappings
- **Add services**: Copy service block and modify
- **Remove services**: Delete unused service blocks

## 📊 Monitoring

### Docker Desktop

- View all containers
- Monitor resource usage
- View logs visually
- Start/stop services

### Command Line

```bash
# Resource usage
docker stats

# Container status
docker-compose ps

# Service health
docker-compose ps --format json | jq '.[] | {name: .Name, status: .State}'
```

## 🔐 Security Notes

- ✅ Never commit `.env` files
- ✅ Use strong passwords in production
- ✅ Keep Docker images updated
- ✅ Use non-root users in containers
- ✅ Limit exposed ports

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [MariaDB Docker Hub](https://hub.docker.com/_/mariadb)
- [Redis Docker Hub](https://hub.docker.com/_/redis)

---

**Need Help?** Check `TROUBLESHOOTING.md` or open an issue on GitHub.

