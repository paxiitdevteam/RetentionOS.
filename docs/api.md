# RetentionOS API Documentation

## Base URL
- Development: `http://localhost:3000`
- Production: `https://api.retentionos.com`

## Authentication

### Admin Endpoints
Require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Widget Endpoints
Require API key in header:
```
X-API-Key: <api-key>
```

## Retention Endpoints

### POST /retention/start
Start a retention flow for a user.

**Request:**
```json
{
  "apiKey": "string",
  "userId": "string",
  "plan": "string",
  "region": "string"
}
```

**Response:**
```json
{
  "flowId": 1,
  "steps": [...],
  "language": "en"
}
```

### POST /retention/decision
Record user decision in retention flow.

**Request:**
```json
{
  "flowId": 1,
  "offerType": "pause",
  "accepted": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription paused"
}
```

### GET /retention/flow/:id
Get flow details.

## Admin Endpoints

### POST /admin/login
Admin authentication.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "token": "jwt-token",
  "admin": {...}
}
```

### GET /admin/flows
List all retention flows.

### POST /admin/flows
Create new retention flow.

### PUT /admin/flows/:id
Update retention flow.

### GET /admin/analytics/summary
Get analytics summary (saved revenue, saved users).

### GET /admin/analytics/reasons
Get churn reasons data.

### GET /admin/analytics/offers
Get offer performance data.

