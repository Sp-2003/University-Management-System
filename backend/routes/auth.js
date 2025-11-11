import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
const router = Router();
router.post('/register', async (req,res)=>{
  try {
    const { name, email, password, role } = req.body;
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role: role || 'student' });
    res.json({ id: user._id, email: user.email });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
router.post('/login', async (req,res)=>{
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await user.verifyPassword(password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  res.json({ token, user: { id: user._id, name: user.name, role: user.role, email: user.email } });
});
export default router;
