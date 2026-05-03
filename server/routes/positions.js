// ── Positions Routes ──────────────────────────────────────────────────────
const express  = require('express');
const supabase = require('../supabase');

const router = express.Router();

// GET /api/positions — all open positions
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('status', 'open');
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

module.exports = router;
