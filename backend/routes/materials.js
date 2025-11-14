// backend/routes/materials.js
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth } from '../middleware/auth.js';
import Course from '../models/Course.js';
import Material from '../models/Material.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g,'_');
    cb(null, safeName);
  }
});
const upload = multer({ storage });

// GET list materials for a course
router.get('/:courseId', requireAuth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const materials = await Material.find({ course: courseId }).sort({ createdAt: -1 }).lean();
    res.json(materials);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST add material (supports file OR url/text)
// only teacher/admin allowed
router.post('/:courseId', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const role = req.user?.role;
    if (!(role === 'teacher' || role === 'admin')) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }

    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const { title, type, url, note } = req.body;

    const material = {
      course: courseId,
      title: title || (req.file ? req.file.originalname : 'Material'),
      note: note || '',
      type: type || (req.file ? 'file' : (url ? 'link' : 'text')),
      url: url || null,
      filePath: null
    };

    if (req.file) {
      material.filePath = `/uploads/${req.file.filename}`;
      if (!material.url) material.url = material.filePath;
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') material.type = 'pdf';
      else if (['.png','.jpg','.jpeg','.gif'].includes(ext)) material.type = 'image';
      else material.type = 'file';
    }

    const m = await Material.create(material);
    res.status(201).json(m);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
