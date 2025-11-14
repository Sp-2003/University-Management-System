// backend/routes/enrollments.js
import { Router } from 'express';
import mongoose from 'mongoose';
import Enrollment from '../models/Enrollment.js';
import Student from '../models/Student.js';
import Course from '../models/Course.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// helper: is valid ObjectId
const isId = (v) => mongoose.Types.ObjectId.isValid(String(v || ''));

/**
 * GET /api/enrollments
 * - admin/teacher: returns all enrollments
 * - student: returns only enrollments for the logged-in student
 */
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      // find Student doc linked to this user
      const student = await Student.findOne({ user: req.user.sub });
      if (!student) return res.status(404).json({ error: 'Student profile not found for this user' });
      query.student = student._id;
    }
    const items = await Enrollment.find(query)
      .populate({ path: 'student', select: 'name regNo email department semester' })
      .populate({ path: 'course', select: 'title code credits department' })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(items);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/enrollments
 * Body: { student: <studentId>, course: <courseId> }
 * Only admin/teacher allowed.
 */
router.post('/', async (req, res) => {
  try {
    if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
      return res.status(403).json({ error: 'Only admin or teacher can enroll students' });
    }

    const { student, course } = req.body;
    if (!student || !course) return res.status(400).json({ error: 'student and course are required' });
    if (!isId(student) || !isId(course)) return res.status(400).json({ error: 'Invalid student or course id' });

    const studentDoc = await Student.findById(student);
    if (!studentDoc) return res.status(404).json({ error: 'Student not found' });

    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ error: 'Course not found' });

    // Prevent duplicate enrollment for same student-course
    const existing = await Enrollment.findOne({ student: studentDoc._id, course: courseDoc._id });
    if (existing) return res.status(400).json({ error: 'Student already enrolled in this course' });

    const created = await Enrollment.create({ student: studentDoc._id, course: courseDoc._id });
    const populated = await Enrollment.findById(created._id)
      .populate({ path: 'student', select: 'name regNo email department semester' })
      .populate({ path: 'course', select: 'title code credits department' });

    return res.status(201).json(populated);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

/**
 * PUT /api/enrollments/:id
 * Body: fields to update like { grade: 'A' }
 * Only admin/teacher allowed.
 */
router.put('/:id', async (req, res) => {
  try {
    if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
      return res.status(403).json({ error: 'Only admin or teacher can modify enrollments' });
    }
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: 'Invalid enrollment id' });

    const updated = await Enrollment.findByIdAndUpdate(id, req.body, { new: true })
      .populate({ path: 'student', select: 'name regNo email department semester' })
      .populate({ path: 'course', select: 'title code credits department' });

    if (!updated) return res.status(404).json({ error: 'Enrollment not found' });
    return res.json(updated);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

/**
 * DELETE /api/enrollments/:id
 * Only admin/teacher allowed.
 */
router.delete('/:id', async (req, res) => {
  try {
    if (!(req.user.role === 'admin' || req.user.role === 'teacher')) {
      return res.status(403).json({ error: 'Only admin or teacher can delete enrollments' });
    }
    const { id } = req.params;
    if (!isId(id)) return res.status(400).json({ error: 'Invalid enrollment id' });

    const doc = await Enrollment.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ error: 'Enrollment not found' });

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;

