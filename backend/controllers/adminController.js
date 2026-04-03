const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { getDailyStats } = require('../utils/attendanceUtils');

// @desc   Get all students with face registration status
// @route  GET /api/admin/students
const getAllStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student', isActive: true })
      .select('-faceDescriptor -password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: students.length, students });
  } catch (err) {
    next(err);
  }
};

// @desc   Get daily attendance records (includes absent students with no record)
// @route  GET /api/admin/attendance/daily?date=YYYY-MM-DD
const getDailyAttendance = async (req, res, next) => {
  try {
    const date = req.query.date || Attendance.getTodayString();

    // Get all existing attendance records for this date
    const records = await Attendance.find({ date })
      .populate('student', 'name studentId course batch email')
      .sort({ markedAt: 1 });

    // Get IDs of students who already have a record
    const markedIds = records
      .filter((r) => r.student)
      .map((r) => r.student._id.toString());

    // Find students with no record for this date
    const unmarkedStudents = await User.find({
      role: 'student',
      isActive: true,
      _id: { $nin: markedIds },
    }).select('name studentId course batch email');

    // Build virtual absent records for unmarked students
    const absentRecords = unmarkedStudents.map((s) => ({
      _id: `virtual_${s._id}`,
      student: s,
      date,
      status: 'absent',
      markedAt: null,
      markedBy: 'not marked',
    }));

    // Combine: real records first, then virtual absent ones
    const allRecords = [...records, ...absentRecords];

    const stats = await getDailyStats(date);

    res.json({ success: true, date, records: allRecords, stats });
  } catch (err) {
    next(err);
  }
};

// @desc   Get individual student's full attendance history
// @route  GET /api/admin/attendance/student/:id
const getStudentAttendance = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id)
      .select('-faceDescriptor -password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const records = await Attendance.find({ student: req.params.id }).sort({ date: -1 });

    // Count working days (Mon-Fri) from registration date to today
    const registeredDate = new Date(student.createdAt);
    registeredDate.setHours(0, 0, 0, 0); // normalize to start of day

    const today = new Date();
    today.setHours(23, 59, 59, 999); // normalize to end of day

    let totalWorkingDays = 0;
    const cursor = new Date(registeredDate);
    while (cursor <= today) {
      const day = cursor.getDay(); // 0=Sun, 6=Sat
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
      total:      totalDays,
      present,
      late,
      absent:     totalAbsent,
      percentage: totalDays > 0
        ? Math.round(((present + late) / totalDays) * 100)
        : 0,
    };

    res.json({ success: true, student, records, stats });
  } catch (err) {
    next(err);
  }
};

// @desc   Get overall stats (today)
// @route  GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const today = Attendance.getTodayString();
    const stats = await getDailyStats(today);
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });

    res.json({ success: true, today, totalStudents, ...stats });
  } catch (err) {
    next(err);
  }
};

// @desc   Export attendance as CSV (includes absent students)
// @route  GET /api/admin/export?date=YYYY-MM-DD
const exportAttendance = async (req, res, next) => {
  try {
    const date = req.query.date || Attendance.getTodayString();

    // Get existing records
    const records = await Attendance.find({ date })
      .populate('student', 'name studentId course batch email')
      .sort({ status: 1, markedAt: 1 });

    // Get unmarked students and add them as absent
    const markedIds = records
      .filter((r) => r.student)
      .map((r) => r.student._id.toString());

    const unmarkedStudents = await User.find({
      role: 'student',
      isActive: true,
      _id: { $nin: markedIds },
    }).select('name studentId course batch email');

    const absentRecords = unmarkedStudents.map((s) => ({
      student: s,
      status: 'absent',
      markedAt: null,
      ipAddress: '',
    }));

    const allRecords = [...records, ...absentRecords];

    // Build CSV
    const header = 'Name,Student ID,Course,Batch,Status,Marked At,IP Address\n';
    const rows = allRecords
      .map((r) => {
        const s = r.student;
        const time = r.markedAt ? new Date(r.markedAt).toLocaleTimeString() : 'N/A';
        return `"${s.name}","${s.studentId}","${s.course || ''}","${s.batch || ''}","${r.status}","${time}","${r.ipAddress || ''}"`;
      })
      .join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${date}.csv`);
    res.send(header + rows);
  } catch (err) {
    next(err);
  }
};

// @desc   Admin manually marks a student's attendance
// @route  POST /api/admin/attendance/manual
const manualMarkAttendance = async (req, res, next) => {
  try {
    const { studentId, status, date } = req.body;
    const targetDate = date || Attendance.getTodayString();

    if (!['present', 'late', 'absent'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const record = await Attendance.findOneAndUpdate(
      { student: studentId, date: targetDate },
      { status, markedBy: 'admin', markedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Attendance updated.', record });
  } catch (err) {
    next(err);
  }
};



// @desc   Admin updates a student's face descriptor
// @route  PUT /api/admin/students/:id/face
const updateStudentFace = async (req, res, next) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({ success: false, message: 'Face descriptor required.' });
    }

    const student = await User.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    student.faceDescriptor   = faceDescriptor;
    student.isFaceRegistered = true;
    await student.save();

    res.json({ success: true, message: `Face updated for ${student.name}.` });
  } catch (err) {
    next(err);
  }
};





module.exports = {
  getAllStudents,
  getDailyAttendance,
  getStudentAttendance,
  getStats,
  exportAttendance,
  manualMarkAttendance,
  updateStudentFace,  // ← ADD THIS
};