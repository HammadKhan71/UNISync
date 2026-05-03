// ── Clubs Routes ──────────────────────────────────────────────────────────
const express  = require('express');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Simple in-memory cache (60s TTL) so repeated loads don't hammer Supabase
let _clubsCache = null;
let _clubsCacheTime = 0;
const CLUBS_TTL = 60_000; // 60 seconds

function invalidateClubsCache() { _clubsCache = null; _clubsCacheTime = 0; }

// GET /api/clubs — all clubs with leaders, announcements, and new fields
router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    if (_clubsCache && (now - _clubsCacheTime) < CLUBS_TTL) {
      return res.json(_clubsCache);
    }
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select('*, club_leaders(*), club_announcements(*)')
      .order('members', { ascending: false });
    if (error) throw error;
    _clubsCache = clubs;
    _clubsCacheTime = now;
    return res.json(clubs);
  } catch (err) {
    console.error('Clubs fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// GET /api/clubs/:id — single club with full details
router.get('/:id', async (req, res) => {
  try {
    const { data: club, error } = await supabase
      .from('clubs')
      .select('*, club_leaders(*), club_announcements(*)')
      .eq('id', req.params.id)
      .single();
    if (error || !club) return res.status(404).json({ error: 'Club not found' });
    return res.json(club);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch club' });
  }
});

// GET /api/clubs/:id/posts — get event posts for a club (public)
router.get('/:id/posts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_posts')
      .select('*')
      .eq('club_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/clubs/:id/members — get members of a club (auth required)
router.get('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('user_id, created_at, users(id, first_name, last_name, email, student_id, avatar_url, department, year, bio, program)')
      .eq('club_id', req.params.id);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
});

module.exports = router;
module.exports.invalidateClubsCache = invalidateClubsCache;
