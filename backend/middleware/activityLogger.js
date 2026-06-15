const ActivityLog = require('../models/ActivityLog');

/**
 * Logs a user activity to the database.
 * Can be called directly from route handlers for explicit logging.
 */
const logActivity = async (userId, action, details = '', req = null) => {
  try {
    const logEntry = {
      userId,
      action,
      details,
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '',
      userAgent: req ? (req.headers['user-agent'] || '') : '',
      timestamp: new Date()
    };

    // Try to get user name/email if possible
    if (req && req.user) {
      logEntry.userName = req.user.name || '';
      logEntry.userEmail = req.user.email || '';
    }

    await ActivityLog.create(logEntry);
  } catch (err) {
    console.error('Activity logging error:', err.message);
  }
};

module.exports = { logActivity };
