# RetentionOS - Troubleshooting Guide

## Servers Not Loading

### Backend API (Port 3000) Not Loading

**Symptoms:**
- `ERR_CONNECTION_REFUSED` when accessing http://localhost:3000
- Server starts but immediately crashes

**Solutions:**

1. **Check if .env file exists:**
```bash
cd backend
ls -la .env
```

If missing, create it:
```bash
cp ../infra/environment/dev.env .env
```

2. **Check database connection:**
```bash
# Verify MariaDB/MySQL is running
# Check database credentials in .env match your database
```

3. **Check for port conflicts:**
```bash
# Windows (Git Bash)
netstat -ano | grep :3000

# If port is in use, stop the process or change PORT in .env
```

4. **Restart backend:**
```bash
cd backend
npm run dev
```

**Expected output:**
```
✅ Database connection established successfully.
🚀 RetentionOS Backend running on port 3000
```

---

### Dashboard (Port 3001) Not Loading

**Symptoms:**
- `ERR_CONNECTION_REFUSED` when accessing http://localhost:3001
- Shows 404 page instead of dashboard

**Solutions:**

1. **Check if dependencies are installed:**
```bash
cd frontend/dashboard
npm install
```

2. **Check for compilation errors:**
```bash
npm run dev
# Look for TypeScript or build errors in console
```

3. **Verify page files exist:**
```bash
ls -la src/pages/
# Should show: _app.tsx, index.tsx
```

4. **Clear Next.js cache:**
```bash
rm -rf .next
npm run dev
```

5. **Check for port conflicts:**
```bash
netstat -ano | grep :3001
```

**Expected output:**
```
- ready started server on 0.0.0.0:3001
- Local: http://localhost:3001
```

---

## Common Issues

### Database Connection Failed

**Error:** `❌ Unable to connect to the database`

**Solutions:**
1. Ensure MariaDB/MySQL is running
2. Verify database exists: `CREATE DATABASE retentionos_dev;`
3. Check credentials in `backend/.env`
4. Test connection manually:
```bash
mysql -u retentionos -p -h localhost retentionos_dev
```

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solutions:**
1. Find process using port:
```bash
# Windows
netstat -ano | findstr :3000
# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

2. Or change port in `.env`:
```
PORT=3002
```

### CORS Errors

**Error:** `Access-Control-Allow-Origin header` errors

**Solution:**
- Backend CORS is configured to allow localhost:8000 and localhost:3001
- If errors persist, restart backend server to load new CORS config

---

## Quick Health Checks

### Backend Health
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","server":"backend-api",...}
```

### Dashboard Health
```bash
curl http://localhost:3001
# Should return HTML with "RetentionOS Dashboard"
```

### Database Health
```bash
curl http://localhost:3000/health/db
# Should return: {"status":"ok","database":"connected",...}
```

---

## Server Status

Check which servers are running:
```bash
# Windows (Git Bash)
netstat -ano | grep -E ":(3000|3001|8000)"
```

Expected:
- Port 8000: Root server (status page)
- Port 3000: Backend API
- Port 3001: Dashboard

---

## Restart All Servers

If everything fails, restart all servers:

```bash
# Terminal 1: Root Server
cd /c/Users/PC-PAXIIT/Desktop/RetentionOS
npm start

# Terminal 2: Backend API
cd /c/Users/PC-PAXIIT/Desktop/RetentionOS/backend
npm run dev

# Terminal 3: Dashboard
cd /c/Users/PC-PAXIIT/Desktop/RetentionOS/frontend/dashboard
npm run dev
```

