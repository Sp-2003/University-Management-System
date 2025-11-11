import { Router } from 'express';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users?status=pending|approved|rejected
router.get('/users', async (req, res) => {
  const { status } = req.query;
  const q = status ? { status } : {};
  const users = await User.find(q).select('_id name email role requestedRole status institutionalId createdAt');
  res.json(users);
});

// PUT /api/admin/users/:id/approve  Body: { role? }
router.put('/users/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { role } = req.body; // admin can override requestedRole
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.role = role || user.requestedRole || 'student';
  user.status = 'approved';
  user.rejectionReason = '';
  await user.save();

  res.json({ ok: true, user: { id: user._id, email: user.email, role: user.role, status: user.status } });
});

// PUT /api/admin/users/:id/reject  Body: { reason }
router.put('/users/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.status = 'rejected';
  user.rejectionReason = String(reason || 'Not approved');
  await user.save();

  res.json({ ok: true });
});

export default router;
