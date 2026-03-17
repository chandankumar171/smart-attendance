const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // stored as 'YYYY-MM-DD' for easy daily queries
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'late', 'absent'],
      required: true,
    },
    markedAt: {
      type: Date,
      default: null, // null if system-marked absent
    },
    markedBy: {
      type: String,
      enum: ['face-recognition', 'system', 'admin'],
      default: 'face-recognition',
    },
    ipAddress: {
      type: String,
      default: null,
    },
    faceConfidence: {
      type: Number, // euclidean distance from stored descriptor (lower = more confident)
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one record per student per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// Static method to get today's date string
attendanceSchema.statics.getTodayString = function () {
  return new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
};

module.exports = mongoose.model('Attendance', attendanceSchema);