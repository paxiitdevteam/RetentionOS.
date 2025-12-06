# Security Guidelines

## 🔒 Protecting Sensitive Data

This document outlines security best practices for the RetentionOS project.

## Environment Variables

### ⚠️ NEVER Commit These Files:
- `.env` files (any environment)
- `infra/environment/*.env` files
- Any file containing passwords, API keys, or secrets

### ✅ Use Template Files Instead:
- `infra/environment/dev.env.example` - Development template
- `infra/environment/prod.env.example` - Production template

### Setting Up Environment Variables

1. **Copy the example file:**
   ```bash
   cp infra/environment/dev.env.example infra/environment/dev.env
   ```

2. **Fill in your actual values:**
   - Replace `YOUR_PASSWORD` with strong passwords
   - Replace `YOUR_JWT_SECRET` with a generated secret (use `openssl rand -base64 32`)
   - Replace `YOUR_STRIPE_SECRET_KEY` with your actual Stripe keys

3. **Verify .env is ignored:**
   ```bash
   git check-ignore infra/environment/dev.env
   # Should output: infra/environment/dev.env
   ```

## Password Requirements

### Development:
- Minimum 8 characters (for local testing)
- Use strong passwords even in development

### Production:
- **Database Password**: Minimum 12 characters, mix of letters, numbers, symbols
- **JWT Secret**: Minimum 32 characters, use `openssl rand -base64 64`
- **API Key Secret**: Minimum 32 characters, use `openssl rand -base64 64`

## Generating Secure Secrets

```bash
# Generate JWT Secret (64 bytes)
openssl rand -base64 64

# Generate API Key Secret (64 bytes)
openssl rand -base64 64

# Generate Database Password (32 bytes)
openssl rand -base64 32
```

## Files That Should Never Be Committed

- ✅ `.env` files
- ✅ `*.key`, `*.pem`, `*.cert` files
- ✅ Files with hardcoded passwords
- ✅ Database dumps with real data
- ✅ Log files with sensitive information

## Checking for Sensitive Data

Before committing, check for:
```bash
# Check for hardcoded passwords
grep -r "password.*=" --include="*.js" --include="*.ts" --include="*.sh" .

# Check for API keys
grep -r "api.*key.*=" --include="*.js" --include="*.ts" .

# Check for secrets
grep -r "secret.*=" --include="*.js" --include="*.ts" .
```

## Docker Compose Security

When using Docker Compose:
1. **Never hardcode passwords** in docker-compose.yml
2. **Use environment variables** from .env file
3. **Use docker-compose.prod.yml** for production (uses env vars)

Example:
```yaml
environment:
  - DB_PASSWORD=${DB_PASSWORD}  # ✅ Good - uses env var
  - DB_PASSWORD=password         # ❌ Bad - hardcoded
```

## If You Accidentally Committed Sensitive Data

1. **Immediately rotate all secrets** (passwords, API keys, etc.)
2. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/sensitive/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (coordinate with team first!)
4. **Update .gitignore** to prevent future commits

## Best Practices

1. ✅ Always use environment variables for secrets
2. ✅ Use `.env.example` files as templates
3. ✅ Never commit `.env` files
4. ✅ Rotate secrets regularly
5. ✅ Use strong, unique passwords
6. ✅ Review git diffs before committing
7. ✅ Use secrets management in production (AWS Secrets Manager, etc.)

## Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** create a public issue
2. Contact the maintainers privately
3. Provide details of the vulnerability
4. Allow time for a fix before disclosure

---

**Remember**: Security is everyone's responsibility. When in doubt, don't commit it!

