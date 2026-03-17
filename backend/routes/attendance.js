const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getMyAttendance,
  getTodayStatus,
} = require('../controllers/attendanceController');
const { protect, studentOnly } = require('../middleware/authMiddleware');
const { checkInstituteNetwork } = require('../middleware/ipMiddleware');

// Mark attendance — requires auth + institute network check
router.post('/mark', protect, studentOnly, checkInstituteNetwork, markAttendance);

// Student's own attendance history
router.get('/my', protect, studentOnly, getMyAttendance);

// Today's status for logged-in student
router.get('/today', protect, studentOnly, getTodayStatus);

module.exports = router;