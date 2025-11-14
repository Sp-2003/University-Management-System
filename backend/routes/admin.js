// backend/routes/admin.js
import { Router } from 'express';
import User from '../models/User.js';
import Student from '../models/Student.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

// GET /api/admin/users?status=pending|approved|rejected
router.get('/users', async (req, res) => {
  try {
    const { status } = req.query;
    const q = status ? { status } : {};
    const users = await User.find(q)
      .select('_id name email role requestedRole status institutionalId createdAt')
      .sort({ createdAt: -1 });
    return res.json(users);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * PUT /api/admin/users/:id/approve
 * Body (optional): { role?: 'student'|'teacher', department?, semester?, regNo? }
 * - sets user.status = 'approved'
 * - sets user.role to provided role or requestedRole
 * - if final role is 'student' -> create or link Student document
 */
router.put('/users/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { role, department, semester, regNo } = req.body;

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Set final role (admin can override)
    user.role = role || user.requestedRole || 'student';
    user.status = 'approved';
    user.rejectionReason = '';
    await user.save();

    let studentDoc = null;

    // If final role is student, ensure a Student document exists & link it
    if (user.role === 'student') {
      // try to find existing student by email or regNo(institutionalId) or provided regNo
      const regCandidates = [user.institutionalId, regNo].filter(Boolean);
      const findQuery = {
        $or: [{ email: user.email }]
      };
      if (regCandidates.length) {
        findQuery.$or.push(...regCandidates.map(r => ({ regNo: r })));
      }

      studentDoc = await Student.findOne(findQuery);

      if (!studentDoc) {
        // create new student
        studentDoc = await Student.create({
          regNo: regNo || user.institutionalId || undefined,
          name: user.name,
          email: user.email,
          department: department || '',
          semester: Number(semester) || 1,
          user: user._id
        });
      } else {
        // update/link existing student if needed
        let changed = false;
        if (!studentDoc.user) { studentDoc.user = user._id; changed = true; }
        if (!studentDoc.email && user.email) { studentDoc.email = user.email; changed = true; }
        if (!studentDoc.name && user.name) { studentDoc.name = user.name; changed = true; }
        if (!studentDoc.regNo && (regNo || user.institutionalId)) { studentDoc.regNo = regNo || user.institutionalId; changed = true; }
        if (department && !studentDoc.department) { studentDoc.department = department; changed = true; }
        if (semester && !studentDoc.semester) { studentDoc.semester = Number(semester); changed = true; }
        if (changed) await studentDoc.save();
      }
    }

    return res.json({
      ok: true,
      user: { id: user._id, email: user.email, role: user.role, status: user.status },
      student: studentDoc ? {
        id: studentDoc._id,
        regNo: studentDoc.regNo,
        name: studentDoc.name,
        email: studentDoc.email,
        department: studentDoc.department,
        semester: studentDoc.semester
      } : null
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * PUT /api/admin/users/:id/reject
 * Body: { reason?: string }
 */
router.put('/users/:id/reject', async (req, res) => {
  const { id } = req.params;
  const reason = String(req.body?.reason || 'Not approved');

  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.status = 'rejected';
    user.rejectionReason = reason;
    await user.save();

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
