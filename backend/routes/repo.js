const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authMiddleware, optionalAuthMiddleware } = require('../middleware/authMiddleware');
const parserService = require('../services/parserService');
const aiService = require('../services/aiService');
const { logActivity } = require('../middleware/activityLogger');

// In-memory stores for database-free operation
if (!global.graphs) global.graphs = new Map();
if (!global.recentScans) global.recentScans = [];

// Analyze a repository (Free, no login/db required)
router.post('/analyze', optionalAuthMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'URL is required' });

    console.log('Starting analysis for:', url);
    const analysis = await parserService.analyzeRepo(url);

    const repositoryName = url.split('/').pop()?.replace('.git', '') || 'Unknown Repo';
    const graphId = 'graph_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

    const graph = {
      _id: graphId,
      id: graphId,
      repositoryUrl: url,
      repositoryName,
      nodes: analysis.nodes,
      edges: analysis.edges,
      healthScore: analysis.healthScore,
      languageBreakdown: analysis.languageBreakdown,
      createdAt: new Date().toISOString()
    };

    // Cache graph in memory
    global.graphs.set(graphId, graph);

    // Save scan to memory list
    const scanItem = {
      _id: graphId,
      graphId,
      repositoryUrl: url,
      repositoryName,
      healthScore: analysis.healthScore,
      languageBreakdown: analysis.languageBreakdown,
      createdAt: new Date().toISOString(),
      analysisDate: new Date().toISOString()
    };

    // Add to recent scans, keep unique by URL or replace
    global.recentScans = [scanItem, ...global.recentScans.filter(s => s.repositoryUrl !== url)].slice(0, 50);

    // Activity log
    await logActivity('free_developer', 'analyze_repo', `Analyzed repository: ${url}`, req);

    res.json({
      message: 'Analysis complete',
      graphId,
      historyId: graphId,
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
router.post('/chat/:graphId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { prompt, context: clientContext } = req.body;
    let context = clientContext || null;

    if (req.params.graphId && req.params.graphId !== 'demo') {
      const graph = global.graphs.get(req.params.graphId);
      if (graph) {
        context = {
          nodes: graph.nodes.map(n => ({ label: n.label, type: n.type, path: n.data?.path })),
          edges: graph.edges
        };
      }
    }

    if (!context) {
      context = {
        summary: 'General repository context',
        nodes: [{ label: 'Source', type: 'directory' }, { label: 'index.js', type: 'file' }]
      };
    }

    const answer = await aiService.askAI(prompt, context);
    res.json({ answer });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Natural Language Graph Filtering
router.post('/filter', optionalAuthMiddleware, async (req, res) => {
  try {
    const { query, nodes } = req.body;
    if (!query) return res.status(400).json({ message: 'Query is required' });

    const result = await aiService.filterGraphByNL(query, nodes || []);
    res.json(result);
  } catch (err) {
    console.error('NL Filter error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// Auto-Refactor a file
router.post('/refactor/:graphId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { filePath, repoUrl } = req.body;
    const graph = global.graphs.get(req.params.graphId);
    const targetUrl = (graph && graph.repositoryUrl) || repoUrl;

    if (!targetUrl) {
      return res.status(400).json({ message: 'Repository URL not found' });
    }

    // Parse URL to get owner and repo
    const parts = targetUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) return res.status(400).json({ message: 'Invalid repository URL' });

    // Fetch raw file from GitHub (try main, then master)
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

// Get repository history
router.get('/history', optionalAuthMiddleware, async (req, res) => {
  try {
    res.json(global.recentScans || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get graph by id
router.get('/graph/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    await logActivity('free_developer', 'view_graph', `Viewed graph: ${req.params.id}`, req);

    if (global.graphs.has(req.params.id)) {
      return res.json(global.graphs.get(req.params.id));
    }

    // Check if ID matches a scan in recentScans
    const scan = global.recentScans.find(s => s.graphId === req.params.id || s._id === req.params.id);
    if (scan && scan.repositoryUrl) {
      // Auto re-analyze on demand
      try {
        const analysis = await parserService.analyzeRepo(scan.repositoryUrl);
        const graph = {
          _id: req.params.id,
          id: req.params.id,
          repositoryUrl: scan.repositoryUrl,
          repositoryName: scan.repositoryName,
          nodes: analysis.nodes,
          edges: analysis.edges,
          healthScore: analysis.healthScore,
          languageBreakdown: analysis.languageBreakdown,
          createdAt: new Date().toISOString()
        };
        global.graphs.set(req.params.id, graph);
        return res.json(graph);
      } catch (e) {}
    }

    return res.status(404).json({ message: 'Graph not found in cache' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete history
router.delete('/history/:id', optionalAuthMiddleware, async (req, res) => {
  try {
    global.recentScans = (global.recentScans || []).filter(item => item._id !== req.params.id && item.graphId !== req.params.id);
    global.graphs.delete(req.params.id);

    await logActivity('free_developer', 'delete_history', `Deleted history: ${req.params.id}`, req);
    res.json({ message: 'History deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// AI Code Review for a file
router.post('/review/:graphId', optionalAuthMiddleware, async (req, res) => {
  try {
    const { filePath, repoUrl } = req.body;
    const graph = global.graphs.get(req.params.graphId);
    const targetUrl = (graph && graph.repositoryUrl) || repoUrl;

    if (!targetUrl) return res.status(400).json({ message: 'Repository context not found' });

    const parts = targetUrl.replace('https://github.com/', '').split('/');
    const owner = parts[0];
    const repo = parts[1]?.replace('.git', '');

    if (!owner || !repo) return res.status(400).json({ message: 'Invalid repository URL' });

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
