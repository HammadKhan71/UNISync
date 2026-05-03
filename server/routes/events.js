// ── Events Routes ─────────────────────────────────────────────────────────
const express  = require('express');
const supabase = require('../supabase');

const router = express.Router();

// Simple in-memory cache (90s TTL) for event list
let _eventsCache = null;
let _eventsCacheTime = 0;
const EVENTS_TTL = 90_000;

function invalidateEventsCache() { _eventsCache = null; _eventsCacheTime = 0; }

// GET /api/events — all events with reviews
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (_eventsCache && (now - _eventsCacheTime) < EVENTS_TTL) {
      return res.json(_eventsCache);
    }
    const { data: events, error } = await supabase
      .from('events')
      .select('*, event_reviews(*)');
    if (error) throw error;
    _eventsCache = events;
    _eventsCacheTime = now;
    return res.json(events);
  } catch (err) {
    console.error('Events fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id — single event
router.get('/:id', async (req, res) => {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*, event_reviews(*)')
      .eq('id', req.params.id)
      .single();
    if (error || !event) return res.status(404).json({ error: 'Event not found' });
    return res.json(event);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events/:id/view — increment view_count (fire-and-forget, no await on update)
router.post('/:id/view', async (req, res) => {
  const id = parseInt(req.params.id);
  res.json({ ok: true }); // respond immediately, don't make client wait
  try {
    await supabase.rpc('increment_view_count', { event_id_input: id }).catch(async () => {
      // fallback if RPC doesn't exist
      const { data: ev } = await supabase.from('events').select('view_count').eq('id', id).single();
      const current = (ev && ev.view_count) ? ev.view_count : 0;
      await supabase.from('events').update({ view_count: current + 1 }).eq('id', id);
    });
    invalidateEventsCache();
  } catch (err) { /* fire-and-forget */ }
});

module.exports = router;
module.exports.invalidateEventsCache = invalidateEventsCache;
