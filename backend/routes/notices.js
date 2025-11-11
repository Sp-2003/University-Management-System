import { Router } from 'express';
import Notice from '../models/Notice.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All notice routes require a valid JWT
router.use(requireAuth);

// GET /api/notices  -> latest first (limit 50)
router.get('/', async (req, res) => {
  try {
    const items = await Notice.find().sort({ createdAt: -1 }).limit(50);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/notices  -> admin/teacher only
router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { title, body, audience = 'all', publishedAt } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const item = await Notice.create({
      title: title.trim(),
      body: body.trim(),
      audience,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      createdBy: req.user?.sub || null,
    });

    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/notices/:id  -> admin/teacher only
router.put('/:id', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { title, body, audience, publishedAt } = req.body;
    const update = {};
    if (title !== undefined) update.title = String(title).trim();
    if (body !== undefined) update.body = String(body).trim();
    if (audience !== undefined) update.audience = audience;
    if (publishedAt) update.publishedAt = new Date(publishedAt);

    const item = await Notice.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ error: 'Notice not found' });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE /api/notices/:id  -> admin/teacher only
router.delete('/:id', requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const deleted = await Notice.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Notice not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
