# RetentionOS - Security Documentation

This document defines security rules, authentication requirements, and data protection measures for RetentionOS. This is the baseline for backend, dashboard, and API processes.

---

## 1. Authentication Rules

### Admin Access Requirements
Admin access must use:
- Email
- Password
- JWT session token

### Password Security
- Passwords stored as **hashed strings with salt**
- Use bcrypt with cost factor 12 or higher
- No password recovery without email verification
- Password reset requires email confirmation link
- Minimum password length: 12 characters
- Require uppercase, lowercase, number, and special character

### JWT Token Rules
- JWT uses **short expiration**, recommended **1 hour**
- Refresh token allowed only for admins with MFA enabled
- Token stored in HTTP-only cookies (not localStorage)
- Token includes: adminId, role, issuedAt, expiresAt
- Token signature uses strong secret (minimum 256 bits)

### API Access Rules
- No API access without JWT or API key
- All admin routes must reject unauthenticated requests
- Return 401 Unauthorized for invalid/missing tokens
- Return 403 Forbidden for insufficient permissions

---

## 2. Role Rules

### Roles Defined

#### Owner
- Full system access
- Can create/delete admins
- Can rotate system-wide secrets
- Can access all data and configurations

#### Admin
- Flows management (create, edit, delete)
- Analytics viewing and export
- Team management (create analysts)
- Billing access
- API key management
- Cannot create other Admins or Owners

#### Analyst
- Analytics viewing only
- Flow viewing only
- Cannot modify flows
- Cannot access user-level data
- Cannot view API keys

#### ReadOnly
- View analytics only
- Cannot view user-level data
- Cannot access any configuration
- Cannot view flows

### Permission Rules
- **Only Owners** can create Admins
- **Only Owners** can rotate system-wide secrets
- **Analysts cannot modify flows**
- **ReadOnly cannot view user-level data**
- Role changes require Owner approval
- Role downgrade triggers session invalidation

---

## 3. API Key Rules

### Key Management
- Each key belongs to **one Admin**
- Each key is **hashed before storage** (use SHA-256 or bcrypt)
- Only **last four characters** shown in UI (e.g., `****abc1`)
- Keys are **logged on each use** (timestamp, IP, endpoint)
- Keys with **no activity for 30 days** are flagged for review
- **Rotation required every 90 days** (enforce via expiration)
- **Delete immediately** on suspicious activity

### Key Generation
- Minimum 32 characters
- Cryptographically secure random generation
- Prefix: `ret_` for identification
- Format: `ret_[32-char-random-string]`

### Key Validation
- Validate on every widget API call
- Check expiration date
- Check if key is active (not revoked)
- Log validation attempts (success and failure)

### Suspicious Activity Indicators
- Unusual IP addresses
- High request volume from single key
- Requests from multiple regions simultaneously
- Failed validation attempts > 5 in 1 hour

---

## 4. Rate Limit Rules

### Admin Dashboard Limits
- **100 requests per minute** per admin
- Applied to all admin endpoints
- Returns 429 Too Many Requests when exceeded
- Include `Retry-After` header in response

### Widget API Limits
- **30 requests per minute** per site (based on API key)
- Applied to `/retention/start` and `/retention/decision`
- Prevents abuse and DDoS attacks
- Different limits for different API key tiers

### Lockout Rules
- **API keys locked** after 10 failed validations
- **JWT requests locked** after 5 failed logins
- Lockout duration: 15 minutes
- Admin must unlock manually or wait for timeout
- Log all lockout events

### Rate Limit Headers
Include in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

---

## 5. Audit Logging Rules

### Actions That Must Be Logged

#### Authentication Events
- Login attempts (success and failure)
- Logout events
- Password reset requests
- Token refresh attempts

#### Administrative Actions
- Flow edits (create, update, delete)
- API key creation
- API key deletion
- API key rotation
- Admin creation
- Admin role updates
- Admin deletion

#### System Configuration
- Stripe configuration changes
- System-wide secret rotation
- Rate limit configuration changes
- Security policy updates

### Audit Log Fields
Each audit log entry must include:
- `adminId` - Admin who performed action
- `action` - Action type (e.g., "flow_created", "api_key_rotated")
- `timestamp` - ISO 8601 format
- `IP` - IP address of request
- `description` - Human-readable description
- `resourceId` - ID of affected resource (if applicable)
- `beforeState` - State before change (for updates)
- `afterState` - State after change (for updates)

### Audit Log Storage
- Store in `audit_logs` table
- **Retention period: 12 months**
- Archive older logs to cold storage
- Encrypt audit logs at rest
- No deletion allowed (append-only)

### Audit Log Access
- Only Owners can view audit logs
- Audit logs cannot be modified
- Export functionality for compliance
- Search and filter capabilities

---

## 6. Data Access Rules

### User Data Access
- **Raw user data** shown only to Owner and Admin roles
- **Churn reasons anonymized** for Analyst and ReadOnly roles
- **Offer events viewable** only with Admin privileges
- No PII (Personally Identifiable Information) beyond email and region unless required
- User IDs should be hashed in analytics for lower roles

### Data Display Rules
- **No SQL queries exposed** in dashboard
- Use parameterized queries only
- No raw database access from frontend
- All data access through API endpoints

### Data Retention
- User data retained for active subscriptions
- Deleted user data purged after 30 days
- Analytics data retained for 24 months
- Audit logs retained for 12 months

### Data Export
- Export requires Admin or Owner role
- Exports logged in audit trail
- Exports encrypted in transit
- Exports expire after 7 days

---

## 7. Session Rules

### Session Management
- **JWT stored in HTTP-only cookies** (not localStorage)
- Cookies set with `Secure` flag (HTTPS only)
- Cookies set with `SameSite=Strict`
- Session invalidation after logout
- All active sessions listed in admin profile

### Session Security
- **IP mismatch triggers forced logout**
- Detect and log IP changes during session
- Admin sessions expire on role change
- Concurrent session limit: 3 per admin
- Oldest session terminated when limit exceeded

### Session Expiration
- Default session: 1 hour
- Extended session (with MFA): 24 hours
- Refresh token: 7 days (MFA required)
- Automatic logout on inactivity: 30 minutes

---

## 8. Encryption Rules

### Data in Transit
- **TLS required** for all API calls
- Minimum TLS version: 1.2
- Preferred TLS version: 1.3
- Certificate validation required
- HSTS headers enabled

### Data at Rest
- **All secrets stored encrypted at rest**
- Use AES-256 encryption
- Encryption keys stored in secure key management system
- Database encryption at rest enabled
- Backup encryption required

### Inter-Service Communication
- **All communication between services over internal network**
- Use service mesh or VPN for inter-service calls
- No unencrypted communication between services
- Mutual TLS (mTLS) for service-to-service authentication

### Key Management
- Use environment variables for secrets (never commit to git)
- Rotate encryption keys quarterly
- Use key management service (AWS KMS, HashiCorp Vault, etc.)
- Separate keys for different environments

---

## 9. Input Validation

### API Input Rules
- Validate all input data
- Sanitize user inputs
- Reject malformed JSON
- Enforce data type constraints
- Maximum request body size: 1MB

### SQL Injection Prevention
- Use parameterized queries only
- No string concatenation in SQL
- Use ORM/query builder
- Regular security audits

### XSS Prevention
- Sanitize all user-generated content
- Use Content Security Policy (CSP) headers
- Encode output data
- Validate and sanitize HTML inputs

---

## 10. Security Headers

### Required HTTP Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 11. Compliance Considerations

### GDPR Compliance
- Right to access user data
- Right to deletion
- Data portability
- Consent management
- Privacy policy requirements

### SOC 2 Considerations
- Access controls
- Encryption requirements
- Audit logging
- Incident response procedures
- Regular security assessments

---

## 12. Incident Response

### Security Incident Types
- Unauthorized access
- Data breach
- DDoS attack
- API key compromise
- System compromise

### Response Procedures
1. Immediate containment
2. Assess impact
3. Notify affected parties (if required)
4. Document incident
5. Post-incident review
6. Update security measures

---

## 13. Security Testing

### Regular Testing
- Penetration testing: Quarterly
- Vulnerability scanning: Monthly
- Code security reviews: Per release
- Dependency updates: Weekly

### Testing Tools
- OWASP ZAP for vulnerability scanning
- Snyk for dependency scanning
- SonarQube for code quality
- Custom security test suites

---

*This document is part of the RetentionOS security and compliance specification. All implementations must adhere to these rules.*

