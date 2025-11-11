import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true },
  body:    { type: String, required: true, trim: true },
  audience:{ type: String, enum: ['all','students','teachers'], default: 'all' },
  publishedAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

export default mongoose.model('Notice', noticeSchema);
