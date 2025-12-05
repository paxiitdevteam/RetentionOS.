import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db';
import './models'; // Initialize models

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database health check
app.get('/health/db', async (req, res) => {
  const isConnected = await testConnection();
  res.json({ 
    status: isConnected ? 'ok' : 'error',
    database: isConnected ? 'connected' : 'disconnected'
  });
});

// TODO: Add API routes
// - /retention/*
// - /admin/*

// Initialize database connection on startup
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 RetentionOS Backend running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`💾 Database check: http://localhost:${PORT}/health/db`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

