const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { emitAttendanceUpdate, emitStatsUpdate } = require('../socket');
const { getDailyStats } = require('../utils/attendanceUtils');

// Time-based status determination
const getAttendanceStatus = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const totalMinutes = h * 60 + m;

  const lateH  = parseInt(process.env.ATTENDANCE_LATE_HOUR  );
  const lateM  = parseInt(process.env.ATTENDANCE_LATE_MINUTE );
  const closeH = parseInt(process.env.ATTENDANCE_CLOSE_HOUR  );
  const closeM = parseInt(process.env.ATTENDANCE_CLOSE_MINUTE );

  const lateThreshold  = lateH  * 60 + lateM;
  const closeThreshold = closeH * 60 + closeM;

  if (totalMinutes >= closeThreshold) return null;
  if (totalMinutes >= lateThreshold)  return 'late';
  return 'present';
};

// @desc   Mark attendance via face recognition
// @route  POST /api/attendance/mark
// @access Private (student) + IP check
const markAttendance = async (req, res, next) => {
  try {
    const { faceDescriptor } = req.body;
    const studentId = req.user._id;
    const today = Attendance.getTodayString();

    // 1. Check if already marked today
    const existing = await Attendance.findOne({ student: studentId, date: today });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Attendance already recorded for today.',
        status: existing.status,
      });
    }

    // 2. Check time window
    const status = getAttendanceStatus();
    if (!status) {
      return res.status(403).json({
        success: false,
        message: 'Attendance window is closed. It is past 10:00 AM.',
      });
    }

    // 3. Verify face descriptor
    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ success: false, message: 'Face descriptor required.' });
    }

    const student = await User.findById(studentId);
    if (!student.isFaceRegistered || !student.faceDescriptor) {
      return res.status(400).json({
        success: false,
        message: 'Face not registered. Please register your face first.',
      });
    }

    const distance  = euclideanDistance(faceDescriptor, student.faceDescriptor);
    const THRESHOLD = 0.5;

    if (distance > THRESHOLD) {
      return res.status(422).json({
        success: false,
        message: 'Face not recognized. Please try again.',
        confidence: distance,
      });
    }

    // 4. Save attendance record
    const record = await Attendance.create({
      student: studentId,
      date: today,
      status,
      markedAt: new Date(),
      markedBy: 'face-recognition',
      ipAddress: req.clientIpNormalized,
      faceConfidence: distance,
    });

    const populated = await record.populate('student', 'name studentId course batch');

    // 5. Emit real-time updates
    emitAttendanceUpdate({ record: populated, action: 'new' });
    const stats = await getDailyStats(today);
    emitStatsUpdate(stats);

    res.status(201).json({
      success: true,
      message: `Face detected. Attendance marked as ${status === 'present' ? 'Present' : 'Late'} successfully.`,
      status,
      markedAt: record.markedAt,
    });
  } catch (err) {
    next(err);
  }
};

// @desc   Get current student's attendance history
// @route  GET /api/attendance/my
// @access Private (student)
const getMyAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .sort({ date: -1 })
      .limit(60);

    // Fetch full user to get createdAt reliably
    const fullUser = await User.findById(req.user._id).select('createdAt');
    const createdAt = fullUser?.createdAt || new Date();

    // Count working days (Mon-Fri) from registration to today
    const registeredDate = new Date(createdAt);
    registeredDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let totalWorkingDays = 0;
    const cursor = new Date(registeredDate);
    while (cursor <= today) {
      const day = cursor.getDay();
      if (day !== 0) totalWorkingDays++;
      cursor.setDate(cursor.getDate() + 1);
    }

    // Minimum 1 so stats are never all zero
    if (totalWorkingDays === 0) totalWorkingDays = 1;

    const present     = records.filter((r) => r.status === 'present').length;
    const late        = records.filter((r) => r.status === 'late').length;
    const absentInDB  = records.filter((r) => r.status === 'absent').length;
    const noRecord    = Math.max(0, totalWorkingDays - records.length);
    const totalAbsent = absentInDB + noRecord;
    const totalDays   = present + late + totalAbsent;

    const stats = {
      total:   totalDays,
      present,
      late,
      absent:  totalAbsent,
    };

    res.json({ success: true, records, stats });
  } catch (err) {
    next(err);
  }
};

// @desc   Get today's attendance status for current student
// @route  GET /api/attendance/today
// @access Private (student)
const getTodayStatus = async (req, res, next) => {
  try {
    const today = Attendance.getTodayString();
    const record = await Attendance.findOne({ student: req.user._id, date: today });
    const windowStatus = getAttendanceStatus();

    res.json({
      success: true,
      todayRecord:  record || null,
      windowStatus,
      currentTime:  new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};

// Helper: Euclidean distance between two descriptor arrays
const euclideanDistance = (a, b) => {
  if (a.length !== b.length) return Infinity;
  return Math.sqrt(a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0));
};

module.exports = { markAttendance, getMyAttendance, getTodayStatus };