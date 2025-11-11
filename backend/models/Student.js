import mongoose from 'mongoose';
const studentSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  semester: { type: Number, min:1, max:8, default:1 }
}, { timestamps: true });
export default mongoose.model('Student', studentSchema);
