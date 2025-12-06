# RetentionOS - Database Setup Guide

## Database: MariaDB/MySQL

RetentionOS uses **MariaDB/MySQL** for multiplatform compatibility. The database runs on your NAS.

---

## Prerequisites

- MariaDB 10.5+ or MySQL 8.0+ installed on NAS
- Database user with CREATE, SELECT, INSERT, UPDATE, DELETE permissions
- Network access to NAS database (if running locally)

---

## Database Configuration

### Connection Details

Update `.env` file in backend directory:

```bash
DB_HOST=192.168.1.3          # NAS IP address
DB_PORT=3306                 # MariaDB/MySQL default port
DB_NAME=retentionos          # Database name
DB_USER=retentionos          # Database user
DB_PASSWORD=your_password    # Database password
```

### Create Database

Connect to MariaDB/MySQL on NAS:

```bash
mysql -h 192.168.1.3 -u root -p
```

Then create database and user:

```sql
CREATE DATABASE retentionos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'retentionos'@'%' IDENTIFIED WITH mysql_native_password BY 'your_password';
GRANT ALL PRIVILEGES ON retentionos.* TO 'retentionos'@'%';
FLUSH PRIVILEGES;
```

**⚠️ IMPORTANT**: Use `mysql_native_password` authentication method. If you see `auth_gssapi_client` errors, see `docs/DATABASE_AUTH_FIX.md` for troubleshooting.

---

## Running Migrations

From the backend directory using Git Bash:

```bash
cd backend
npm install
npm run migrate
```

This will:
- Create all tables
- Add all indexes
- Set up foreign key constraints

---

## Seeding Database

Create initial admin user:

```bash
npm run seed
```

Default admin credentials:
- Email: `admin@retentionos.com`
- Password: `ChangeThisPassword123!`
- Role: `owner`

**⚠️ IMPORTANT**: Change the default password immediately after first login!

---

## Database Schema

### Tables Created

1. **users** - SaaS user data
2. **subscriptions** - Subscription information
3. **flows** - Retention flow definitions
4. **offer_events** - Retention event tracking
5. **churn_reasons** - Cancel reason tracking
6. **admin_accounts** - Admin users with roles
7. **api_keys** - Widget API keys
8. **audit_logs** - Security audit trail

### Character Set

All tables use:
- Character Set: `utf8mb4`
- Collation: `utf8mb4_unicode_ci`

This ensures full Unicode support including emojis and special characters.

---

## Multiplatform Compatibility

### Windows (Git Bash)
```bash
# Use Git Bash, not PowerShell
cd backend
npm run migrate
npm run seed
```

### Linux/macOS
```bash
cd backend
npm run migrate
npm run seed
```

### NAS (SSH)
```bash
ssh -p 2222 superpulpax@192.168.1.3
cd /volume1/web/labs.paxiit.com/RetentionOS/backend
npm run migrate
npm run seed
```

---

## Troubleshooting

### Connection Issues

1. **Check NAS IP**: Verify `192.168.1.3` is correct
2. **Check Port**: MariaDB default is `3306`
3. **Check Firewall**: Ensure port 3306 is open
4. **Check User Permissions**: User needs CREATE, SELECT, INSERT, UPDATE, DELETE

### Migration Errors

1. **Database doesn't exist**: Create it first (see above)
2. **Permission denied**: Grant proper permissions to user
3. **Table already exists**: Drop tables or use `IF NOT EXISTS` (already in migration)

### Character Set Issues

If you see encoding issues:
- Ensure database uses `utf8mb4`
- Check table character sets match
- Verify connection charset is set correctly

---

## Backup and Restore

### Backup Database

```bash
mysqldump -h 192.168.1.3 -u retentionos -p retentionos > backup.sql
```

### Restore Database

```bash
mysql -h 192.168.1.3 -u retentionos -p retentionos < backup.sql
```

---

## Performance Tuning

### Connection Pooling

Sequelize is configured with:
- Max connections: 20
- Min connections: 10
- Idle timeout: 30 seconds

### Indexes

All required indexes are created automatically:
- Foreign keys indexed
- Frequently queried fields indexed
- Composite indexes for common queries

---

*This setup ensures RetentionOS works across Windows (Git Bash), Linux, macOS, and NAS environments.*

