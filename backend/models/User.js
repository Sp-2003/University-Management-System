// backend/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // Final role used for access after approval
  role: { type: String, enum: ['admin','teacher','student'], default: 'student' },

  // Registration-time info (what user asked for)
  institutionalId: { type: String, trim: true },  // college/univ ID, roll, employee ID, etc.
  requestedRole: { type: String, enum: ['teacher','student'], default: 'student' },

  // Approval workflow
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },

  passwordHash: { type: String, required: true }
}, { timestamps: true });

/* ----------------------
   Instance methods
   ---------------------- */
userSchema.methods.verifyPassword = function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/* ----------------------
   Static helpers
   ---------------------- */
userSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: String(email || '').trim().toLowerCase() });
};

/* ----------------------
   toJSON transform: hide sensitive fields when sending to client
   ---------------------- */
if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
userSchema.options.toJSON.transform = function(doc, ret) {
  // remove sensitive/internal fields
  delete ret.passwordHash;
  delete ret.__v;
  // provide consistent id
  ret.id = ret._id;
  delete ret._id;
  return ret;
};

export default mongoose.model('User', userSchema);
