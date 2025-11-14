import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  // Link back to User account (OPTION A requires this)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },

  regNo: { type: String, trim: true, unique: true, sparse: true },
  name: { type: String, required: true, trim: true },

  email: { type: String, trim: true, unique: true, sparse: true },

  department: { type: String, trim: true, default: '' },

  semester: { type: Number, min: 1, max: 8, default: 1 }
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
