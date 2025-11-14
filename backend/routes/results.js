// backend/routes/results.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import InternalMark from '../models/InternalMark.js';
import ResultPdf from '../models/ResultPDF.js';
import Student from '../models/Student.js';
import { requireAuth, requireRole } from '../middleware/auth.js'; // যদি তুমি auth middleware ব্যবহার করো

const router = Router();

// multer setup (uploads/results)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'backend', 'uploads', 'results')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now().toString(16) + '-' + Math.random().toString(16).slice(2,8);
    cb(null, name + ext);
  }
});
const upload = multer({ storage });

// POST /api/results/upload   (admin/teacher uploads semester pdf for a student)
// expects multipart/form-data: file, student (studentId), semester (optional)
router.post('/upload', requireAuth, requireRole('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const studentId = req.body.student;
    if (!studentId) return res.status(400).json({ error: 'student field required' });

    // ensure student exists
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const rp = await ResultPdf.create({
      student: studentId,
      semester: req.body.semester ? Number(req.body.semester) : undefined,
      filePath: `/uploads/results/${req.file.filename}`,
      note: req.body.note || ''
    });

    res.json(rp);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/results/internal   (admin/teacher add/update internal mark for a course-student)
router.post('/internal', requireAuth, requireRole('teacher'), async (req, res) => {
  try {
    const { course, student, marks } = req.body;
    if (!course || !student || typeof marks === 'undefined') {
      return res.status(400).json({ error: 'course, student and marks are required' });
    }
    const payload = { course, student, marks: Number(marks) };

    // upsert: update if exists else create
    const existing = await InternalMark.findOne({ course, student });
    if (existing) {
      existing.marks = payload.marks;
      await existing.save();
      return res.json(existing);
    } else {
      const im = await InternalMark.create(payload);
      return res.json(im);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/results/mine   -> student view their internal marks and result pdfs
router.get('/mine', requireAuth, async (req, res) => {
  try {
    // find student record linked to this user (by user id or email)
    const userId = req.user?.sub;
    let student = await Student.findOne({ user: userId });
    if (!student && req.user?.email) {
      student = await Student.findOne({ email: req.user.email });
    }
    if (!student) return res.status(404).json({ error: 'Student record not found for this user' });

    const marks = await InternalMark.find({ student: student._id }).populate('course');
    const pdfs = await ResultPdf.find({ student: student._id });

    res.json({ student, marks, pdfs });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// optional: GET /api/results/:studentId/pdfs  and /results/:studentId/marks  (admin)
router.get('/:studentId/pdfs', requireAuth, requireRole('admin'), async (req, res) => {
  const pdfs = await ResultPdf.find({ student: req.params.studentId });
  res.json(pdfs);
});

router.get('/:studentId/marks', requireAuth, requireRole('admin'), async (req, res) => {
  const marks = await InternalMark.find({ student: req.params.studentId }).populate('course');
  res.json(marks);
});

export default router;
