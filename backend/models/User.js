import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin','teacher','student'], default: 'student' },
  passwordHash: { type: String, required: true }
}, { timestamps: true });
userSchema.methods.verifyPassword = function(password) { return bcrypt.compare(password, this.passwordHash); };
userSchema.statics.hashPassword = function(password) { return bcrypt.hash(password, 10); };
export default mongoose.model('User', userSchema);
