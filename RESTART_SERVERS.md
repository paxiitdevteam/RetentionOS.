# How to Restart Servers

## Issue: Ports 3000 and 3001 Not Loading

The servers are running but may have startup errors. Follow these steps:

## Step 1: Stop All Servers

**Windows (Git Bash):**
```bash
# Find processes on ports 3000 and 3001
netstat -ano | grep -E ":(3000|3001)"

# Kill processes (replace PID with actual process ID from netstat)
taskkill /PID <PID> /F
```

Or simply close the terminal windows where servers are running (Ctrl+C).

## Step 2: Restart Backend (Port 3000)

```bash
cd backend

# Ensure .env exists
cp ../infra/environment/dev.env .env

# Install dependencies (if needed)
npm install

# Start server
npm run dev
```

**Expected output:**
```
✅ Database connection established successfully.
🚀 RetentionOS Backend running on port 3000
```

**If database connection fails:**
- Server will still start but show a warning
- You can test endpoints that don't require database
- Fix database connection and restart

## Step 3: Restart Dashboard (Port 3001)

```bash
cd frontend/dashboard

# Install dependencies (if needed)
npm install

# Start server
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3001
- Local: http://localhost:3001
```

## Step 4: Verify Servers

Open in browser:
- http://localhost:3000/health - Should return JSON
- http://localhost:3001 - Should show dashboard page

## Quick Restart Script

Save this as `restart-all.sh`:

```bash
#!/bin/bash
echo "🛑 Stopping all servers..."
# Add kill commands here if needed

echo "🚀 Starting Backend..."
cd backend && npm run dev &
sleep 3

echo "🌐 Starting Dashboard..."
cd ../frontend/dashboard && npm run dev &
sleep 3

echo "✅ Servers starting..."
echo "Backend: http://localhost:3000"
echo "Dashboard: http://localhost:3001"
```

