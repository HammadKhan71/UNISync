// ── UNISYNC Express Server Entry Point ────────────────────────────────────
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const path        = require('path');
const compression = require('compression');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// ── Serve static frontend files ───────────────────────────────────────────
// The server folder is inside UNISYNC/server, so frontend is one level up
app.use(express.static(path.join(__dirname, '..')));

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/clubs',         require('./routes/clubs'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/positions',     require('./routes/positions'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/chat',          require('./routes/chat'));
app.use('/api/user',          require('./routes/user'));
app.use('/api/executive',     require('./routes/executive'));

// ── Real-time SSE Route ───────────────────────────────────────────────────
const { router: realtimeRouter } = require('./routes/realtime');
app.use('/api/realtime',      realtimeRouter);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'UniSync API' }));

// ── Fallback: serve login.html for any non-API route ─────────────────────
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
  }
});

const PORT = process.env.PORT || 3001;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n✅ UniSync API running at http://localhost:${PORT}`);
    console.log(`   Frontend:  http://localhost:${PORT}/login.html`);
    console.log(`   Health:    http://localhost:${PORT}/api/health\n`);
  });
}

// Export for Vercel serverless function
module.exports = app;
