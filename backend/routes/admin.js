const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const os = require('os');

const serverStartTime = global.serverStartTime || Date.now();

// Get all users (Free tier standalone list)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  const users = [
    {
      _id: 'dev_user_1',
      name: 'Developer (Active Session)',
      email: 'free-developer@codeatlas.dev',
      role: 'developer',
      createdAt: new Date().toISOString()
    }
  ];
  res.json(users);
});

// Get analytics
router.get('/analytics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalRepos = (global.recentScans && global.recentScans.length) || 0;
    const totalGraphs = (global.graphs && global.graphs.size) || 0;
    const totalLogs = (global.activityLogs && global.activityLogs.length) || 0;
    const onlineUsers = global.onlineUsers ? global.onlineUsers.size : 1;

    res.json({
      totalUsers: 1,
      totalRepos,
      totalGraphs,
      totalLogs,
      activeUsersToday: 1,
      onlineUsers: Math.max(1, onlineUsers),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// System Health
router.get('/health', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const uptimeMs = Date.now() - serverStartTime;
    const uptimeHours = Math.floor(uptimeMs / 3600000);
    const uptimeMinutes = Math.floor((uptimeMs % 3600000) / 60000);
    const uptimeSeconds = Math.floor((uptimeMs % 60000) / 1000);

    const memUsage = process.memoryUsage();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();

    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || 'Generic CPU';
    const cpuCores = cpus.length;

    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpuCores;

    res.json({
      server: {
        status: 'online',
        uptime: `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`,
        uptimeMs,
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid
      },
      database: {
        status: 'standalone (zero-db)',
        latency: '0ms',
        latencyMs: 0
      },
      memory: {
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        systemTotal: `${Math.round(totalMem / 1024 / 1024 / 1024)}GB`,
        systemFree: `${Math.round(freeMem / 1024 / 1024 / 1024)}GB`,
        usagePercent: Math.round(((totalMem - freeMem) / totalMem) * 100)
      },
      cpu: {
        model: cpuModel,
        cores: cpuCores,
        usagePercent: Math.round(cpuUsage) || 5
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Health check failed' });
  }
});

// Activity Log
router.get('/activity-log', authMiddleware, adminMiddleware, async (req, res) => {
  const logs = global.activityLogs || [];
  res.json({ logs, total: logs.length, page: 1, totalPages: 1 });
});

// User history
router.get('/user-history/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({
    user: { _id: req.params.userId, name: 'Developer', email: 'free-developer@codeatlas.dev' },
    history: global.recentScans || [],
    activity: global.activityLogs || []
  });
});

// Churn data
router.get('/churn-data', authMiddleware, adminMiddleware, async (req, res) => {
  const graphs = Array.from((global.graphs || new Map()).values());
  const churnMap = {};
  let totalFiles = 0;

  graphs.forEach(graph => {
    (graph.nodes || []).forEach(node => {
      if (node.type === 'file' && node.data) {
        totalFiles++;
        const churn = node.data.churn || 50;
        const label = node.label || node.id;
        if (!churnMap[label] || churnMap[label] < churn) {
          churnMap[label] = Math.round(churn);
        }
      }
    });
  });

  const topChurn = Object.entries(churnMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([file, churn]) => ({ file, churn }));

  const distribution = {
    high: Object.values(churnMap).filter(c => c > 75).length,
    medium: Object.values(churnMap).filter(c => c > 40 && c <= 75).length,
    low: Object.values(churnMap).filter(c => c <= 40).length
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trend = weekDays.map((day, i) => ({
    day,
    changes: Math.max(3, Math.round(totalFiles * (0.3 + Math.sin(i * 0.8) * 0.2)))
  }));

  res.json({ topChurn, distribution, trend, totalFiles, totalGraphs: graphs.length });
});

// Promote user mock
router.post('/promote/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: 'User role updated', role: 'admin' });
});

// Delete user mock
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ message: 'User deleted' });
});

// Clear activity logs
router.delete('/clear-logs', authMiddleware, adminMiddleware, async (req, res) => {
  global.activityLogs = [];
  res.json({ message: 'All activity logs cleared' });
});

module.exports = router;
