# RetentionOS Deployment Guide

This guide covers deploying RetentionOS to production.

## Prerequisites

- Docker and Docker Compose installed
- Domain name configured (for SSL)
- Environment variables configured
- Database backups configured

## Quick Start

### 1. Environment Setup

```bash
# Copy example environment file
cp infra/environment/.env.example infra/environment/.env.production

# Edit and fill in your values
nano infra/environment/.env.production
```

### 2. Validate Environment

```bash
# Validate all required variables are set
node infra/scripts/validate-env.js
```

### 3. Deploy

```bash
# Deploy to production
./infra/scripts/deploy.sh production
```

## Manual Deployment

### Step 1: Build Images

```bash
docker-compose -f docker-compose.prod.yml build
```

### Step 2: Run Migrations

```bash
docker-compose -f docker-compose.prod.yml run --rm backend npm run migrate
```

### Step 3: Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Verify Health

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Database Management

### Backup Database

```bash
./infra/scripts/backup-db.sh
```

### Restore Database

```bash
./infra/scripts/restore-db.sh backups/retentionos_backup_YYYYMMDD_HHMMSS.sql.gz
```

### Run Migrations

```bash
./infra/scripts/migrate.sh up
```

## SSL Configuration

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `infra/nginx/ssl/`:
   - `cert.pem` - Certificate file
   - `key.pem` - Private key file

## Monitoring

### Health Checks

All services include health checks:
- Backend: `http://localhost:3000/status`
- Dashboard: `http://localhost:3001/`
- Nginx: `http://localhost/health`

### Logs

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Troubleshooting

### Services won't start

1. Check Docker is running: `docker info`
2. Check ports are available: `netstat -tulpn | grep -E '3000|3001|80|443'`
3. Check environment variables: `node infra/scripts/validate-env.js`

### Database connection issues

1. Verify database is healthy: `docker-compose ps db`
2. Check database logs: `docker-compose logs db`
3. Test connection: `docker-compose exec db mysql -u retentionos -p`

### Nginx issues

1. Test configuration: `docker-compose exec nginx nginx -t`
2. Check logs: `docker-compose logs nginx`
3. Reload config: `docker-compose exec nginx nginx -s reload`

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups configured
- [ ] Health checks passing
- [ ] Monitoring setup
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Widget bundle optimized (< 10KB)

## Support

For issues, check:
- Service logs: `docker-compose logs`
- Health endpoints: `/status`, `/health`
- Database status: `docker-compose ps`

