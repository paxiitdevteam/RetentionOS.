#!/bin/bash
# Automated MariaDB Authentication Fix
# IMPORTANT: Run Git Bash as Administrator first!
# Right-click Git Bash → Run as administrator
# Then run: bash backend/fix-database.sh

set -e  # Exit on error

echo "=========================================="
echo "Automated MariaDB Authentication Fix"
echo "=========================================="
echo ""

# Configuration
# ⚠️ SECURITY: Use environment variables or prompt for passwords
# Never hardcode passwords in scripts!
MYSQL_PATH="/c/Program Files/MariaDB 11.8/bin/mysql.exe"
MYSQLD_PATH="/c/Program Files/MariaDB 11.8/bin/mysqld.exe"
DB_NAME="${DB_NAME:-retentionos_dev}"
DB_USER="${DB_USER:-retentionos}"
DB_PASSWORD="${DB_PASSWORD:-}"
ROOT_PASSWORD="${DB_ROOT_PASSWORD:-}"

# Prompt for passwords if not set
if [ -z "$DB_PASSWORD" ]; then
    echo "⚠️  DB_PASSWORD not set. Using default 'password' for development only."
    echo "   Set DB_PASSWORD environment variable for production!"
    DB_PASSWORD="password"
fi

if [ -z "$ROOT_PASSWORD" ]; then
    echo "⚠️  DB_ROOT_PASSWORD not set. Using default 'rootpassword' for development only."
    echo "   Set DB_ROOT_PASSWORD environment variable for production!"
    ROOT_PASSWORD="rootpassword"
fi

# Check if MariaDB exists
if [ ! -f "$MYSQL_PATH" ]; then
    echo "❌ MariaDB not found at expected location"
    echo "   Expected: $MYSQL_PATH"
    exit 1
fi

echo "✅ Found MariaDB at: $MYSQL_PATH"
echo ""

# Step 1: Stop MariaDB service
echo "Step 1: Stopping MariaDB service..."
net stop MariaDB 2>/dev/null || net stop MySQL80 2>/dev/null || net stop MySQL 2>/dev/null || echo "   ⚠️  Service might not be running"
sleep 2

# Step 2: Start MariaDB in safe mode
echo ""
echo "Step 2: Starting MariaDB in safe mode..."
echo "   This will run in the background..."

# Find data directory
DATA_DIR="C:/ProgramData/MariaDB 11.8/Data"
if [ ! -d "$DATA_DIR" ]; then
    DATA_DIR="C:/ProgramData/MySQL/MySQL Server 8.0/Data"
fi
if [ ! -d "$DATA_DIR" ]; then
    DATA_DIR=""
fi

# Start mysqld in safe mode (background) - use socket for connection
SOCKET_FILE="/tmp/mysql_safe_$$.sock"
if [ -n "$DATA_DIR" ]; then
    "$MYSQLD_PATH" --skip-grant-tables --skip-networking --socket="$SOCKET_FILE" --datadir="$DATA_DIR" 2>/dev/null &
else
    "$MYSQLD_PATH" --skip-grant-tables --skip-networking --socket="$SOCKET_FILE" 2>/dev/null &
fi
SAFE_MODE_PID=$!

# Wait longer for it to start
echo "   Waiting for MariaDB to start (15 seconds)..."
sleep 15

# Check if process is still running
if ! kill -0 $SAFE_MODE_PID 2>/dev/null; then
    echo "   ⚠️  Safe mode process didn't start, trying without socket..."
    # Try starting without socket (will use default)
    if [ -n "$DATA_DIR" ]; then
        "$MYSQLD_PATH" --skip-grant-tables --skip-networking --datadir="$DATA_DIR" 2>/dev/null &
    else
        "$MYSQLD_PATH" --skip-grant-tables --skip-networking 2>/dev/null &
    fi
    SAFE_MODE_PID=$!
    sleep 10
    SOCKET_FILE=""  # Don't use socket
fi

# Step 3: Fix authentication
echo ""
echo "Step 3: Fixing authentication..."

# Create SQL file
SQL_FILE="/tmp/fix_mysql_$$.sql"
cat > "$SQL_FILE" << EOF
USE mysql;
UPDATE user SET plugin='mysql_native_password' WHERE User='root';
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${ROOT_PASSWORD}';
ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '${ROOT_PASSWORD}';
FLUSH PRIVILEGES;
DROP USER IF EXISTS '${DB_USER}'@'%';
DROP USER IF EXISTS '${DB_USER}'@'localhost';
CREATE USER '${DB_USER}'@'%' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

# Execute SQL - try multiple times with different connection methods
echo "   Attempting to connect to safe mode..."
MAX_RETRIES=5
RETRY_COUNT=0
SUCCESS=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # Try with socket if available
    if [ -n "$SOCKET_FILE" ] && [ -S "$SOCKET_FILE" ]; then
        if "$MYSQL_PATH" -u root --socket="$SOCKET_FILE" < "$SQL_FILE" 2>/dev/null; then
            echo "   ✅ Authentication fixed!"
            SUCCESS=1
            break
        fi
    fi
    
    # Try without socket (TCP localhost)
    if "$MYSQL_PATH" -u root -h 127.0.0.1 < "$SQL_FILE" 2>/dev/null; then
        echo "   ✅ Authentication fixed!"
        SUCCESS=1
        break
    fi
    
    # Try localhost
    if "$MYSQL_PATH" -u root -h localhost < "$SQL_FILE" 2>/dev/null; then
        echo "   ✅ Authentication fixed!"
        SUCCESS=1
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "   Retry $RETRY_COUNT/$MAX_RETRIES - waiting 5 seconds..."
        sleep 5
    fi
done

rm -f "$SQL_FILE"

if [ $SUCCESS -eq 0 ]; then
    echo "   ❌ Failed to fix authentication after $MAX_RETRIES attempts"
    echo "   Stopping safe mode process..."
    kill $SAFE_MODE_PID 2>/dev/null || true
    sleep 2
    echo "   Restarting MariaDB service normally..."
    net start MariaDB 2>/dev/null || net start MySQL80 2>/dev/null || net start MySQL 2>/dev/null || true
    exit 1
fi

# Step 4: Stop safe mode
echo ""
echo "Step 4: Stopping safe mode..."
# Kill all mysqld processes
taskkill //F //IM mysqld.exe 2>/dev/null || killall mysqld 2>/dev/null || kill $SAFE_MODE_PID 2>/dev/null || true
sleep 3

# Step 5: Start MariaDB service normally
echo ""
echo "Step 5: Starting MariaDB service normally..."
if net start MariaDB 2>/dev/null; then
    echo "   ✅ MariaDB service started"
    sleep 5
elif net start MySQL80 2>/dev/null; then
    echo "   ✅ MySQL80 service started"
    sleep 5
elif net start MySQL 2>/dev/null; then
    echo "   ✅ MySQL service started"
    sleep 5
else
    echo "   ⚠️  Could not start service automatically"
    echo "   Please start it manually: net start MariaDB"
    echo "   Or restart your computer"
fi

echo ""
echo "=========================================="
echo "✅ FIX COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. cd backend"
echo "  2. npm run test:db"
echo "  3. npm run seed"
echo "  4. Test login at http://localhost:3001/login"
echo ""

