import { Router } from 'express';
import Notice from '../models/Notice.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

// GET latest 50
router.get('/', async (req, res) => {
  const items = await Notice.find().sort({ createdAt: -1 }).limit(50);
  res.json(items);
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { title, body, audience = 'all', publishedAt } = req.body;
    const item = await Notice.create({
      title, body, audience,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      createdBy: req.user?.sub || null
    });
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { title, body, audience, publishedAt } = req.body;
    const item = await Notice.findByIdAndUpdate(
      req.params.id,
      { title, body, audience, ...(publishedAt ? { publishedAt } : {}) },
      { new: true }
    );
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  await Notice.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

export default router;
