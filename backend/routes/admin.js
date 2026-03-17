const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getDailyAttendance,
  getStudentAttendance,
  getStats,
  exportAttendance,
  manualMarkAttendance,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly); // all admin routes require auth + admin role

router.get('/students', getAllStudents);
router.get('/attendance/daily', getDailyAttendance);       // ?date=YYYY-MM-DD
router.get('/attendance/student/:id', getStudentAttendance);
router.get('/stats', getStats);
router.get('/export', exportAttendance);                   // ?date=YYYY-MM-DD
router.post('/attendance/manual', manualMarkAttendance);

module.exports = router;