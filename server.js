/**
 * RetentionOS Root Server
 * Serves status page and provides API proxy
 * Runs at root level for easy access
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve status page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'status.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    server: 'root-server',
    timestamp: new Date().toISOString()
  });
});

// Proxy status endpoint to backend
app.get('/api/status', async (req, res) => {
  try {
    const http = require('http');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const url = new URL(`${backendUrl}/status`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const request = http.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          res.json(jsonData);
        } catch (e) {
          res.status(500).json({
            success: false,
            error: 'Failed to parse backend response',
          });
        }
      });
    });

    request.on('error', (error) => {
      res.status(503).json({
        success: false,
        error: 'Backend server not available',
        message: 'Make sure the backend server is running on port 3000',
      });
    });

    request.end();
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Backend server not available',
      message: 'Make sure the backend server is running on port 3000',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 RetentionOS Root Server running');
  console.log(`📊 Status page: http://localhost:${PORT}/`);
  console.log(`📄 Direct file: http://localhost:${PORT}/status.html`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('');
  console.log('To start backend API:');
  console.log('  cd backend && npm run dev');
});

