# 🚀 Quick Setup - Docker MySQL (Recommended)

## Why Docker MySQL?

✅ **Fastest solution** - Works in 2 minutes  
✅ **No configuration needed** - Uses mysql_native_password by default  
✅ **No root password issues** - Everything pre-configured  
✅ **Isolated** - Won't affect your existing MySQL  

---

## Step 1: Install Docker (if not installed)

Download and install Docker Desktop for Windows:
https://www.docker.com/products/docker-desktop

**After installation:**
- Start Docker Desktop
- Wait for it to fully start (whale icon in system tray)

---

## Step 2: Run Setup Script

In Git Bash:

```bash
cd RetentionOS
bash setup-docker-mysql.sh
```

**Or manually:**

```bash
# Stop existing MySQL (if running)
net stop MySQL80

# Start Docker MySQL
docker run --name retentionos-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=retentionos_dev \
  -e MYSQL_USER=retentionos \
  -e MYSQL_PASSWORD=password \
  -p 3306:3306 \
  -d mysql:8.0
```

---

## Step 3: Test Connection

```bash
cd backend
npm run test:db
```

**Should show:**
```
✅ Connected to MySQL server!
✅ Database 'retentionos_dev' exists.
✅ User 'retentionos' exists: Using mysql_native_password (correct)
```

---

## Step 4: Setup Database

```bash
npm run migrate
npm run seed
```

---

## Step 5: Login

Go to: http://localhost:3001/login

- **Email**: `admin@retentionos.com`
- **Password**: `ChangeThisPassword123!`

---

## Docker Commands (Useful)

```bash
# Start container
docker start retentionos-mysql

# Stop container
docker stop retentionos-mysql

# View logs
docker logs retentionos-mysql

# Remove container (if needed)
docker stop retentionos-mysql
docker rm retentionos-mysql
```

---

## That's It! 🎉

Docker MySQL uses `mysql_native_password` by default, so everything works immediately!

**No need to fix root authentication - Docker handles it all!**

