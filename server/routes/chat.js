// ── Chat Routes ───────────────────────────────────────────────────────────
const express    = require('express');
const supabase   = require('../supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/chat/:clubId — get messages for a club chat
router.get('/:clubId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, users(avatar_url)')
      .eq('club_id', req.params.clubId)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    // Reverse so oldest is first, flatten avatar_url
    const messages = (data || []).reverse().map(m => ({
      ...m,
      avatar_url: m.users?.avatar_url || '',
    }));
    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/:clubId — send a message (requires auth)
router.post('/:clubId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        club_id:  req.params.clubId,
        user_id:  req.user.id,
        sender:   `${req.user.firstName} ${req.user.lastName}`,
        text:     text.trim(),
      })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
