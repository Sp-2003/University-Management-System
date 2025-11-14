// backend/models/ResultPdf.js
import mongoose from 'mongoose';

const resultPdfSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  semester: { type: Number, min: 1 },
  filePath: { type: String, required: true }, // e.g. "/uploads/results/xxx.pdf"
  note: { type: String }
}, { timestamps: true });

resultPdfSchema.index({ student: 1, semester: 1 }, { unique: true, partialFilterExpression: { semester: { $exists: true } } });

export default mongoose.model('ResultPdf', resultPdfSchema);
