import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import cookieParser from 'cookie-parser';
import { testConnection } from './db';
import './models'; // Initialize models
import PMS from './utils/pms';
import adminRoutes from './api/admin';
import statusRoutes from './api/status';
import retentionRoutes from './api/retention';
import stripeRoutes from './api/stripe';
import aiRoutes from './api/ai';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP addresses (important for audit logging)
app.set('trust proxy', true);

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:3001', // Dashboard
  'http://localhost:8000', // Root server / Status page
  'http://127.0.0.1:8000',
  'http://127.0.0.1:3001',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else if (process.env.CORS_ORIGIN === '*') {
      // Allow all if explicitly set
      callback(null, true);
    } else {
      // For development, allow all origins
      callback(null, true);
    }
  },
  credentials: true, // Allow cookies
}));

// Stripe webhook needs raw body for signature verification
// Must be before express.json() middleware
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cookieParser()); // Parse HTTP-only cookies

// Serve static files (if needed)
app.use(express.static(path.join(__dirname, '../public')));

// Favicon handler (prevent 404 errors)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    server: 'backend-api',
    version: PMS.getVersion(),
    timestamp: new Date().toISOString()
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  const isConnected = await testConnection();
  res.json({ 
    status: isConnected ? 'ok' : 'error',
    database: isConnected ? 'connected' : 'disconnected',
    databaseUrl: PMS.getDatabaseUrl().replace(/:[^:@]+@/, ':****@') // Hide password
  });
});

// PMS info endpoint
app.get('/pms/info', (req, res) => {
  res.json({
    version: PMS.getVersion(),
    apiBaseUrl: PMS.getApiBaseUrl(),
    baseUrl: PMS.getBaseUrl(),
    dashboardUrl: PMS.getDashboardUrl(),
    widgetUrl: PMS.getWidgetUrl(),
  });
});

// API routes
app.use('/admin', adminRoutes);
app.use('/admin/ai', aiRoutes);
app.use('/status', statusRoutes);
app.use('/retention', retentionRoutes);
app.use('/stripe', stripeRoutes);

// Initialize database connection on startup
const startServer = async () => {
  try {
    // Test database connection (don't fail if DB is not available)
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed, but server will continue');
      console.warn('⚠️  Some features may not work until database is connected');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 RetentionOS Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💾 Database check: http://localhost:${PORT}/health/db`);
      console.log(`🔐 Admin login: http://localhost:${PORT}/admin/login`);
      console.log(`👤 Admin info: http://localhost:${PORT}/admin/me`);
      console.log(`🔄 Retention API: http://localhost:${PORT}/retention/*`);
      console.log(`💳 Stripe webhook: http://localhost:${PORT}/stripe/webhook`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Don't exit - allow server to start even with errors
    // process.exit(1);
  }
};

startServer();

