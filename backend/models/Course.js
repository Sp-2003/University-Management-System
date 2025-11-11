import mongoose from 'mongoose';
const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  credits: { type: Number, default: 3 },
  department: { type: String, required: true }
}, { timestamps: true });
export default mongoose.model('Course', courseSchema);
