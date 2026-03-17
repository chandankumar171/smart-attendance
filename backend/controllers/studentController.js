const User = require('../models/User');

// @desc   Get student's own profile
// @route  GET /api/student/profile
const getProfile = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc   Update student's own profile
// @route  PUT /api/student/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'course', 'batch'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };