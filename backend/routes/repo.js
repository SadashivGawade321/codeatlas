const express = require('express');
const router = express.Router();
const RepositoryHistory = require('../models/RepositoryHistory');
const Graph = require('../models/Graph');
const { authMiddleware } = require('../middleware/authMiddleware');
const parserService = require('../services/parserService');
const aiService = require('../services/aiService');
const { logActivity } = require('../middleware/activityLogger');

// Analyze a repository
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    console.log('Starting analysis for:', url);
    const analysis = await parserService.analyzeRepo(url);

    const repositoryName = url.split('/').pop()?.replace('.git', '') || 'Unknown Repo';

    const graph = new Graph({
      userId: req.user.id,
      repositoryUrl: url,
      nodes: analysis.nodes,
      edges: analysis.edges
    });
    await graph.save();

    const repoHistory = new RepositoryHistory({
      userId: req.user.id,
      repositoryUrl: url,
      repositoryName,
      healthScore: analysis.healthScore,
      languageBreakdown: analysis.languageBreakdown,
      graphId: graph._id
    });
    await repoHistory.save();

    // Log activity
    await logActivity(req.user.id, 'analyze_repo', `Analyzed repository: ${url}`, req);

    res.json({
      message: 'Analysis complete',
      graphId: graph._id,
      historyId: repoHistory._id,
      analysis: {
        fileCount: analysis.fileCount,
        healthScore: analysis.healthScore,
        languageBreakdown: analysis.languageBreakdown,
        securityWarnings: analysis.securityWarnings,
        designPatterns: analysis.designPatterns,
        dbConnections: analysis.dbConnections
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Chat about a repository
router.post('/chat/:graphId', authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    const graph = await Graph.findById(req.params.graphId);
    
    if (!graph) return res.status(404).json({ message: 'Repository context not found' });

    if (graph.userId.toString() !== req.user.id) {
      const User = require('../models/User');
      const owner = await User.findById(graph.userId);
      if (!owner || !owner.friends.includes(req.user.id)) {
        return res.status(403).json({ message: 'Access Denied.' });
      }
    }

    const context = {
      nodes: graph.nodes.map(n => ({ label: n.label, type: n.type, path: n.data?.path })),
      edges: graph.edges
    };

    const answer = await aiService.askAI(prompt, context);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Auto-Refactor a file
router.post('/refactor/:graphId', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.body;
    const graph = await Graph.findById(req.params.graphId);
    
    if (!graph) return res.status(404).json({ message: 'Repository context not found' });

    if (graph.userId.toString() !== req.user.id) {
      const User = require('../models/User');
      const owner = await User.findById(graph.userId);
      if (!owner || !owner.friends.includes(req.user.id)) {
        return res.status(403).json({ message: 'Access Denied.' });
      }
    }
    
    // Parse URL to get owner and repo
    const parts = graph.repositoryUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) return res.status(400).json({ message: 'Invalid repository URL' });

    // Fetch raw file from GitHub (assuming main/master branch for simplicity)
    const axios = require('axios');
    let fileContent = '';
    try {
      const rawRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`);
      fileContent = rawRes.data;
    } catch (e) {
      try {
        const rawRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/master/${filePath}`);
        fileContent = rawRes.data;
      } catch (err) {
        return res.status(404).json({ message: 'Failed to fetch raw file from GitHub. Check if file exists.' });
      }
    }

    if (!fileContent) return res.status(400).json({ message: 'File is empty' });

    const refactoredCode = await aiService.autoRefactor(fileContent);
    
    res.json({ original: fileContent, refactored: refactoredCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Get user's repository history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await RepositoryHistory.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get graph by id — also handles legacy history IDs as a fallback
router.get('/graph/:id', authMiddleware, async (req, res) => {
  try {
    await logActivity(req.user.id, 'view_graph', `Viewed graph: ${req.params.id}`, req);

    let graph = await Graph.findById(req.params.id);
    
    // Fallback: maybe the ID is a RepositoryHistory ID (legacy links)
    if (!graph) {
      const RepositoryHistory = require('../models/RepositoryHistory');
      const history = await RepositoryHistory.findOne({ _id: req.params.id });
      if (history && history.graphId) {
        graph = await Graph.findById(history.graphId);
      }
    }
    
    if (!graph) return res.status(404).json({ message: 'Graph not found. Please re-analyze this repository.' });

    // Access Control: Owner or Friend
    if (graph.userId.toString() !== req.user.id) {
      const User = require('../models/User');
      const owner = await User.findById(graph.userId);
      if (!owner || !owner.friends.includes(req.user.id)) {
        return res.status(403).json({ message: 'Access Denied. You must be a collaborator to view this graph.' });
      }
    }

    res.json(graph);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete history
router.delete('/history/:id', authMiddleware, async (req, res) => {
  try {
    await RepositoryHistory.findOneAndDelete({ _id: req.params.id, userId: req.user.id });

    // Log activity
    await logActivity(req.user.id, 'delete_history', `Deleted history: ${req.params.id}`, req);

    res.json({ message: 'History deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Code Review for a file
router.post('/review/:graphId', authMiddleware, async (req, res) => {
  try {
    const { filePath } = req.body;
    const graph = await Graph.findById(req.params.graphId);
    
    if (!graph) return res.status(404).json({ message: 'Repository context not found' });

    if (graph.userId.toString() !== req.user.id) {
      const User = require('../models/User');
      const owner = await User.findById(graph.userId);
      if (!owner || !owner.friends.includes(req.user.id)) {
        return res.status(403).json({ message: 'Access Denied.' });
      }
    }
    
    // Parse URL to get owner and repo
    const parts = graph.repositoryUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) return res.status(400).json({ message: 'Invalid repository URL' });

    // Fetch raw file from GitHub
    const axios = require('axios');
    let fileContent = '';
    try {
      const rawRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`);
      fileContent = rawRes.data;
    } catch (e) {
      try {
        const rawRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/master/${filePath}`);
        fileContent = rawRes.data;
      } catch (err) {
        return res.status(404).json({ message: 'Failed to fetch file from GitHub.' });
      }
    }

    if (!fileContent) return res.status(400).json({ message: 'File is empty' });

    const issues = await aiService.aiCodeReview(typeof fileContent === 'string' ? fileContent : JSON.stringify(fileContent));
    
    res.json({ issues });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

module.exports = router;
