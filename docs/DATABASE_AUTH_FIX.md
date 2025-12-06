# Database Authentication Fix

## Problem

If you see this error when trying to seed the database or log in:

```
Server requests authentication using unknown plugin auth_gssapi_client
```

or

```
SSPI server error 0x80090308 - AcceptSecurityContext - SEC_E_INVALID_TOKEN
```

This means your MariaDB/MySQL server is configured to use **Windows authentication (SSPI/GSSAPI)** instead of MySQL native password authentication. The `mysql2` Node.js driver doesn't support Windows authentication.

## Solution

You need to change your database user's authentication method to `mysql_native_password`.

### Option 1: Change User Authentication Method (Recommended)

Connect to your MariaDB/MySQL server as root and run:

```sql
-- Check current authentication method
SELECT user, host, plugin FROM mysql.user WHERE user = 'retentionos';

-- Change to mysql_native_password
ALTER USER 'retentionos'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';

-- Or if using a different host
ALTER USER 'retentionos'@'%' IDENTIFIED WITH mysql_native_password BY 'your_password';

-- Flush privileges
FLUSH PRIVILEGES;
```

### Option 2: Create New User with mysql_native_password

If you can't modify the existing user, create a new one:

```sql
CREATE USER 'retentionos'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
GRANT ALL PRIVILEGES ON retentionos.* TO 'retentionos'@'localhost';
FLUSH PRIVILEGES;
```

### Option 3: Use Docker MariaDB (Development)

If you're using Docker, the MariaDB image uses `mysql_native_password` by default. Make sure your `docker-compose.yml` is configured correctly.

## Verify Fix

After changing the authentication method, test the connection:

```bash
cd backend
npm run seed
```

You should see:
```
✅ Created default admin user:
   Email: admin@retentionos.com
   Password: ChangeThisPassword123!
```

## Login Credentials

After seeding, use these credentials to log in to the dashboard:

- **Email**: `admin@retentionos.com`
- **Password**: `ChangeThisPassword123!`

⚠️ **IMPORTANT**: Change the default password immediately after first login!

