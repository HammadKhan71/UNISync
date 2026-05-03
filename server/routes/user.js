// ── User Routes (protected) ───────────────────────────────────────────────
const express = require('express');
const supabase = require('../supabase');
const authMiddleware = require('../middleware/auth');
const { pushToUser, pushToAll } = require('./realtime');


const router = express.Router();

// All routes require auth
router.use(authMiddleware);

// ── GET /api/user/profile ─────────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id,email,role,first_name,last_name,student_id,phone,bio,university,campus,department,program,year,semester,linkedin,github,interests,avatar_url,exec_club,exec_role')
      .eq('id', req.user.id)
      .single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ── PUT /api/user/profile ─────────────────────────────────────────────────
router.put('/profile', async (req, res) => {
  try {
    const { firstName, lastName, studentId, phone, bio, university, campus, department, program, year, semester, linkedin, github, interests } = req.body;
    const updates = {};
    if (firstName !== undefined) updates.first_name = firstName;
    if (lastName !== undefined) updates.last_name = lastName;
    if (studentId !== undefined) updates.student_id = studentId;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (university !== undefined) updates.university = university;
    if (campus !== undefined) updates.campus = campus;
    if (department !== undefined) updates.department = department;
    if (program !== undefined) updates.program = program;
    if (year !== undefined) updates.year = year;
    if (semester !== undefined) updates.semester = semester;
    if (linkedin !== undefined) updates.linkedin = linkedin;
    if (github !== undefined) updates.github = github;
    if (interests !== undefined) updates.interests = interests;

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) throw error;
    return res.json({ success: true, user: data });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── POST /api/user/rsvp ───────────────────────────────────────────────────
router.post('/rsvp', async (req, res) => {
  try {
    const { eventId, paid } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    const ticketId = 'US-' + String(eventId).padStart(3, '0') + '-' +
      Math.random().toString(36).substr(2, 6).toUpperCase();

    // Upsert — if already RSVPd, do nothing
    const { data, error } = await supabase
      .from('rsvps')
      .upsert({ user_id: req.user.id, event_id: eventId, ticket_id: ticketId, paid: !!paid },
        { onConflict: 'user_id,event_id' })
      .select()
      .single();
    if (error) throw error;

    // Fetch event details for the in-app notification
    const { data: ev } = await supabase
      .from('events').select('name').eq('id', eventId).single();

    // In-app notification
    await supabase.from('notifications').insert({
      user_id: req.user.id, icon: '✅',
      title: 'Registration Confirmed',
      text: `You have successfully registered for ${ev?.name || 'an event'}. Your ticket ID is ${data.ticket_id}.`,
      unread: true
    });

    return res.json({ success: true, ticketId: data.ticket_id });
  } catch (err) {
    console.error('RSVP error:', err);
    return res.status(500).json({ error: 'Failed to RSVP' });
  }
});

// ── GET /api/user/rsvps ───────────────────────────────────────────────────
router.get('/rsvps', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('rsvps')
      .select('event_id, ticket_id, paid, created_at')
      .eq('user_id', req.user.id);
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch RSVPs' });
  }
});

// ── POST /api/user/save-event ─────────────────────────────────────────────
router.post('/save-event', async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: 'eventId is required' });

    // Check if already saved
    const { data: existing } = await supabase
      .from('saved_events')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('event_id', eventId)
      .single();

    if (existing) {
      // Unsave
      await supabase.from('saved_events').delete()
        .eq('user_id', req.user.id).eq('event_id', eventId);
      return res.json({ saved: false });
    } else {
      // Save
      await supabase.from('saved_events').insert({ user_id: req.user.id, event_id: eventId });
      return res.json({ saved: true });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle saved event' });
  }
});

// ── GET /api/user/saved-events ────────────────────────────────────────────
router.get('/saved-events', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('saved_events')
      .select('event_id')
      .eq('user_id', req.user.id);
    if (error) throw error;
    return res.json(data.map(r => r.event_id));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch saved events' });
  }
});

// ── POST /api/user/join-club ──────────────────────────────────────────────
router.post('/join-club', async (req, res) => {
  try {
    const { clubId } = req.body;
    if (!clubId) return res.status(400).json({ error: 'clubId is required' });

    const { data: existing } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('club_id', clubId)
      .single();

    if (existing) {
      // Leave club
      await supabase.from('club_memberships').delete()
        .eq('user_id', req.user.id).eq('club_id', clubId);
      // Decrement members count
      try { await supabase.rpc('decrement_members', { club_id_input: clubId }); } catch (e) { }
      return res.json({ joined: false });
    } else {
      // Join club
      await supabase.from('club_memberships').insert({ user_id: req.user.id, club_id: clubId });
      // Increment members count
      try { await supabase.rpc('increment_members', { club_id_input: clubId }); } catch (e) { }
      return res.json({ joined: true });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle club membership' });
  }
});

// ── GET /api/user/memberships ─────────────────────────────────────────────
router.get('/memberships', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('club_memberships')
      .select('club_id')
      .eq('user_id', req.user.id);
    if (error) throw error;
    return res.json(data.map(r => r.club_id));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch memberships' });
  }
});

// ── POST /api/user/apply ──────────────────────────────────────────────────
router.post('/apply', async (req, res) => {
  try {
    const { positionId, why, experience } = req.body;
    if (!positionId) return res.status(400).json({ error: 'positionId is required' });

    const { data, error } = await supabase
      .from('applications')
      .upsert({
        user_id: req.user.id,
        position_id: positionId,
        why: why || '',
        experience: experience || '',
        status: 'Under Review'
      }, { onConflict: 'user_id,position_id' })
      .select()
      .single();
    if (error) throw error;

    // Get position + club details
    const { data: pos } = await supabase.from('positions').select('position, club_name, club_id').eq('id', positionId).single();

    // Notify the student
    const studentText = `Your application for ${pos?.position || 'a position'} at ${pos?.club_name || ''} is under review.`;
    const { data: sNotif } = await supabase.from('notifications').insert({
      user_id: req.user.id, icon: '📋', title: 'Application Submitted',
      text: studentText, unread: true
    }).select().single();
    pushToUser(req.user.id, 'notification', { id: sNotif?.id, icon: '📋', title: 'Application Submitted', text: studentText, unread: true });

    // Notify the club executive
    if (pos?.club_id) {
      const { data: club } = await supabase.from('clubs').select('executive_id, name').eq('id', pos.club_id).single();
      if (club?.executive_id) {
        const { data: applicant } = await supabase.from('users').select('first_name, last_name, avatar_url').eq('id', req.user.id).single();
        const execText = `${applicant?.first_name || 'A student'} ${applicant?.last_name || ''} applied for "${pos.position}" in ${club.name}.`;
        const { data: eNotif } = await supabase.from('notifications').insert({
          user_id: club.executive_id, icon: '📝', title: 'New Position Application',
          text: execText, unread: true
        }).select().single();
        pushToUser(club.executive_id, 'notification', { id: eNotif?.id, icon: '📝', title: 'New Position Application', text: execText, unread: true });
        pushToUser(club.executive_id, 'new_application', {
          clubId: pos.club_id, applicationId: data.id, positionId,
          positionName: pos.position,
          applicantName: `${applicant?.first_name || ''} ${applicant?.last_name || ''}`.trim(),
          applicantAvatar: applicant?.avatar_url || '',
        });
      }
    }

    return res.status(201).json({ success: true, application: data });
  } catch (err) {
    console.error('Apply error:', err);
    return res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ── GET /api/user/applications ────────────────────────────────────────────
router.get('/applications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('position_id, status, created_at')
      .eq('user_id', req.user.id);
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ── GET /api/user/notifications ───────────────────────────────────────────
router.get('/notifications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── POST /api/user/notifications/read ────────────────────────────────────
router.post('/notifications/read', async (req, res) => {
  try {
    const { notifId } = req.body;
    if (notifId) {
      await supabase.from('notifications').update({ unread: false })
        .eq('id', notifId).eq('user_id', req.user.id);
    } else {
      // Mark all as read
      await supabase.from('notifications').update({ unread: false })
        .eq('user_id', req.user.id);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// ── PUT /api/user/avatar — Update avatar URL ──────────────────────────────
// (We store a base64 data URL or an external image URL)
router.put('/avatar', async (req, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) return res.status(400).json({ error: 'avatarUrl is required' });

    const { error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', req.user.id);
    if (error) throw error;

    // Push avatar update via SSE so other open tabs/sessions update immediately
    pushToUser(req.user.id, 'avatar_updated', { userId: req.user.id, avatarUrl });
    // Push to all so chat rooms update avatars
    pushToAll('user_avatar_updated', { userId: req.user.id, avatarUrl });

    return res.json({ success: true, avatarUrl });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update avatar' });
  }
});

// ── POST /api/user/request-join — Request to join a club ─────────────────
router.post('/request-join', async (req, res) => {
  try {
    const { clubId, message } = req.body;
    if (!clubId) return res.status(400).json({ error: 'clubId is required' });

    // Check if already a member
    const { data: existing } = await supabase
      .from('club_memberships')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', req.user.id)
      .single();
    if (existing) return res.status(409).json({ error: 'You are already a member of this club' });

    // Check if request already pending
    const { data: pending } = await supabase
      .from('club_join_requests')
      .select('id, status')
      .eq('club_id', clubId)
      .eq('user_id', req.user.id)
      .single();

    if (pending) {
      if (pending.status === 'pending') return res.status(409).json({ error: 'You already have a pending request for this club' });
      // If rejected before, allow re-request by updating
      const { error: updErr } = await supabase
        .from('club_join_requests')
        .update({ status: 'pending', message: message || '' })
        .eq('id', pending.id);
      if (updErr) throw updErr;
    } else {
      const { error: insErr } = await supabase.from('club_join_requests').insert({
        club_id: clubId,
        user_id: req.user.id,
        message: message || '',
        status: 'pending',
      });
      if (insErr) throw insErr;
    }

    // Notify the executive of the club
    const { data: club } = await supabase
      .from('clubs')
      .select('name, executive_id')
      .eq('id', clubId)
      .single();

    if (club && club.executive_id) {
      const { data: requester } = await supabase
        .from('users')
        .select('first_name, last_name, avatar_url')
        .eq('id', req.user.id)
        .single();

      const execNotifText = `${requester?.first_name || 'A student'} ${requester?.last_name || ''} wants to join "${club.name}".`;
      const { data: execNotif } = await supabase.from('notifications').insert({
        user_id: club.executive_id,
        icon: '🙋',
        title: 'New Join Request',
        text: execNotifText,
        unread: true,
      }).select().single();

      // Real-time push to executive
      pushToUser(club.executive_id, 'notification', {
        id: execNotif?.id, icon: '🙋', title: 'New Join Request',
        text: execNotifText, unread: true
      });
      // Push new_join_request so exec dashboard panel can refresh
      pushToUser(club.executive_id, 'new_join_request', {
        clubId,
        requesterId: req.user.id,
        requesterName: `${requester?.first_name || ''} ${requester?.last_name || ''}`.trim(),
        requesterAvatar: requester?.avatar_url || ''
      });
    }

    // Notify the user
    const { data: userNotif } = await supabase.from('notifications').insert({
      user_id: req.user.id,
      icon: '⏳',
      title: 'Join Request Sent',
      text: `Your request to join "${club?.name || 'the club'}" is pending review.`,
      unread: true,
    }).select().single();

    pushToUser(req.user.id, 'notification', {
      id: userNotif?.id, icon: '⏳', title: 'Join Request Sent',
      text: `Your request to join "${club?.name || 'the club'}" is pending review.`, unread: true
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Join request error:', err);
    return res.status(500).json({ error: 'Failed to send join request' });
  }
});

// ── GET /api/user/join-requests — Get user's join request statuses ─────────
router.get('/join-requests', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('club_join_requests')
      .select('id, club_id, status, message, interview_msg, created_at')
      .eq('user_id', req.user.id);
    if (error) throw error;
    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch join requests' });
  }
});

// ── GET /api/user/:userId/public — Public profile view ───────────────────
router.get('/:userId/public', async (req, res) => {
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

module.exports = router;

