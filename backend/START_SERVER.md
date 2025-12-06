# Backend Server Startup Guide

## Quick Start

1. **Create .env file** (if not exists):
```bash
cd backend
cp ../infra/environment/dev.env .env
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start server**:
```bash
npm run dev
```

## Expected Output

When the server starts successfully, you should see:
```
✅ Database connection established successfully.
🚀 RetentionOS Backend running on port 3000
📊 Health check: http://localhost:3000/health
💾 Database check: http://localhost:3000/health/db
🔐 Admin login: http://localhost:3000/admin/login
👤 Admin info: http://localhost:3000/admin/me
```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify .env file exists in backend directory
- Check database connection settings in .env

### Database connection fails
- Ensure MariaDB/MySQL is running
- Verify database credentials in .env
- Check if database `retentionos_dev` exists

### Port already in use
- Stop other services on port 3000
- Or change PORT in .env file

## Environment Variables

Required variables (see `infra/environment/dev.env`):
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 3306)
- `DB_NAME` - Database name (default: retentionos_dev)
- `DB_USER` - Database user (default: retentionos)
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret key
- `PORT` - Backend server port (default: 3000)

