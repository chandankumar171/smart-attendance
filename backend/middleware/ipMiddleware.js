const ipRangeCheck = require('ip-range-check');

/**
 * Validates that the request comes from the institute's allowed IP range.
 * Allowed ranges are set via ALLOWED_IP_RANGES env variable (comma-separated CIDR).
 * This runs on the server, so it cannot be spoofed from the browser.
 */
const checkInstituteNetwork = (req, res, next) => {
  const clientIp = req.clientIp; // set by request-ip middleware in app.js

  // Parse allowed ranges from env (e.g. "192.168.0.0/24,127.0.0.1/32,::1/128")
  const allowedRanges = (process.env.ALLOWED_IP_RANGES || '127.0.0.1/32')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  // Normalize IPv6-mapped IPv4 addresses (e.g. "::ffff:192.168.0.5" → "192.168.0.5")
  const normalizedIp = clientIp?.replace(/^::ffff:/, '') || '';

  const isAllowed = ipRangeCheck(normalizedIp, allowedRanges);

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      message: 'Attendance is only allowed when connected to institute WiFi.',
      clientIp: normalizedIp, // send back so client can display it
    });
  }

  req.clientIpNormalized = normalizedIp;
  next();
};

module.exports = { checkInstituteNetwork };