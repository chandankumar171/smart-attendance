const express = require('express');
const cors = require('cors');
const requestIp = require('request-ip');
const { checkInstituteNetwork } = require('./middleware/ipMiddleware'); // adjust path

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const attendanceRoutes = require('./routes/attendance');


const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' })); // large limit for face descriptor payloads
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true); // ADD THIS before requestIp.mw()
app.use(requestIp.mw());
// app.use(requestIp.mw()); // attaches req.clientIp to every request

// ── Routes ──────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendance', attendanceRoutes);
// app.use('/api/attendance', checkInstituteNetwork, attendanceRoutes);

// ── Health check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global error handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;