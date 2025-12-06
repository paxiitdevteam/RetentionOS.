# RetentionOS Testing Guide

## 🚀 Quick Start - Testing All Components

### Prerequisites
- Node.js installed
- MariaDB/MySQL running (or Docker)
- All dependencies installed

### Step 1: Start All Servers

Open **3 terminal windows** and run:

#### Terminal 1: Backend API (Port 3000)
```bash
cd backend
npm install  # If not already done
npm run dev
```

**Expected output:**
```
🚀 RetentionOS Backend running on port 3000
📊 Health check: http://localhost:3000/health
💾 Database check: http://localhost:3000/health/db
🔐 Admin login: http://localhost:3000/admin/login
👤 Admin info: http://localhost:3000/admin/me
🔄 Retention API: http://localhost:3000/retention/*
💳 Stripe webhook: http://localhost:3000/stripe/webhook
```

#### Terminal 2: Dashboard (Port 3001)
```bash
cd frontend/dashboard
npm install  # If not already done
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3001
- Local: http://localhost:3001
```

#### Terminal 3: Root Server (Port 8000)
```bash
cd .  # Root directory
node server.js
```

**Expected output:**
```
🚀 Root server running on port 8000
📊 Status page: http://localhost:8000
```

---

## 📋 Testing Checklist

### ✅ 1. Backend API Testing

#### Health Check
```bash
curl http://localhost:3000/health
```

**Expected:** JSON response with `status: "ok"`

#### Status API
```bash
curl http://localhost:3000/status
```

**Expected:** JSON with project progress, phases, and backend status

#### Database Connection
```bash
curl http://localhost:3000/health/db
```

**Expected:** `database: "connected"` or `"disconnected"`

---

### ✅ 2. Dashboard Testing

#### Access Dashboard
1. Open browser: `http://localhost:3001`
2. **Expected:** Redirect to `/login` page

#### Login Test
1. Go to: `http://localhost:3001/login`
2. **Default credentials** (if seeded):
   - Email: `admin@retentionos.com`
   - Password: `admin123` (or check seed file)

3. **Expected:**
   - Login form appears
   - On success: Redirect to dashboard overview
   - See analytics summary cards

#### Dashboard Overview
1. After login, you should see:
   - ✅ Sidebar navigation (Overview, Analytics, Flows, Settings)
   - ✅ Metric cards (Revenue Saved, Users Saved, Acceptance Rate, Avg Revenue/User)
   - ✅ Quick Stats section
   - ✅ System Status section

---

### ✅ 3. Status Page Testing

#### Access Status Page
1. Open browser: `http://localhost:8000`
2. **Expected:**
   - Auto-updating status page
   - Shows project progress percentage
   - Shows completed phases
   - Shows backend/database status
   - Updates every 5 seconds

---

### ✅ 4. API Endpoints Testing

#### Test Admin Login (via curl)
```bash
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@retentionos.com","password":"admin123"}'
```

**Expected:** JSON with `token` and `admin` object

#### Test Analytics Summary (requires auth token)
```bash
# First get token from login, then:
curl http://localhost:3000/admin/analytics/summary \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** JSON with summary metrics

---

### ✅ 5. Widget Testing (Optional)

#### Build Widget
```bash
cd frontend/widget
npm install
npm run build
```

**Expected:** Creates `build/retentionos-widget.js`

#### Test Widget in HTML
Create a test HTML file:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Widget Test</title>
</head>
<body>
  <button id="cancel-btn">Cancel Subscription</button>
  
  <script src="../frontend/widget/build/retentionos-widget.js"></script>
  <script>
    const widget = new RetentionOS({
      apiKey: 'your-api-key-here',
      userId: 'test-user-123',
      plan: 'pro',
      region: 'us',
      apiUrl: 'http://localhost:3000'
    });
    
    widget.init();
  </script>
</body>
</html>
```

**Expected:** Clicking cancel button shows retention modal

---

## 🔍 Verification Steps

### Backend Verification
- [ ] Backend server starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Status endpoint returns progress data
- [ ] Database connection works (if configured)
- [ ] CORS allows dashboard origin (localhost:3001)

### Dashboard Verification
- [ ] Dashboard server starts without errors
- [ ] Login page loads correctly
- [ ] Can login with admin credentials
- [ ] Overview page shows analytics data
- [ ] Sidebar navigation works
- [ ] Logout functionality works

### Status Page Verification
- [ ] Status page loads at localhost:8000
- [ ] Shows current project status
- [ ] Auto-updates every 5 seconds
- [ ] Displays backend connection status

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Verify Node.js version (should be 18+)
- Check `backend/.env` file exists
- Run `npm install` in backend directory

### Dashboard won't start
- Check if port 3001 is already in use
- Verify Node.js version
- Run `npm install` in frontend/dashboard directory
- Check for TypeScript errors

### Can't login
- Verify admin user exists in database
- Check backend is running on port 3000
- Check browser console for errors
- Verify CORS is configured correctly

### Analytics shows no data
- This is normal if database is empty
- Run database migrations: `cd backend && npm run migrate`
- Seed database: `cd backend && npm run seed`
- Check database connection in backend logs

### Status page shows "Backend offline"
- Verify backend is running on port 3000
- Check CORS configuration in backend
- Verify root server can reach backend

---

## 📊 Expected Test Results

### With Empty Database
- Dashboard shows: `$0.00` revenue saved, `0` users saved
- Analytics endpoints return empty arrays
- This is **normal** - data will populate as retention flows are used

### With Seeded Data
- Dashboard shows analytics metrics
- Charts display data points
- Tables show offer performance

---

## 🎯 Next Steps After Testing

1. **Create Admin User** (if not seeded):
   ```bash
   cd backend
   npm run seed
   ```

2. **Create API Key** (via dashboard or API):
   - Login to dashboard
   - Go to Settings → API Keys
   - Create new API key
   - Use this key in widget

3. **Test Widget Integration**:
   - Embed widget in test page
   - Click cancel button
   - Verify modal appears
   - Test offer acceptance flow

4. **Test Full Flow**:
   - Widget detects cancel
   - Backend returns flow
   - User accepts offer
   - Analytics updates

---

## 📝 Notes

- All servers must run simultaneously for full functionality
- Database is optional for basic testing (backend will show warnings)
- Widget requires API key from dashboard
- CORS is configured for localhost development
- All connection settings are preserved between restarts

---

## ✅ Success Criteria

You know everything is working when:
- ✅ All 3 servers start without errors
- ✅ Can access dashboard at localhost:3001
- ✅ Can login successfully
- ✅ Dashboard shows overview page
- ✅ Status page auto-updates
- ✅ Backend API responds to requests
- ✅ No console errors in browser
- ✅ No errors in server logs

---

**Happy Testing! 🚀**

