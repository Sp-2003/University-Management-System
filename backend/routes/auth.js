import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const ALLOWED_REQ_ROLES = ['teacher','student'];

const norm = s => String(s || '').trim();
const normEmail = e => norm(e).toLowerCase();

// POST /api/auth/register  (public)
// Body: { name, email, password, institutionalId, requestedRole: 'teacher'|'student' }
router.post('/register', async (req, res) => {
  try {
    let { name, email, password, institutionalId, requestedRole } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    email = normEmail(email);
    requestedRole = ALLOWED_REQ_ROLES.includes(requestedRole) ? requestedRole : 'student';

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: norm(name),
      email,
      passwordHash,
      institutionalId: norm(institutionalId),
      requestedRole,
      // New accounts wait for admin approval
      status: 'pending',
      role: 'student' // final role set on approval
    });

    return res.json({
      id: user._id,
      email: user.email,
      status: user.status,
      message: 'Registered successfully. Please wait for admin approval.'
    });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// POST /api/auth/login  (public)
router.post('/login', async (req, res) => {
  const email = normEmail(req.body.email);
  const password = req.body.password;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  if (user.status !== 'approved') {
    return res.status(403).json({
      error: user.status === 'pending'
        ? 'Account pending approval by admin'
        : `Login blocked: ${user.rejectionReason || 'account rejected'}`
    });
  }

  const token = jwt.sign(
    { sub: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: '7d' }
  );

  return res.json({
    token,
    user: { id: user._id, name: user.name, role: user.role, email: user.email }
  });
});

// GET /api/auth/me (auth)
router.get('/me', requireAuth, async (req, res) => {
  const u = await User.findById(req.user.sub).select('_id name email role status requestedRole institutionalId createdAt');
  if (!u) return res.status(404).json({ error: 'User not found' });
  return res.json(u);
});

// ADMIN BULK from Students remains (optional)
router.post('/provision-from-students', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const defaultPassword = String(req.body?.defaultPassword || 'stud123');

    const students = await Student.find({ email: { $exists: true, $ne: '' } })
      .select('name email')
      .lean();

    const created = [];
    for (const s of students) {
      const email = normEmail(s.email);
      if (!email) continue;

      const exists = await User.findOne({ email });
      if (exists) continue;

      const passwordHash = await User.hashPassword(defaultPassword);
      const u = await User.create({
        name: norm(s.name || 'Student'),
        email,
        role: 'student',
        requestedRole: 'student',
        status: 'approved', // bulk-provision approves directly
        passwordHash
      });
      created.push({ userId: u._id, email: u.email, name: u.name });
    }

    return res.json({ createdCount: created.length, created });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

export default router;
