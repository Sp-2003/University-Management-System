import mongoose from 'mongoose';
const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  credits: { type: Number, default: 3 },
  department: { type: String, required: true },
  
  studyMaterials: [
  {
    title: String,
    type: { type: String, enum: ['pdf', 'image', 'youtube', 'link', 'text'], default: 'link' },
    url: String,
    note: String,
    createdAt: { type: Date, default: Date.now }
  }
]

}, { timestamps: true });
export default mongoose.model('Course', courseSchema);
