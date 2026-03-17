const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/studentController');
const { protect, studentOnly } = require('../middleware/authMiddleware');

router.use(protect, studentOnly);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;