// ── Real-time SSE Route ────────────────────────────────────────────────────
// Server-Sent Events endpoint so the frontend gets pushed updates instantly
const express        = require('express');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Map of userId -> Set of SSE response objects
const clients = new Map();

// ── Helper: push event to a specific user ─────────────────────────────────
function pushToUser(userId, eventType, data) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.size === 0) return;
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  userClients.forEach(res => {
    try { res.write(payload); } catch(e) {}
  });
}

// ── Helper: push event to all connected users ─────────────────────────────
function pushToAll(eventType, data) {
  clients.forEach((userClients, _userId) => {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    userClients.forEach(res => {
      try { res.write(payload); } catch(e) {}
    });
  });
}

// ── GET /api/realtime/stream — SSE stream (requires auth) ─────────────────
router.get('/stream', authMiddleware, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Register this client
  const userId = req.user.id;
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);

  // Send initial "connected" ping
  res.write(`event: connected\ndata: {"userId":"${userId}"}\n\n`);

  // Keep-alive heartbeat every 25s
  const hb = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch(e) {}
  }, 25000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(hb);
    const set = clients.get(userId);
    if (set) { set.delete(res); if (set.size === 0) clients.delete(userId); }
  });
});

module.exports = { router, pushToUser, pushToAll };
