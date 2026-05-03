// ── Auth Routes: Register & Login (Plaintext passwords) ────────────────────
const express        = require('express');
const jwt            = require('jsonwebtoken');
const supabase       = require('../supabase');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Helper: sign JWT
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role,
      firstName: user.first_name, lastName: user.last_name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, studentId, role, execClub, execRole,
            phone, campus, department, program, year, semester, bio } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Enforce university email (campus specific like @isb.nu.edu.pk)
    if (!email.toLowerCase().endsWith('.nu.edu.pk')) {
      return res.status(400).json({ error: 'Only @<campus>.nu.edu.pk email addresses are allowed (e.g. @isb.nu.edu.pk)' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email:      email.toLowerCase(),
        password:   hashedPassword,
        role:       role || 'student',
        first_name: firstName,
        last_name:  lastName,
        student_id: studentId || '',
        exec_club:  execClub || '',
        exec_role:  execRole || '',
        phone:      phone || '',
        campus:     campus || 'Islamabad',
        department: department || '',
        program:    program || '',
        year:       year || '',
        semester:   semester || '',
        bio:        bio || '',
      })
      .select()
      .single();

    if (error) throw error;

    // Add default notifications for new user
    await supabase.from('notifications').insert([
      { user_id: newUser.id, icon: '🎉', title: 'Welcome to UniSync!',
        text: `Hey ${firstName}! Your account is ready. Explore clubs and events.`, unread: true },
    ]);

    const token = signToken(newUser);
    return res.status(201).json({
      token,
      user: {
        id: newUser.id, email: newUser.email, role: newUser.role,
        firstName: newUser.first_name, lastName: newUser.last_name,
        studentId: newUser.student_id, avatarUrl: newUser.avatar_url || ''
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Enforce university email on login too
    if (!email.toLowerCase().endsWith('.nu.edu.pk')) {
      return res.status(400).json({ error: 'Only @<campus>.nu.edu.pk email addresses are allowed' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'No account found with this email' });
    }

    // Compare password (handle both plaintext and bcrypt hashes)
    let valid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      const bcrypt = require('bcryptjs');
      valid = await bcrypt.compare(password, user.password);
    } else {
      valid = (password === user.password);
    }
    
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id:         user.id,
        email:      user.email,
        role:       user.role,
        firstName:  user.first_name,
        lastName:   user.last_name,
        studentId:  user.student_id,
        phone:      user.phone,
        bio:        user.bio,
        university: user.university,
        campus:     user.campus,
        department: user.department,
        program:    user.program,
        year:       user.year,
        semester:   user.semester,
        linkedin:   user.linkedin,
        github:     user.github,
        interests:  user.interests || [],
        avatarUrl:  user.avatar_url || ''
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});


// ── PUT /api/auth/change-password ─────────────────────────────────────────
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    // Fetch user to verify current password
    const { data: user, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', req.user.id)
      .single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    // Verify current password (support both plaintext and bcrypt)
    let valid = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      const bcrypt = require('bcryptjs');
      valid = await bcrypt.compare(currentPassword, user.password);
    } else {
      valid = (currentPassword === user.password);
    }
    
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    const { error: updErr } = await supabase
      .from('users')
      .update({ password: hashedNewPassword })
      .eq('id', req.user.id);
    if (updErr) throw updErr;
    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
