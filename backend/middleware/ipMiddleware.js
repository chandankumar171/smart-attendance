const ipRangeCheck = require('ip-range-check');
const AllowedIP = require('../models/AllowedIP');

const checkInstituteNetwork = async (req, res, next) => {
  try {
    const clientIp = req.clientIp;
    const normalizedIp = clientIp?.replace(/^::ffff:/, '') || '';

    // Fetch active IP ranges from DB
    const ipDocs = await AllowedIP.find({ isActive: true }).select('cidr');

    // Fallback to ENV if DB is empty
    let allowedRanges = ipDocs.map((d) => d.cidr);
    if (allowedRanges.length === 0) {
      allowedRanges = (process.env.ALLOWED_IP_RANGES || '127.0.0.1/32')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);
    }

    const isAllowed = ipRangeCheck(normalizedIp, allowedRanges);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Attendance is only allowed when connected to institute WiFi.',
        clientIp: normalizedIp,
      });
    }

    req.clientIpNormalized = normalizedIp;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkInstituteNetwork };