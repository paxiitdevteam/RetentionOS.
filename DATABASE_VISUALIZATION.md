# 🗄️ Database Visualization Guide

## Overview

RetentionOS includes **phpMyAdmin** - a web-based database management tool that lets you visualize and manage your database through a browser.

## 🚀 Quick Start

### Access phpMyAdmin

Once Docker services are running:

1. **Start Docker services:**
   ```bash
   ./docker-start.sh
   ```

2. **Open phpMyAdmin in browser:**
   ```
   http://localhost:8080
   ```

3. **Login credentials:**
   - **Server**: `db` (or leave default)
   - **Username**: `retentionos` (from your .env file)
   - **Password**: Your `DB_PASSWORD` from .env file

### Alternative: Root Access

For full database access:

- **Username**: `root`
- **Password**: Your `DB_ROOT_PASSWORD` from .env file

## 📊 What You Can Do

### View Database Structure
- ✅ See all tables
- ✅ View table schemas
- ✅ Check indexes and relationships
- ✅ View foreign keys

### Browse Data
- ✅ View all records in tables
- ✅ Search and filter data
- ✅ Sort by columns
- ✅ Export data (CSV, SQL, JSON)

### Manage Data
- ✅ Insert new records
- ✅ Edit existing records
- ✅ Delete records
- ✅ Run SQL queries

### Database Operations
- ✅ Create new databases
- ✅ Create/modify tables
- ✅ Run migrations manually
- ✅ Import/export database

## 🎯 Common Tasks

### View All Tables

1. Open http://localhost:8080
2. Click on `retentionos_dev` database (left sidebar)
3. See all tables listed

### View Table Data

1. Click on a table name (e.g., `users`)
2. Click "Browse" tab
3. See all records

### Run SQL Query

1. Click "SQL" tab
2. Type your query:
   ```sql
   SELECT * FROM users LIMIT 10;
   ```
3. Click "Go"

### Export Data

1. Select a table
2. Click "Export" tab
3. Choose format (CSV, SQL, JSON, etc.)
4. Click "Go"

## 🔍 Exploring RetentionOS Database

### Key Tables to Explore

- **`users`** - SaaS user data
- **`subscriptions`** - Subscription information
- **`flows`** - Retention flow definitions
- **`offer_events`** - User offer interactions
- **`admin_accounts`** - Admin users
- **`api_keys`** - API authentication keys
- **`audit_logs`** - System audit trail

### Useful Queries

**Count all users:**
```sql
SELECT COUNT(*) as total_users FROM users;
```

**View recent offer events:**
```sql
SELECT * FROM offer_events 
ORDER BY created_at DESC 
LIMIT 20;
```

**Check admin accounts:**
```sql
SELECT email, role, created_at FROM admin_accounts;
```

**View active flows:**
```sql
SELECT id, name, is_active, created_at FROM flows;
```

## 🔐 Security Notes

### Development
- ✅ phpMyAdmin is available on port 8080
- ✅ Only accessible on localhost
- ✅ Uses database credentials from .env

### Production
- ⚠️ **Remove phpMyAdmin** from production for security
- ⚠️ Or restrict access with authentication
- ⚠️ Never expose phpMyAdmin to public internet

## 🛠️ Alternative Tools

If you prefer other tools:

### Desktop Applications
- **MySQL Workbench** - Official MySQL GUI
- **DBeaver** - Universal database tool
- **TablePlus** - Modern database GUI
- **HeidiSQL** - Lightweight MySQL client

### Connection Details
- **Host**: `localhost`
- **Port**: `3306`
- **Database**: `retentionos_dev` (or from .env)
- **Username**: `retentionos` (or from .env)
- **Password**: From your `.env` file

## 📝 Quick Reference

| Action | URL | Credentials |
|--------|-----|-------------|
| phpMyAdmin | http://localhost:8080 | retentionos / [DB_PASSWORD] |
| Root Access | http://localhost:8080 | root / [DB_ROOT_PASSWORD] |

## 🐛 Troubleshooting

### phpMyAdmin Won't Load

1. **Check if service is running:**
   ```bash
   docker-compose ps phpmyadmin
   ```

2. **Check logs:**
   ```bash
   docker-compose logs phpmyadmin
   ```

3. **Restart service:**
   ```bash
   docker-compose restart phpmyadmin
   ```

### Can't Connect to Database

1. **Verify database is running:**
   ```bash
   docker-compose ps db
   ```

2. **Check database credentials in .env:**
   ```bash
   cat .env | grep DB_
   ```

3. **Test connection:**
   ```bash
   docker-compose exec db mysql -u retentionos -p retentionos_dev
   ```

### Access Denied

- Verify username/password match `.env` file
- Check database user has proper permissions
- Try root user if retentionos user doesn't work

## 💡 Tips

1. **Bookmark phpMyAdmin** - http://localhost:8080
2. **Use SQL tab** for complex queries
3. **Export before changes** - Always export data before major changes
4. **Use search** - phpMyAdmin has powerful search features
5. **Check structure** - Use "Structure" tab to understand table relationships

---

**Happy Database Exploring! 🎉**

