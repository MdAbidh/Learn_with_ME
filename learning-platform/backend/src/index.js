const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const { initDb } = require('./utils/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow local dev, Vercel frontend, and any FRONTEND_URL from env
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(fileUpload({ limits: { fileSize: 100 * 1024 * 1024 } }));

// Static files (thumbnails, uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize DB then start server
initDb().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Backend running on port ${PORT}`);
    console.log(`📚 API: http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;
