const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper: sign JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Helper: send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId,
      course: user.course,
      batch: user.batch,
      isFaceRegistered: user.isFaceRegistered,
    },
  });
};

// @desc   Register a new student
// @route  POST /api/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, studentId, course, batch } = req.body;

    if (!name || !email || !password || !studentId) {
      return res.status(400).json({ success: false, message: 'Please fill all required fields.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { studentId }] });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email
          ? 'Email already registered.'
          : 'Student ID already registered.',
      });
    }

    const user = await User.create({ name, email, password, studentId, course, batch, role: 'student' });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @desc   Login user (student or admin)
// @route  POST /api/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc   Get current logged-in user
// @route  GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc   Save face descriptor for student
// @route  POST /api/auth/register-face
// @access Private (student only)
const registerFace = async (req, res, next) => {
  try {
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({
        success: false,
        message: 'Invalid face descriptor. Must be an array of 128 numbers.',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { faceDescriptor, isFaceRegistered: true },
      { new: true }
    );

    res.json({ success: true, message: 'Face registered successfully.', isFaceRegistered: user.isFaceRegistered });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, registerFace };