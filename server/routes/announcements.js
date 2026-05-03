// ── Announcements Routes ──────────────────────────────────────────────────
const express  = require('express');
const supabase = require('../supabase');

const router = express.Router();

// GET /api/announcements
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

module.exports = router;
