const User = require('../models/User');
const Attendance = require('../models/Attendance');

/**
 * Get attendance counts for a given date.
 * Returns { present, late, absent, total, notMarked }
 */
const getDailyStats = async (date) => {
  const totalStudents = await User.countDocuments({ role: 'student', isActive: true });

  const records = await Attendance.find({ date });
  const present = records.filter((r) => r.status === 'present').length;
  const late = records.filter((r) => r.status === 'late').length;
  const absent = records.filter((r) => r.status === 'absent').length;
  const marked = present + late + absent;
  const notMarked = Math.max(0, totalStudents - marked);

  return { present, late, absent: absent + notMarked, marked, notMarked, total: totalStudents };
};

/**
 * Mark all students who have no record for today as absent.
 * Called by the cron job at 10:30 AM.
 */
const autoMarkAbsent = async () => {
  const today = Attendance.getTodayString();

  // Get IDs of students who already have a record today
  const existing = await Attendance.find({ date: today }).distinct('student');

  // Find students without a record
  const missing = await User.find({
    role: 'student',
    isActive: true,
    _id: { $nin: existing },
  }).select('_id');

  if (missing.length === 0) return { count: 0 };

  // Bulk insert absent records
  const docs = missing.map((s) => ({
    student: s._id,
    date: today,
    status: 'absent',
    markedBy: 'system',
    markedAt: null,
  }));

  await Attendance.insertMany(docs, { ordered: false });

  console.log(`[CRON] Auto-marked ${missing.length} students as absent for ${today}`);
  return { count: missing.length };
};

module.exports = { getDailyStats, autoMarkAbsent };