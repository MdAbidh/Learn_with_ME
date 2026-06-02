const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const { initDb } = require('../backend/src/utils/database');
const routes = require('../backend/src/routes');

const app = express();

// CORS configuration for Vercel deployment
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL || 'https://learning-platform.vercel.app',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({ 
  origin: allowedOrigins, 
  credentials: true 
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({ limits: { fileSize: 100 * 1024 * 1024 } }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize DB then start server (for local development only)
if (process.env.NODE_ENV !== 'production') {
  initDb().then(() => {
    console.log('Database initialized');
  }).catch(err => {
    console.error('Failed to initialize database:', err);
  });
}

module.exports = app;
