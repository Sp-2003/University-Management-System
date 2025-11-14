// backend/server.js
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import courseRoutes from './routes/courses.js';
import enrollmentRoutes from './routes/enrollments.js';
import noticeRoutes from './routes/notices.js';
import adminRoutes from './routes/admin.js';
import materialRoutes from './routes/materials.js';
import resultRoutes from './routes/results.js';

// __dirname shim for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// app init
const app = express();

// create uploads folders if missing (so multer can write)
function ensureUploadsFolders() {
  const uploadsRoot = path.join(__dirname, 'uploads');
  const subdirs = ['results', 'materials', 'temp'];
  try {
    if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });
    for (const s of subdirs) {
      const dir = path.join(uploadsRoot, s);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    console.log('Uploads folders ensured:', uploadsRoot, subdirs);
  } catch (err) {
    console.error('Failed to ensure uploads folders:', err);
    // don't crash here; multer will fail later if necessary
  }
}
ensureUploadsFolders();

// middlewares
app.use(cors());
app.use(express.json()); // body parser for JSON
app.use(express.urlencoded({ extended: true })); // parse urlencoded bodies (forms)
app.use(morgan('dev'));

// serve uploaded files (make sure uploads/ exists or is created by multer)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// connect DB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ums';
const PORT = process.env.PORT || 4000;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Keep server running; API routes will fail until DB is available.
  });

// basic root
app.get('/', (req, res) => res.json({ status: 'ok' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/results', resultRoutes);

// 404 (last)
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// centralized error handler
// (signature: err, req, res, next)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(err?.status || 500).json({ error: err?.message || 'Internal Server Error' });
});

// start
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// graceful shutdown
function shutdown(signal) {
  console.log(`Received ${signal} — closing server...`);
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
