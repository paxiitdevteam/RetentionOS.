# Server Setup - All Servers at Root

All servers are now at the root directory for easy access and management.

## 📁 New Structure

```
RetentionOS/
├── src-backend/          # Backend source code
├── dashboard/            # Dashboard frontend
├── package.json          # Root package.json with all scripts
├── package-backend.json  # Backend dependencies
├── tsconfig-backend.json # Backend TypeScript config
├── Dockerfile-backend    # Backend Dockerfile
├── start-backend.sh      # Quick start backend
└── start-dashboard.sh    # Quick start dashboard
```

## 🚀 Starting Servers

### Option 1: Using npm scripts (Recommended)

**Backend:**
```bash
npm run backend:dev
```

**Dashboard:**
```bash
npm run dashboard:dev
```

### Option 2: Using start scripts

**Backend:**
```bash
./start-backend.sh
```

**Dashboard:**
```bash
./start-dashboard.sh
```

### Option 3: Direct commands

**Backend:**
```bash
ts-node-dev --respawn --transpile-only src-backend/server.ts
```

**Dashboard:**
```bash
cd dashboard && npm run dev
```

## 📦 Installing Dependencies

**Backend dependencies (at root):**
```bash
npm install
```

**Dashboard dependencies:**
```bash
cd dashboard && npm install
```

## 🐳 Docker

Docker Compose is already configured to use root paths:
```bash
docker-compose up
```

## ✅ Benefits

- ✅ No need to `cd` into subdirectories
- ✅ All servers accessible from root
- ✅ Easier to start and manage
- ✅ Consistent with user preference
- ✅ Simple commands: `npm run backend:dev` or `npm run dashboard:dev`

## 📝 Notes

- Backend source is in `src-backend/`
- Dashboard source is in `dashboard/`
- All scripts work from root directory
- Docker paths updated automatically

