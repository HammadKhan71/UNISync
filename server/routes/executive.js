// ── Executive Routes (protected — executive role only) ──────────────────────
const express        = require('express');
const supabase       = require('../supabase');
const authMiddleware = require('../middleware/auth');
const { pushToUser, pushToAll } = require('./realtime');
const { invalidateClubsCache } = require('./clubs');

const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// ── Helper: ensure caller is executive ────────────────────────────────────
function requireExec(req, res) {
  if (req.user.role !== 'executive') {
    res.status(403).json({ error: 'Executive access required' });
    return false;
  }
  return true;
}

// ── Helper: ensure exec owns the club ─────────────────────────────────────
async function requireClubOwner(req, res, clubId) {
  const { data: club } = await supabase
    .from('clubs')
    .select('executive_id')
    .eq('id', clubId)
    .single();
  if (!club || club.executive_id !== req.user.id) {
    res.status(403).json({ error: 'You are not the executive of this club' });
    return false;
  }
  return true;
}

// ══════════════════════════════════════════════════════════════════════════════
// CLUB MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

// ── POST /api/executive/clubs — Create a new club ─────────────────────────
router.post('/clubs', async (req, res) => {
  if (!requireExec(req, res)) return;
  try {
    const {
      name, category, emoji, description,
      photoUrl, igHandle, linkedin,
      accountNumber, accountName, paymentInfo, rules
    } = req.body;

    if (!name || !category || !emoji) {
      return res.status(400).json({ error: 'name, category and emoji are required' });
    }

    const chatId = 'chat_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();

    const { data: club, error } = await supabase
      .from('clubs')
      .insert({
        name,
        category,
        emoji,
        description: description || '',
        photo_url:       photoUrl || '',
        ig_handle:       igHandle || '',
        linkedin:        linkedin || '',
        account_number:  accountNumber || '',
        account_name:    accountName || '',
        payment_info:    paymentInfo || '',
        rules:           rules || '',
        chat_id:         chatId,
        executive_id:    req.user.id,
        members:         1,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-add executive as member
    await supabase.from('club_memberships').insert({
      user_id: req.user.id,
      club_id: club.id,
    });

    // Add executive as leader
    await supabase.from('club_leaders').insert({
      club_id: club.id,
      user_id: req.user.id,
      name:    `${req.user.firstName} ${req.user.lastName}`,
      role:    'Executive / President',
      img:     '',
    });

    // Notify the exec
    const notif = {
      user_id: req.user.id,
      icon: '🏛️',
      title: 'Club Created',
      text: `Your club "${name}" has been created successfully!`,
      unread: true,
    };
    const { data: notifData } = await supabase.from('notifications').insert(notif).select().single();

    // Push SSE to exec: new notification + club created
    pushToUser(req.user.id, 'notification', {
      id: notifData?.id, icon: '🏛️', title: 'Club Created',
      text: `Your club "${name}" has been created successfully!`, unread: true
    });
    // Push club update to all connected users so explore page refreshes
    invalidateClubsCache();
    pushToAll('clubs_updated', { clubId: club.id });

    return res.status(201).json({ success: true, club });
  } catch (err) {
    console.error('Create club error:', err);
    return res.status(500).json({ error: 'Failed to create club' });
  }
});

// ── PUT /api/executive/clubs/:id — Update club details ───────────────────
router.put('/clubs/:id', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const {
      name, category, emoji, description,
      photoUrl, igHandle, linkedin,
      accountNumber, accountName, paymentInfo, rules
    } = req.body;

    const updates = {};
    if (name           !== undefined) updates.name           = name;
    if (category       !== undefined) updates.category       = category;
    if (emoji          !== undefined) updates.emoji          = emoji;
    if (description    !== undefined) updates.description    = description;
    if (photoUrl       !== undefined) updates.photo_url      = photoUrl;
    if (igHandle       !== undefined) updates.ig_handle      = igHandle;
    if (linkedin       !== undefined) updates.linkedin       = linkedin;
    if (accountNumber  !== undefined) updates.account_number = accountNumber;
    if (accountName    !== undefined) updates.account_name   = accountName;
    if (paymentInfo    !== undefined) updates.payment_info   = paymentInfo;
    if (rules          !== undefined) updates.rules          = rules;

    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Push update to all so explore page reflects changes
    invalidateClubsCache();
    pushToAll('clubs_updated', { clubId: parseInt(req.params.id) });

    return res.json({ success: true, club: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update club' });
  }
});

// ── DELETE /api/executive/clubs/:id — Delete own club ─────────────────────
router.delete('/clubs/:id', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const clubId = parseInt(req.params.id);
    // Delete related data first
    await supabase.from('club_memberships').delete().eq('club_id', clubId);
    await supabase.from('club_leaders').delete().eq('club_id', clubId);
    await supabase.from('club_announcements').delete().eq('club_id', clubId);
    await supabase.from('chat_messages').delete().eq('club_id', clubId);
    await supabase.from('club_join_requests').delete().eq('club_id', clubId);
    // Delete positions and their applications
    const { data: positions } = await supabase.from('positions').select('id').eq('club_id', clubId);
    if (positions && positions.length) {
      const posIds = positions.map(p => p.id);
      await supabase.from('applications').delete().in('position_id', posIds);
      await supabase.from('positions').delete().eq('club_id', clubId);
    }
    // Delete events and their related data
    const { data: events } = await supabase.from('events').select('id').eq('club_id', clubId);
    if (events && events.length) {
      const evIds = events.map(e => e.id);
      await supabase.from('rsvps').delete().in('event_id', evIds);
      await supabase.from('saved_events').delete().in('event_id', evIds);
      await supabase.from('event_reviews').delete().in('event_id', evIds);
      await supabase.from('events').delete().eq('club_id', clubId);
    }
    // Delete the club itself
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (error) throw error;
    invalidateClubsCache();
    pushToAll('clubs_updated', { clubId, deleted: true });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete club' });
  }
});

// ── GET /api/executive/clubs/my — Get executive's clubs ───────────────────
router.get('/clubs/my', async (req, res) => {
  if (!requireExec(req, res)) return;
  try {
    const { data, error } = await supabase
      .from('clubs')
      .select('*, club_leaders(*), club_announcements(*)')
      .eq('executive_id', req.user.id);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch your clubs' });
  }
});

// ── GET /api/executive/clubs/:id/members — Get club members ───────────────
router.get('/clubs/:id/members', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('user_id, created_at, users(id, first_name, last_name, email, student_id, avatar_url, department, year)')
      .eq('club_id', req.params.id);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ── DELETE /api/executive/clubs/:id/members/:userId — Remove member ────────
router.delete('/clubs/:id/members/:userId', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    await supabase
      .from('club_memberships')
      .delete()
      .eq('club_id', req.params.id)
      .eq('user_id', req.params.userId);

    try { await supabase.rpc('decrement_members', { club_id_input: parseInt(req.params.id) }); } catch(e){}

    // Notify removed user
    const { data: club } = await supabase.from('clubs').select('name').eq('id', req.params.id).single();
    const notif = {
      user_id: req.params.userId,
      icon: '🚪',
      title: 'Removed from Club',
      text: `You have been removed from "${club?.name || 'a club'}" by the executive.`,
      unread: true,
    };
    const { data: notifData } = await supabase.from('notifications').insert(notif).select().single();

    // Real-time push to removed user
    pushToUser(req.params.userId, 'notification', {
      id: notifData?.id, icon: '🚪', title: 'Removed from Club',
      text: notif.text, unread: true
    });
    // Also push membership change so their UI updates
    pushToUser(req.params.userId, 'membership_changed', { clubId: parseInt(req.params.id), joined: false });
    // Push members count update to all
    invalidateClubsCache();
    pushToAll('clubs_updated', { clubId: parseInt(req.params.id) });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to remove member' });
  }
});

// ── POST /api/executive/clubs/:id/members — Add member by email ───────────
router.post('/clubs/:id/members', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const { data: user } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) return res.status(404).json({ error: 'User not found with that email' });

    // Check already member
    const { data: existing } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', req.params.id)
      .eq('user_id', user.id)
      .single();

    if (existing) return res.status(409).json({ error: 'User is already a member' });

    await supabase.from('club_memberships').insert({ club_id: parseInt(req.params.id), user_id: user.id });
    try { await supabase.rpc('increment_members', { club_id_input: parseInt(req.params.id) }); } catch(e){}

    const { data: club } = await supabase.from('clubs').select('name, chat_id').eq('id', req.params.id).single();
    const notif = {
      user_id: user.id,
      icon: '🎉',
      title: 'Added to Club',
      text: `You have been added to "${club?.name || 'a club'}" by the executive!`,
      unread: true,
    };
    const { data: notifData } = await supabase.from('notifications').insert(notif).select().single();

    // Real-time push to added user
    pushToUser(user.id, 'notification', {
      id: notifData?.id, icon: '🎉', title: 'Added to Club',
      text: notif.text, unread: true
    });
    // Push membership join so their UI shows as joined immediately
    pushToUser(user.id, 'membership_changed', { clubId: parseInt(req.params.id), joined: true, chatId: club?.chat_id });
    // Push count update
    invalidateClubsCache();
    pushToAll('clubs_updated', { clubId: parseInt(req.params.id) });

    return res.json({ success: true, user: { id: user.id, name: `${user.first_name} ${user.last_name}` } });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to add member' });
  }
});

// ── POST /api/executive/clubs/:id/announcements — Post club announcement ──
router.post('/clubs/:id/announcements', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const { data, error } = await supabase
      .from('club_announcements')
      .insert({ club_id: parseInt(req.params.id), text })
      .select()
      .single();
    if (error) throw error;

    // Get all members and notify them
    const { data: members } = await supabase
      .from('club_memberships')
      .select('user_id')
      .eq('club_id', req.params.id);

    const { data: club } = await supabase.from('clubs').select('name').eq('id', req.params.id).single();

    if (members && members.length > 0) {
      const notifs = members.map(m => ({
        user_id: m.user_id,
        icon: '📢',
        title: `${club?.name || 'Club'} Announcement`,
        text: text.length > 100 ? text.slice(0, 100) + '...' : text,
        unread: true,
      }));
      const { data: notifRows } = await supabase.from('notifications').insert(notifs).select();

      // Real-time push to each member
      members.forEach((m, idx) => {
        const n = notifRows?.[idx];
        pushToUser(m.user_id, 'notification', {
          id: n?.id, icon: '📢',
          title: `${club?.name || 'Club'} Announcement`,
          text: text.length > 100 ? text.slice(0, 100) + '...' : text,
          unread: true
        });
        // Also push club announcement so UI refreshes
        pushToUser(m.user_id, 'club_announcement', { clubId: parseInt(req.params.id), text, clubName: club?.name });
      });
    }

    return res.status(201).json({ success: true, announcement: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to post announcement' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// JOIN REQUESTS
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/executive/clubs/:id/requests — View pending + interview requests
router.get('/clubs/:id/requests', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const { data, error } = await supabase
      .from('club_join_requests')
      .select('id, status, message, interview_msg, created_at, users(id, first_name, last_name, email, student_id, avatar_url, department, year)')
      .eq('club_id', req.params.id)
      .in('status', ['pending', 'interview'])
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// ── PUT /api/executive/requests/:requestId/interview — Schedule an interview ─
router.put('/requests/:requestId/interview', async (req, res) => {
  if (!requireExec(req, res)) return;
  try {
    const { interviewMsg } = req.body;
    if (!interviewMsg || !interviewMsg.trim()) {
      return res.status(400).json({ error: 'Interview details message is required' });
    }

    // Fetch request + club
    const { data: request, error: reqErr } = await supabase
      .from('club_join_requests')
      .select('*, clubs(id, name, executive_id, chat_id)')
      .eq('id', req.params.requestId)
      .single();

    if (reqErr || !request) return res.status(404).json({ error: 'Request not found' });
    if (request.clubs.executive_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not the executive of this club' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Can only schedule interview for pending requests' });
    }

    // Update status to 'interview' and save the message
    const { error: updErr } = await supabase
      .from('club_join_requests')
      .update({ status: 'interview', interview_msg: interviewMsg.trim() })
      .eq('id', req.params.requestId);
    if (updErr) throw updErr;

    const clubName = request.clubs.name;
    const clubId   = request.clubs.id;

    // Notify the student
    const notifText = `Your application to join "${clubName}" has moved to the interview stage. Tap to view details.`;
    const { data: notifData } = await supabase.from('notifications').insert({
      user_id: request.user_id,
      icon: '📅',
      title: 'Interview Scheduled!',
      text: notifText,
      unread: true,
    }).select().single();

    // Real-time push to student
    pushToUser(request.user_id, 'notification', {
      id: notifData?.id, icon: '📅', title: 'Interview Scheduled!',
      text: notifText, unread: true
    });
    // Push interview_scheduled so student UI updates the tracker
    pushToUser(request.user_id, 'interview_scheduled', {
      clubId,
      interviewMsg: interviewMsg.trim(),
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Interview schedule error:', err);
    return res.status(500).json({ error: 'Failed to schedule interview' });
  }
});

// ── PUT /api/executive/requests/:requestId — Accept or reject (interview stage only)
router.put('/requests/:requestId', async (req, res) => {
  if (!requireExec(req, res)) return;
  try {
    const { action } = req.body; // 'accept' or 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be accept or reject' });
    }

    // Get request
    const { data: request, error: reqErr } = await supabase
      .from('club_join_requests')
      .select('*, clubs(id, name, executive_id, chat_id)')
      .eq('id', req.params.requestId)
      .single();

    if (reqErr || !request) return res.status(404).json({ error: 'Request not found' });

    // Verify exec owns the club
    if (request.clubs.executive_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not the executive of this club' });
    }

    // Enforce: interview must be scheduled before accepting/rejecting
    if (request.status === 'pending') {
      return res.status(400).json({ error: 'You must schedule an interview before accepting or rejecting this request.' });
    }
    if (!['interview'].includes(request.status)) {
      return res.status(400).json({ error: 'This request has already been processed.' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await supabase
      .from('club_join_requests')
      .update({ status: newStatus })
      .eq('id', req.params.requestId);

    const clubName = request.clubs.name;
    const clubId   = request.clubs.id;
    const chatId   = request.clubs.chat_id;

    if (action === 'accept') {
      const { data: existing } = await supabase
        .from('club_memberships')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', request.user_id)
        .single();

      if (!existing) {
        await supabase.from('club_memberships').insert({ club_id: clubId, user_id: request.user_id });
        try { await supabase.rpc('increment_members', { club_id_input: clubId }); } catch(e){}
      }

      const notif = {
        user_id: request.user_id,
        icon: '✅',
        title: 'Join Request Accepted!',
        text: `Your request to join "${clubName}" has been accepted. Welcome aboard! 🎉`,
        unread: true,
      };
      const { data: notifData } = await supabase.from('notifications').insert(notif).select().single();
      pushToUser(request.user_id, 'notification', {
        id: notifData?.id, icon: '✅', title: 'Join Request Accepted!',
        text: notif.text, unread: true
      });
      pushToUser(request.user_id, 'membership_changed', { clubId, joined: true, chatId });
      invalidateClubsCache();
    pushToAll('clubs_updated', { clubId });

    } else {
      const notif = {
        user_id: request.user_id,
        icon: '❌',
        title: 'Join Request Rejected',
        text: `Your request to join "${clubName}" was not accepted at this time.`,
        unread: true,
      };
      const { data: notifData } = await supabase.from('notifications').insert(notif).select().single();
      pushToUser(request.user_id, 'notification', {
        id: notifData?.id, icon: '❌', title: 'Join Request Rejected',
        text: notif.text, unread: true
      });
      pushToUser(request.user_id, 'join_request_updated', { clubId, status: 'rejected' });
    }

    pushToUser(req.user.id, 'request_handled', { requestId: parseInt(req.params.requestId), clubId, action });
    return res.json({ success: true, status: newStatus });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// EVENT POSTS (executive posting event updates with payment info)
// ══════════════════════════════════════════════════════════════════════════════

// ── POST /api/executive/clubs/:id/posts — Create event post ───────────────
router.post('/clubs/:id/posts', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const { eventId, title, body, price, accountNumber, accountName, paymentDeadline } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'title and body are required' });

    const { data: post, error } = await supabase
      .from('event_posts')
      .insert({
        club_id:          parseInt(req.params.id),
        event_id:         eventId || null,
        author_id:        req.user.id,
        author_name:      `${req.user.firstName} ${req.user.lastName}`,
        title,
        body,
        price:            price || 0,
        account_number:   accountNumber || '',
        account_name:     accountName || '',
        payment_deadline: paymentDeadline || '',
      })
      .select()
      .single();

    if (error) throw error;

    // Notify all club members
    const { data: members } = await supabase
      .from('club_memberships')
      .select('user_id')
      .eq('club_id', req.params.id);

    const { data: club } = await supabase.from('clubs').select('name').eq('id', req.params.id).single();

    if (members && members.length > 0) {
      const notifs = members.map(m => ({
        user_id: m.user_id,
        icon: '📣',
        title: `New Update: ${title}`,
        text: `${club?.name || 'Club'}: ${body.length > 80 ? body.slice(0, 80) + '...' : body}`,
        unread: true,
      }));
      const { data: notifRows } = await supabase.from('notifications').insert(notifs).select();

      // Real-time push to each member
      members.forEach((m, idx) => {
        const n = notifRows?.[idx];
        pushToUser(m.user_id, 'notification', {
          id: n?.id, icon: '📣',
          title: `New Update: ${title}`,
          text: `${club?.name || 'Club'}: ${body.length > 80 ? body.slice(0, 80) + '...' : body}`,
          unread: true
        });
        // Also push the post itself
        pushToUser(m.user_id, 'event_post', { clubId: parseInt(req.params.id), post });
      });
    }

    return res.status(201).json({ success: true, post });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create post' });
  }
});

// ── GET /api/executive/clubs/:id/posts — Get club posts ───────────────────
router.get('/clubs/:id/posts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_posts')
      .select('*')
      .eq('club_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// USER PROFILE VIEW (for members viewing each other)
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/executive/user/:userId/profile — View any user profile ────────
router.get('/user/:userId/profile', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, student_id, bio, university, campus, department, program, year, semester, linkedin, github, interests, avatar_url, role, exec_club, exec_role')
      .eq('id', req.params.userId)
      .single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// APPLICATIONS (position applications for exec's club)
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/executive/clubs/:id/applications ─────────────────────────────
router.get('/clubs/:id/applications', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    // Get all position IDs for this club first
    const { data: posList } = await supabase
      .from('positions')
      .select('id')
      .eq('club_id', req.params.id);

    if (!posList || posList.length === 0) return res.json([]);
    const posIds = posList.map(p => p.id);

    const { data, error } = await supabase
      .from('applications')
      .select('id, status, why, experience, interview_msg, created_at, position_id, positions(id, position, type, deadline), users(id, first_name, last_name, email, student_id, avatar_url, department, year)')
      .in('position_id', posIds)
      .not('status', 'in', '("Final Decision","Rejected")')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ── PUT /api/executive/clubs/:clubId/applications/:appId ──────────────────
router.put('/clubs/:clubId/applications/:appId', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.clubId))) return;
  try {
    const { action, interviewMsg } = req.body;
    if (!['interview', 'accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be interview, accept, or reject' });
    }
    const { data: app } = await supabase
      .from('applications')
      .select('*, positions(id, position, club_id, club_name)')
      .eq('id', req.params.appId)
      .single();
    if (!app) return res.status(404).json({ error: 'Application not found' });

    const { data: club } = await supabase.from('clubs').select('name, chat_id').eq('id', req.params.clubId).single();
    let updateData = {};

    if (action === 'interview') {
      if (!interviewMsg?.trim()) return res.status(400).json({ error: 'Interview details required' });
      updateData = { status: 'Interview', interview_msg: interviewMsg.trim() };
      await supabase.from('applications').update(updateData).eq('id', req.params.appId);
      const txt = `Your application for "${app.positions?.position}" has moved to the Interview stage. Tap for details.`;
      const { data: n } = await supabase.from('notifications').insert({ user_id: app.user_id, icon: '📅', title: 'Interview Scheduled!', text: txt, unread: true }).select().single();
      pushToUser(app.user_id, 'notification', { id: n?.id, icon: '📅', title: 'Interview Scheduled!', text: txt, unread: true });
      pushToUser(app.user_id, 'application_updated', { positionId: app.position_id, status: 'Interview', interviewMsg: interviewMsg.trim() });

    } else if (action === 'accept') {
      await supabase.from('applications').update({ status: 'Final Decision' }).eq('id', req.params.appId);
      // Add to club members
      const { data: existing } = await supabase.from('club_memberships').select('id').eq('club_id', req.params.clubId).eq('user_id', app.user_id).single();
      if (!existing) {
        await supabase.from('club_memberships').insert({ club_id: parseInt(req.params.clubId), user_id: app.user_id });
        try { await supabase.rpc('increment_members', { club_id_input: parseInt(req.params.clubId) }); } catch(e) {}
      }
      const txt = `Congratulations! Your application for "${app.positions?.position}" at ${club?.name} has been accepted! Welcome aboard! 🎉`;
      const { data: n } = await supabase.from('notifications').insert({ user_id: app.user_id, icon: '✅', title: 'Application Accepted!', text: txt, unread: true }).select().single();
      pushToUser(app.user_id, 'notification', { id: n?.id, icon: '✅', title: 'Application Accepted!', text: txt, unread: true });
      pushToUser(app.user_id, 'membership_changed', { clubId: parseInt(req.params.clubId), joined: true, chatId: club?.chat_id });
      pushToUser(app.user_id, 'application_updated', { positionId: app.position_id, status: 'Final Decision' });
      invalidateClubsCache();
    pushToAll('clubs_updated', { clubId: parseInt(req.params.clubId) });

    } else {
      await supabase.from('applications').update({ status: 'Rejected' }).eq('id', req.params.appId);
      const txt = `Your application for "${app.positions?.position}" was not accepted at this time.`;
      const { data: n } = await supabase.from('notifications').insert({ user_id: app.user_id, icon: '❌', title: 'Application Update', text: txt, unread: true }).select().single();
      pushToUser(app.user_id, 'notification', { id: n?.id, icon: '❌', title: 'Application Update', text: txt, unread: true });
      pushToUser(app.user_id, 'application_updated', { positionId: app.position_id, status: 'Rejected' });
    }

    pushToUser(req.user.id, 'application_handled', { applicationId: parseInt(req.params.appId), clubId: parseInt(req.params.clubId), action });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update application' });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// POSITIONS (executive creates/manages positions for their club)
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /api/executive/clubs/:id/positions — List positions for this club ───
router.get('/clubs/:id/positions', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('club_id', req.params.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// ── POST /api/executive/clubs/:id/positions — Create a position ─────────────
router.post('/clubs/:id/positions', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    const { position, type, deadline, description, requirements } = req.body;
    if (!position || !type || !deadline) {
      return res.status(400).json({ error: 'position, type, and deadline are required' });
    }
    const { data: club } = await supabase.from('clubs').select('name').eq('id', req.params.id).single();
    const { data, error } = await supabase
      .from('positions')
      .insert({
        club_id:      parseInt(req.params.id),
        club_name:    club?.name || '',
        position,
        type,
        deadline,
        description:  description || '',
        requirements: requirements || [],
        status:       'open',
      })
      .select()
      .single();
    if (error) throw error;
    // Notify all users so recruitment page refreshes
    pushToAll('positions_updated', { clubId: parseInt(req.params.id) });
    return res.status(201).json({ success: true, position: data });
  } catch (err) {
    console.error('Create position error:', err);
    return res.status(500).json({ error: 'Failed to create position' });
  }
});

// ── DELETE /api/executive/clubs/:id/positions/:posId — Close a position ─────
router.delete('/clubs/:id/positions/:posId', async (req, res) => {
  if (!requireExec(req, res)) return;
  if (!(await requireClubOwner(req, res, req.params.id))) return;
  try {
    await supabase.from('positions').update({ status: 'closed' }).eq('id', req.params.posId);
    pushToAll('positions_updated', { clubId: parseInt(req.params.id) });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to close position' });
  }
});

module.exports = router;

