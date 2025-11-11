import 'dotenv/config';

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import noticeRoutes from './routes/notices.js';
import adminRoutes from './routes/admin.js';


dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ums';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGO_URI).then(()=>console.log('MongoDB connected')).catch(err=>console.error(err));

app.get('/', (req,res)=>res.json({status:'ok'}));

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin', adminRoutes);
// 404 MUST be last
app.use((req,res)=>res.status(404).json({error:'Not Found'}));

app.listen(PORT, ()=>console.log(`Server running on port ${PORT}`));
