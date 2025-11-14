// backend/models/InternalMark.js
import mongoose from 'mongoose';

const internalMarkSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  marks: { type: Number, required: true },
}, { timestamps: true });

internalMarkSchema.index({ course: 1, student: 1 }, { unique: true });

export default mongoose.model('InternalMark', internalMarkSchema);
