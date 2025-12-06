# 🚀 START HERE - Automatic Setup

## The Easy Way (Recommended)

Just run this **ONE command**:

```bash
bash setup.sh
```

That's it! The script will:
- ✅ Set up Docker MySQL (clean, isolated, no conflicts)
- ✅ Install all dependencies
- ✅ Run database migrations
- ✅ Seed initial data
- ✅ Everything ready to go!

**No manual database fixes needed!**

## Why Docker?

- **No conflicts** with your existing MariaDB
- **Automatic setup** - no manual configuration
- **Isolated** - doesn't affect your system
- **Same as production** - consistent environment

## After Setup

Start the servers:

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Dashboard  
cd frontend/dashboard && npm run dev

# Terminal 3: Root server
node server.js
```

Then login at: http://localhost:3001/login
- Email: `admin@retentionos.com`
- Password: `ChangeThisPassword123!`

## Don't Have Docker?

1. Install Docker Desktop: https://www.docker.com/products/docker-desktop
2. Run `bash setup.sh`

That's it! No more manual database fixes. 🎉
