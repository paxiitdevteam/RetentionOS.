# Git Bash Compatibility - No PowerShell Required

## ✅ All Scripts Use Git Bash

All scripts in this project are **100% Git Bash compatible** and **do NOT require PowerShell**.

### Scripts Overview

All scripts use `#!/bin/bash` shebang and work with Git Bash:

- ✅ `start.sh` - Root server startup
- ✅ `docker-start.sh` - Docker services startup
- ✅ `docker-stop.sh` - Docker services stop
- ✅ `docker-logs.sh` - View Docker logs
- ✅ `docker-status.sh` - Check Docker status
- ✅ `docker-reset.sh` - Reset Docker environment
- ✅ `backend/fix-database.sh` - Database fix script
- ✅ `setup.sh` - Project setup
- ✅ `setup-database.sh` - Database setup
- ✅ `setup-docker-mysql.sh` - Docker MySQL setup
- ✅ `check-servers.sh` - Server status check
- ✅ `infra/scripts/*.sh` - All infrastructure scripts

### No PowerShell Files

- ❌ No `.ps1` files (PowerShell scripts)
- ❌ No `.bat` files (Windows batch files)
- ❌ No `.cmd` files (Windows command files)
- ✅ Only `.sh` files (Bash scripts)

## How to Use

### Opening Git Bash

1. **Right-click** in the RetentionOS folder
2. Select **"Git Bash Here"**
3. All scripts will work immediately

### Running Scripts

```bash
# Make scripts executable (first time only)
chmod +x *.sh

# Run any script
./docker-start.sh
./start.sh
./docker-stop.sh
```

### Windows-Specific Commands

Some scripts use Windows commands that work in Git Bash:

- `net stop` / `net start` - Service management (works in Git Bash)
- `taskkill` - Process management (works in Git Bash)
- `sc query` - Service query (works in Git Bash)

These are **NOT PowerShell commands** - they're Windows system commands that Git Bash can execute.

## Docker Desktop Integration

The `docker-start.sh` script tries to open Docker Desktop:

```bash
# This works in Git Bash
"C:\Program Files\Docker\Docker\Docker Desktop.exe" &
```

This is a **direct executable call**, not PowerShell.

## Verification

To verify everything works with Git Bash:

```bash
# Check script syntax
bash -n docker-start.sh
bash -n start.sh
bash -n backend/fix-database.sh

# All should return no errors
```

## Why Git Bash?

- ✅ **Cross-platform** - Works on Windows, Linux, macOS
- ✅ **Familiar** - Standard bash commands
- ✅ **No PowerShell needed** - Pure bash scripts
- ✅ **Easy to use** - Right-click → Git Bash Here

## Troubleshooting

### Script Won't Run

```bash
# Make sure it's executable
chmod +x script-name.sh

# Run with bash explicitly
bash script-name.sh
```

### Permission Denied

```bash
# Check file permissions
ls -la script-name.sh

# Make executable
chmod +x script-name.sh
```

### Line Ending Issues

If you see `\r` errors, fix line endings:

```bash
# Convert Windows line endings to Unix
dos2unix script-name.sh

# Or use sed
sed -i 's/\r$//' script-name.sh
```

## Summary

✅ **All scripts are Git Bash compatible**  
✅ **No PowerShell required**  
✅ **No .ps1, .bat, or .cmd files**  
✅ **Pure bash scripts only**  
✅ **Works on Windows with Git Bash**

---

**You can use all scripts without ever opening PowerShell!**

