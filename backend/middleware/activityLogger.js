// In-memory activity logging without database dependency
if (!global.activityLogs) global.activityLogs = [];

const logActivity = async (userId, action, details = '', req = null) => {
  try {
    const logEntry = {
      _id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      userId: userId || 'free_developer',
      userName: (req && req.user && req.user.name) || 'Developer',
      userEmail: (req && req.user && req.user.email) || 'guest@codeatlas.dev',
      action,
      details,
      ipAddress: req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '',
      userAgent: req ? (req.headers['user-agent'] || '') : '',
      timestamp: new Date()
    };

    global.activityLogs.unshift(logEntry);
    if (global.activityLogs.length > 200) {
      global.activityLogs.pop();
    }
  } catch (err) {
    console.error('Activity logging error:', err.message);
  }
};

module.exports = { logActivity };
