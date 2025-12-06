# RetentionOS - Server Structure

## Server Overview

RetentionOS uses **three separate servers** that run independently:

### 1. Root Server (Port 8000)
**Purpose:** Project status page and API proxy  
**Location:** Root directory (`server.js`)  
**Start:** `npm start` or `./start.sh`  
**Access:** http://localhost:8000/

**What it does:**
- Serves the project status page (`status.html`)
- Provides API proxy to backend
- Health check endpoint

**This is NOT the backend API** - it's just a simple Express server for the status page.

---

### 2. Backend API Server (Port 3000)
**Purpose:** Main backend API (Express/TypeScript)  
**Location:** `backend/` directory  
**Start:** `cd backend && npm run dev`  
**Access:** http://localhost:3000/

**What it does:**
- REST API endpoints (`/admin/*`, `/retention/*`, `/status`)
- Database connections (MariaDB)
- Authentication and authorization
- Business logic services

**This is the main backend** - all API logic runs here.

---

### 3. Dashboard Server (Port 3001)
**Purpose:** Next.js admin dashboard (React/TypeScript)  
**Location:** `frontend/dashboard/` directory  
**Start:** `cd frontend/dashboard && npm run dev`  
**Access:** http://localhost:3001/

**What it does:**
- Admin login interface
- Analytics dashboard
- Flow builder UI
- Settings management

**This is the frontend dashboard** - the admin interface for managing RetentionOS.

---

## Quick Start All Servers

```bash
# Terminal 1: Root Server (Status Page)
npm start

# Terminal 2: Backend API
cd backend && npm run dev

# Terminal 3: Dashboard (when ready)
cd frontend/dashboard && npm run dev
```

## Server URLs Summary

| Server | Port | URL | Purpose |
|--------|------|-----|---------|
| Root Server | 8000 | http://localhost:8000/ | Status page |
| Backend API | 3000 | http://localhost:3000/ | REST API |
| Dashboard | 3001 | http://localhost:3001/ | Admin UI |

## Important Notes

- **Status page** (`status.html`) is at the **root** directory, NOT in backend
- **Backend API** runs on port **3000** (not 8000)
- **Dashboard** runs on port **3001** (Next.js default)
- All three servers can run simultaneously
- Each server has its own `package.json` and dependencies

