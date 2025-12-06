# Quick Docker Guide for RetentionOS

## What You're Looking At

In Docker Desktop, you see:
- **retentionos-mys** = MySQL database (already running! ✅)

## What Will Happen When We Deploy

After deployment, you'll see **5 containers**:

1. **retentionos-backend** - The API server
2. **retentionos-dashboard** - The web interface  
3. **retentionos-db** - MySQL database (like your current one)
4. **retentionos-redis** - Cache system
5. **retentionos-nginx** - Web server/router

## How to Use Docker Desktop

### Start Everything
```bash
docker-compose -f docker-compose.prod.yml up -d
```
All 5 containers will appear in Docker Desktop!

### Stop Everything
```bash
docker-compose -f docker-compose.prod.yml down
```
All containers disappear (data is saved)

### View Logs
1. Click on a container name in Docker Desktop
2. See "Logs" tab
3. Watch what's happening in real-time

### Restart a Service
1. Click on container
2. Click restart button (circular arrow)

## What Each Container Does

- **Backend**: Handles API requests (like login, analytics)
- **Dashboard**: The web interface you see in browser
- **Database**: Stores all data (users, flows, analytics)
- **Redis**: Speeds things up (caching)
- **Nginx**: Routes traffic (sends requests to right place)

## Your Current Setup

You already have MySQL running! That's perfect. When we deploy:
- We'll use the same database setup
- Add the other 4 containers
- Connect them all together

## Simple Workflow

1. **Start**: Run `docker-compose up -d`
2. **Check**: Open Docker Desktop, see all 5 containers running
3. **Use**: Open browser, go to http://localhost:3001 (dashboard)
4. **Stop**: Run `docker-compose down` when done

## That's It!

Docker Desktop is just a **visual way to see and control** what's running.
The real magic happens when we run the `docker-compose` command!

