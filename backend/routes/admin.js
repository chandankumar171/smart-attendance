const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getDailyAttendance,
  getStudentAttendance,
  getStats,
  exportAttendance,
  manualMarkAttendance,
  updateStudentFace,  // ← ADD THIS
  getAllowedIPs,     // ← ADD
  addAllowedIP,     // ← ADD
  deleteAllowedIP,  // ← ADD
  toggleAllowedIP,  // ← ADD
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect, adminOnly); // all admin routes require auth + admin role

router.get('/students', getAllStudents);
router.get('/attendance/daily', getDailyAttendance);       // ?date=YYYY-MM-DD
router.get('/attendance/student/:id', getStudentAttendance);
router.get('/stats', getStats);
router.get('/export', exportAttendance);                   // ?date=YYYY-MM-DD
router.post('/attendance/manual', manualMarkAttendance);
router.put('/students/:id/face', updateStudentFace); // ← ADD THIS
// IP range routes
router.get('/ip-ranges', getAllowedIPs);                    // ← ADD
router.post('/ip-ranges', addAllowedIP);                   // ← ADD
router.delete('/ip-ranges/:id', deleteAllowedIP);          // ← ADD
router.patch('/ip-ranges/:id/toggle', toggleAllowedIP);    // ← ADD

module.exports = router;