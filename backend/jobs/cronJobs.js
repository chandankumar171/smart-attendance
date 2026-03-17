const cron = require('node-cron');
const { autoMarkAbsent, getDailyStats } = require('../utils/attendanceUtils');
const { emitStatsUpdate } = require('../socket');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

const startCronJobs = () => {
  // ── Auto-mark absent at 10:30 AM every weekday ──────────────
  // Cron syntax: minute hour day-of-month month day-of-week
  cron.schedule('30 10 * * 1-5', async () => {
    console.log('[CRON] Running auto-absent job...');
    try {
      const result = await autoMarkAbsent();
      console.log(`[CRON] Marked ${result.count} students absent.`);

      // Push updated stats to admin dashboard
      const today = Attendance.getTodayString();
      const stats = await getDailyStats(today);
      emitStatsUpdate(stats);
    } catch (err) {
      console.error('[CRON] Auto-absent job failed:', err.message);
    }
  });

  console.log('[CRON] Jobs scheduled: auto-absent at 10:30 AM (Mon-Fri)');
};

// Seed the default admin account if it doesn't exist
const seedAdmin = async () => {
  try {
    const exists = await User.findOne({ role: 'admin' });
    if (!exists) {
      await User.create({
        name: 'System Admin',
        email: process.env.ADMIN_EMAIL || 'admin@institute.edu',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'admin',
      });
      console.log('[SEED] Default admin account created.');
    }
  } catch (err) {
    console.error('[SEED] Admin seeding failed:', err.message);
  }
};

module.exports = { startCronJobs, seedAdmin };