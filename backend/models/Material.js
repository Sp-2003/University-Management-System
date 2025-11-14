// backend/models/Material.js
import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String },
  type: { type: String },   // pdf, image, youtube, link, text, file
  url: { type: String },    // external url or file url
  filePath: { type: String },// internal uploads path
  note: { type: String }
}, { timestamps: true });

export default mongoose.model('Material', materialSchema);
