import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // Final role used for access after approval
  role: { type: String, enum: ['admin','teacher','student'], default: 'student' },

  // Registration-time info
  institutionalId: { type: String, trim: true },  // college/univ ID, roll, employee ID, etc.
  requestedRole: { type: String, enum: ['teacher','student'], default: 'student' },

  // Approval workflow
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },

  passwordHash: { type: String, required: true }
}, { timestamps: true });

userSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};
userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

export default mongoose.model('User', userSchema);
