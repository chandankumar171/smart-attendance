const mongoose = require('mongoose');

const allowedIPSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
    },
    cidr: {
      type: String,
      required: [true, 'CIDR/IP is required'],
      trim: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AllowedIP', allowedIPSchema);