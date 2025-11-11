import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ums';

async function run() {
  await mongoose.connect(MONGO_URI);
  const email = 'admin@example.com';

  let user = await User.findOne({ email });
  if (!user) {
    const passwordHash = await User.hashPassword('admin123');
    user = await User.create({
      name: 'Admin',
      email,
      role: 'admin',
      status: 'approved',
      requestedRole: 'teacher',
      passwordHash
    });
    console.log('✅ Admin created:', user.email);
  } else {
    user.role = 'admin';
    user.status = 'approved';
    user.rejectionReason = '';
    await user.save();
    console.log('✅ Admin ensured (role/status updated):', user.email);
  }
  await mongoose.disconnect();
}
run().catch(err => { console.error(err); process.exit(1); });
