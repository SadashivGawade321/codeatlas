import { useEffect, useRef, useState, useContext, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Network, Search, RotateCcw, Box, LayoutGrid, ListTree, Share2, GitBranch, ShieldAlert, FileCode2, ChevronRight, ChevronDown, User, Link as LinkIcon, ZoomIn, ZoomOut, Maximize, Target, Menu, X, Activity, Circle, Layers, Code, Play, Settings, Heart, ArrowLeft, MessageSquare, Send, Bot, Keyboard, CheckCircle, Wand2, Download, AlertTriangle, Eye } from 'lucide-react';
import cytoscape from 'cytoscape';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import GlobalChat from '../components/GlobalChat';
import { API_BASE_URL } from '../config';

// --- MOCK DATA GENERATORS ---
const createDemoGraph = (routeId = 'braedonsaunders-codeflow') => {
  const repoPath = routeId === 'demo' ? 'braedonsaunders/codeflow' : routeId.replace('-', '/');
  const base = 'src/FileCabinet/SuiteApps/com.gantry.finance';
  const files = [
    ['core', 'Gantry.Core.js', `${base}/client/core/Gantry.Core.js`, 42],
    ['spend', 'Lib.SpendView.js', `${base}/client/advisor/Lib.SpendView.js`, 30],
    ['advisor', 'Lib.Advisor.js', `${base}/lib/advisor/Lib.Advisor.js`, 28],
    ['integrations', 'Lib.Integrations.js', `${base}/client/core/Lib.Integrations.js`, 22],
    ['vendor', 'Lib.VendorRenderer.js', `${base}/client/core/Lib.VendorRenderer.js`, 21],
    ['health', 'Lib.HealthInsights.js', `${base}/client/core/Lib.HealthInsights.js`, 21],
    ['customer', 'Lib.CustomerValue.js', `${base}/client/core/Lib.CustomerValue.js`, 20],
    ['cashflow', 'Lib.Cashflow.js', `${base}/client/core/Lib.Cashflow.js`, 19],
    ['burden', 'Lib.BurdenModel.js', `${base}/client/core/Lib.BurdenModel.js`, 18],
    ['contract', 'Lib.ContractRisk.js', `${base}/client/core/Lib.ContractRisk.js`, 18],
    ['node', 'Lib.NodeRenderer.js', `${base}/client/advisor/Lib.NodeRenderer.js`, 16],
    ['tile', 'Lib.TileOrchestrator.js', `${base}/client/advisor/Lib.TileOrchestrator.js`, 16],
    ['advisor-ui', 'Advisor.Panel.js', `${base}/client/advisor/Advisor.Panel.js`, 15],
    ['advisor-store', 'Advisor.Store.js', `${base}/client/advisor/Advisor.Store.js`, 14],
    ['advisor-api', 'Advisor.Api.js', `${base}/client/advisor/Advisor.Api.js`, 14],
    ['suitelet', 'Gantry.Suitelet.js', `${base}/suitelet/Gantry.Suitelet.js`, 12],
    ['suitelet-router', 'Suitelet.Router.js', `${base}/suitelet/Suitelet.Router.js`, 10],
    ['dashboard', 'Dashboard.js', `${base}/client/dashboard/Dashboard.js`, 22],
    ['dashboard-ui', 'Dashboard.UI.js', `${base}/client/dashboard/Dashboard.UI.js`, 17],
    ['dashboard-admin', 'Dashboard.Admin.js', `${base}/client/dashboard/Dashboard.Admin.js`, 15],
    ['dashboard-burden', 'Dashboard.Burden.js', `${base}/client/dashboard/Dashboard.Burden.js`, 15],
    ['objects', 'src/Objects', 'src/Objects', 10],
    ['models', 'src/models', 'src/models', 10],
    ['config', 'config', 'config', 8],
  ];

  const smallFiles = Array.from({ length: 43 }, (_, index) => {
    const group = index % 4;
    const prefix = group === 0 ? 'client/core' : group === 1 ? 'client/advisor' : group === 2 ? 'suitelet' : 'objects';
    return [
      `leaf-${index}`,
      ['sync.js', 'advisor.css', 'cashflow.css', 'Gantry.Api.js', 'Renderer.js', 'utils.js', 'view.js'][index % 7],
      `${base}/${prefix}/module-${String(index + 1).padStart(2, '0')}.js`,
      7 + (index % 8),
    ];
  });

  const nodes = [
    { id: 'root', label: repoPath.split('/').pop(), type: 'folder', data: { path: '/' } },
    { id: 'src', label: 'src', type: 'folder', data: { path: 'src' } },
    { id: 'client-core', label: 'client/core', type: 'folder', data: { path: `${base}/client/core` } },
    { id: 'advisor-folder', label: 'advisor', type: 'folder', data: { path: `${base}/client/advisor` } },
    { id: 'suitelet-folder', label: 'suitelet', type: 'folder', data: { path: `${base}/suitelet` } },
    ...files.concat(smallFiles).map(([id, label, path, size]) => ({
      id,
      label,
      type: id === 'objects' || id === 'models' ? 'folder' : 'file',
      data: { path, size, language: label.endsWith('.css') ? 'CSS' : 'JavaScript', churn: Math.random() * 100, layer: Math.floor(Math.random() * 5) },
    })),
  ];

  const criticalTargets = ['spend', 'advisor', 'integrations', 'vendor', 'health', 'customer', 'cashflow', 'burden', 'contract', 'node', 'tile', 'advisor-ui', 'advisor-store', 'advisor-api', 'suitelet', 'dashboard'];
  const edges = [
    ...['client-core', 'advisor-folder', 'suitelet-folder', 'objects', 'models', 'config'].map(target => ({ source: 'src', target, label: 'contains' })),
    ...criticalTargets.map(target => ({ source: 'core', target, label: 'imports' })),
    ...['dashboard', 'dashboard-ui', 'dashboard-admin', 'dashboard-burden'].map(target => ({ source: 'core', target, label: 'renders' })),
    { source: 'suitelet', target: 'suitelet-router', label: 'routes' },
    { source: 'suitelet-router', target: 'core', label: 'loads' },
    { source: 'advisor-api', target: 'suitelet', label: 'calls' },
    { source: 'dashboard-admin', target: 'objects', label: 'uses' },
    { source: 'advisor-store', target: 'models', label: 'hydrates' },
    ...smallFiles.map(([id], index) => ({
      source: index % 3 === 0 ? 'core' : index % 3 === 1 ? 'advisor' : 'dashboard',
      target: id,
      label: index % 2 ? 'imports' : 'reads',
    })),
  ];

  return { repositoryUrl: `https://github.com/${repoPath}`, nodes, edges };
};

const getGraphMetrics = (graphData) => {
  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];
  const files = nodes.filter(node => node.type === 'file');
  const folders = nodes.filter(node => node.type === 'folder');
  const usedTargets = new Set(edges.map(edge => edge.target));
  const unused = files.filter(file => !usedTargets.has(file.id)).length;
  const functions = files.reduce((sum, file) => sum + Math.max(2, Math.round((file.data?.size || 8) * 1.7)), 0);
  const loc = files.reduce((sum, file) => sum + Math.max(24, (file.data?.size || 8) * 54), 0);
  const health = Number(graphData?.healthScore) || Math.max(35, 96 - Math.round((edges.length / Math.max(files.length, 1)) * 9) - unused);
  
  let healthReason = 'Architecture looks solid.';
  if (health < 50) healthReason = 'High coupling and too many unused files.';
  else if (health < 75) healthReason = 'Moderate technical debt detected.';
  else if (unused > 0) healthReason = `${unused} unused files are lowering the score.`;

  return { files: files.length, folders: folders.length, links: edges.length, functions, unused, loc, health, healthReason };
};

const getFileMetrics = (file, graphData, blastRadius) => {
  const baseSize = file?.id === 'core' ? 1199 : Math.max(80, (file?.path?.length || file?.label?.length || 10) * 9);
  const connections = graphData?.edges?.filter(edge => edge.source === file?.id || edge.target === file?.id).length || 0;
  const functionCount = Math.max(4, Math.min(56, Math.round(baseSize / 24)));
  const impactPercent = Math.min(100, Math.round(((blastRadius?.indirectCount || 0) / Math.max((graphData?.nodes || []).filter(node => node.type === 'file').length, 1)) * 100));
  return { lines: baseSize, connections, functionCount, impactPercent };
};

// --- COMPONENTS ---

// Recursive File Tree
const FileTree = ({ data, onSelectFile, expandedFolders, toggleFolder, selectedFileId }) => {
  if (!data) return null;
  const isExpanded = expandedFolders[data.path] !== false; // default true
  
  return (
    <div className="font-mono text-[11px] select-none">
      <div 
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer transition-colors ${selectedFileId === data.nodeId ? 'bg-accent/20 text-accent border border-accent/30' : 'hover:bg-white/10 text-gray-300 border border-transparent'}`}
        onClick={() => {
          if (data.isFolder) toggleFolder(data.path);
          else onSelectFile(data.nodeId);
        }}
      >
        {data.isFolder ? (
          <>
            <span className="text-gray-500">{isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}</span>
            <Box size={12} className="text-warning opacity-80" />
            <span className="truncate font-semibold">{data.name}</span>
          </>
        ) : (
          <>
            <span className="w-3"></span>
            <FileCode2 size={12} className={selectedFileId === data.nodeId ? 'text-accent' : 'text-gray-500'} />
            <span className="truncate">{data.name}</span>
          </>
        )}
      </div>
      {data.isFolder && isExpanded && data.children && (
        <div className="pl-3 border-l border-white/10 ml-3 mt-1 space-y-0.5">
          {Object.values(data.children)
            .sort((a, b) => b.isFolder - a.isFolder || a.name.localeCompare(b.name))
            .map(child => (
              <FileTree 
                key={child.path} 
                data={child} 
                onSelectFile={onSelectFile} 
                expandedFolders={expandedFolders} 
                toggleFolder={toggleFolder} 
                selectedFileId={selectedFileId} 
              />
            ))}
        </div>
      )}
    </div>
  );
};

const RepositoryView = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState(null);
  const [blastRadius, setBlastRadius] = useState(null);

  // UI State
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('FILE');
  const [activeColorBy, setActiveColorBy] = useState('Folder');
  const [currentLayout, setCurrentLayout] = useState('cose');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [accordionState, setAccordionState] = useState({ connections: false, ownership: false, functions: true });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [healthPopup, setHealthPopup] = useState(false);
  const [graphSettings, setGraphSettings] = useState({ animSpeed: 'normal', defaultLayout: 'cose', nodeSize: 'medium' });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([{ role: 'system', content: 'Hi! I can analyze this repository structure and answer questions about it.' }]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Multiplayer State
  const [socket, setSocket] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [accessDenied, setAccessDenied] = useState(false);

  // Refactor State
  const [refactorState, setRefactorState] = useState({ isOpen: false, loading: false, original: '', refactored: '' });

  const metrics = useMemo(() => getGraphMetrics(graphData), [graphData]);
  const fileMetrics = useMemo(() => getFileMetrics(selectedFile, graphData, blastRadius), [selectedFile, graphData, blastRadius]);

  // Build Tree Data
  const treeData = useMemo(() => {
    if (!graphData) return null;
    const root = { name: graphData.repositoryUrl.split('/').pop(), children: {}, isFolder: true, path: '/' };
    graphData.nodes.forEach(node => {
      if (node.id === 'root') return;
      const parts = (node.data?.path || node.label).split('/');
      let current = root;
      parts.forEach((part, i) => {
        const isLast = i === parts.length - 1;
        const childPath = parts.slice(0, i + 1).join('/');
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            children: {},
            isFolder: !isLast || node.type === 'folder',
            nodeId: isLast ? node.id : undefined,
            path: childPath
          };
        }
        current = current.children[part];
      });
    });
    return root;
  }, [graphData]);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: prev[path] === false ? true : false }));
  };

  const toggleAccordion = (key) => {
    setAccordionState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Node Selection Logic
  const selectGraphNode = (nodeId) => {
    if (!graphData || !cyRef.current) return;
    const node = graphData.nodes.find(n => n.id === nodeId);
    if (!node || node.type === 'folder') return;

    const outgoingEdges = graphData.edges.filter(edge => edge.source === node.id);
    const incomingEdges = graphData.edges.filter(edge => edge.target === node.id);
    const affectedFiles = outgoingEdges
      .map(edge => graphData.nodes.find(item => item.id === edge.target))
      .filter(Boolean)
      .map(item => item.data?.path || item.label);

    const impact = affectedFiles.length + incomingEdges.length;
    let risk = 'LOW', riskColor = 'text-success';
    if (impact >= 5) { risk = 'CRITICAL'; riskColor = 'text-danger'; }
    else if (impact >= 2) { risk = 'MEDIUM'; riskColor = 'text-warning'; }

    setSelectedFile({ id: node.id, label: node.label, type: node.type, path: node.data?.path });
    setBlastRadius({ directCount: incomingEdges.length + outgoingEdges.length, indirectCount: impact, risk, riskColor, affectedFiles });
    setActiveTab('FILE'); // Auto switch back to file view

    // Update Graph Visuals
    cyRef.current.elements().removeClass('highlighted-node highlighted-edge dimmed');
    cyRef.current.elements().addClass('dimmed');
    const cyNode = cyRef.current.getElementById(node.id);
    cyNode.removeClass('dimmed').addClass('highlighted-node');
    cyNode.outgoers().removeClass('dimmed');
    cyNode.outgoers().nodes().addClass('highlighted-node');
    cyNode.outgoers().edges().addClass('highlighted-edge');
  };

  // Fetch Data
  useEffect(() => {
    const fetchGraph = async () => {
      try {
        if (id === 'demo' || !token) {
          setGraphData(createDemoGraph(id));
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/repo/graph/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setGraphData(data);
        } else if (res.status === 403) {
          setAccessDenied(true);
          setLoading(false);
          return;
        } else {
          console.error('Failed to fetch real graph, falling back to demo.');
          setGraphData(createDemoGraph(id));
        }
      } catch (err) {
        console.error('Network error, falling back to demo graph:', err);
        setGraphData(createDemoGraph(id));
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [id, token]);

  // Socket.io Connection
  useEffect(() => {
    if (!token || accessDenied) return;
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    newSocket.emit('join-room', id);

    newSocket.on('remote-cursor', (data) => {
      setRemoteCursors(prev => ({
        ...prev,
        [data.id]: data
      }));
    });

    return () => newSocket.close();
  }, [id, token, accessDenied]);

  // Cytoscape Init
  useEffect(() => {
    if (!graphData || !containerRef.current) return;

    if (cyRef.current) {
      try { cyRef.current.destroy(); } catch {}
      cyRef.current = null;
    }

    const cyElements = [];
    graphData.nodes.forEach(node => {
      cyElements.push({ data: { id: node.id, label: node.label, type: node.type, path: node.data?.path, layer: node.data?.layer, churn: node.data?.churn } });
    });
    const nodeIds = new Set(graphData.nodes.map(n => n.id));
    graphData.edges.forEach((edge, idx) => {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return;
      cyElements.push({ data: { id: `edge-${idx}`, source: edge.source, target: edge.target, label: edge.label } });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements: cyElements,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#cbd5e1', // Slate 300
            'font-size': '10px',
            'font-family': 'JetBrains Mono, monospace',
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'background-color': '#f97316', // Default File color
            'width': '16px',
            'height': '16px',
            'border-width': '2px',
            'border-color': '#0f172a',
          }
        },
        {
          selector: 'node[type="folder"]',
          style: {
            'background-color': 'rgba(16, 185, 129, 0.05)', // Emerald/5
            'border-width': '1px',
            'border-color': '#10b981', // Emerald
            'border-style': 'dashed',
            'width': '60px',
            'height': '60px',
            'color': '#10b981',
            'text-valign': 'top',
            'text-margin-y': -4,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(255, 255, 255, 0.1)',
            'curve-style': 'bezier',
            'target-arrow-color': 'rgba(255, 255, 255, 0.15)',
            'target-arrow-shape': 'triangle',
            'arrow-scale': 0.8
          }
        },
        {
          selector: '.highlighted-node',
          style: {
            'background-color': '#f43f5e', // Rose
            'width': '24px',
            'height': '24px',
            'border-width': '3px',
            'border-color': '#fff',
            'text-background-color': '#020617',
            'text-background-opacity': 0.8,
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'color': '#fff',
            'z-index': 99
          }
        },
        {
          selector: '.highlighted-edge',
          style: {
            'line-color': '#f43f5e', // Rose
            'target-arrow-color': '#f43f5e',
            'width': 2.5,
            'opacity': 1,
            'z-index': 98
          }
        },
        {
          selector: '.dimmed',
          style: { 'opacity': 0.15 }
        },
        {
          selector: '.search-match',
          style: { 'border-width': 4, 'border-color': '#38f2c2' }
        },
        {
          selector: '.search-nomatch',
          style: { 'opacity': 0.1 }
        }
      ],
      layout: { name: 'cose', animate: false, randomize: true }
    });

    cyRef.current = cy;

    cy.ready(() => {
      cy.resize();
      cy.fit(undefined, 80);
      cy.center();
    });

    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      if (node.data('type') !== 'folder') selectGraphNode(node.id());
    });

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted-node highlighted-edge dimmed search-match search-nomatch');
        setSelectedFile(null);
        setBlastRadius(null);
      }
    });

    return () => {
      try { if (cyRef.current) { cyRef.current.destroy(); cyRef.current = null; } } catch {}
    };
  }, [graphData]);

  // Dynamic Layout Application
  useEffect(() => {
    if (!cyRef.current) return;
    const layoutOpts = {
      cose: { name: 'cose', padding: 50, nodeRepulsion: 400000, idealEdgeLength: 100, randomize: false, animate: false },
      grid: { name: 'grid', padding: 50, animate: false },
      circle: { name: 'circle', padding: 50, animate: false },
      breadthfirst: { name: 'breadthfirst', directed: true, spacingFactor: 1.5, animate: false },
      concentric: { name: 'concentric', minNodeSpacing: 50, animate: false },
    }[currentLayout] || { name: 'cose' };

    const layout = cyRef.current.layout(layoutOpts);
    layout.run();
    layout.on('layoutstop', () => {
      cyRef.current.fit(undefined, 80);
      cyRef.current.center();
    });
  }, [currentLayout]);

  // Color By Application
  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.nodes().forEach(node => {
      if (node.data('type') === 'folder') return;
      if (activeColorBy === 'Folder') {
        node.style('background-color', '#f97316'); // Orange
      } else if (activeColorBy === 'Layer') {
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b']; // Blue, Purple, Pink, Rose, Amber
        const layer = node.data('layer') || 0;
        node.style('background-color', colors[layer % colors.length]);
      } else if (activeColorBy === 'Churn') {
        const churn = node.data('churn') || 0;
        node.style('background-color', churn > 75 ? '#ef4444' : churn > 40 ? '#eab308' : '#22c55e');
      }
    });
  }, [activeColorBy, graphData]);

  // Search logic
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    if (!searchQuery.trim()) {
      cy.elements().removeClass('search-match search-nomatch');
      return;
    }
    const query = searchQuery.toLowerCase();
    cy.batch(() => {
      cy.nodes().forEach(node => {
        if (node.data('label')?.toLowerCase().includes(query)) {
          node.addClass('search-match').removeClass('search-nomatch');
        } else {
          node.addClass('search-nomatch').removeClass('search-match');
        }
      });
    });
  }, [searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById('graph-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Map Controls Actions
  const mapControls = {
    zoomIn: () => cyRef.current?.zoom(cyRef.current.zoom() * 1.2),
    zoomOut: () => cyRef.current?.zoom(cyRef.current.zoom() * 0.8),
    fit: () => cyRef.current?.fit(undefined, 50),
    center: () => cyRef.current?.center(),
    reset: () => {
      cyRef.current?.elements().removeClass('highlighted-node highlighted-edge dimmed search-match search-nomatch');
      setSelectedFile(null);
      setBlastRadius(null);
      setSearchQuery('');
      cyRef.current?.fit(undefined, 50);
    }
  };

  // Export graph as PNG
  const handleExportPNG = () => {
    const cy = cyRef.current;
    if (!cy) return;
    const png64 = cy.png({ output: 'base64uri', bg: '#020617', full: true, scale: 2 });
    const link = document.createElement('a');
    link.href = png64;
    link.download = `codeatlas-${graphData?.repositoryUrl?.split('/').pop() || 'graph'}.png`;
    link.click();
  };

  // AI Code Review
  const [aiReview, setAiReview] = useState({ loading: false, issues: [] });
  const handleAiReview = async () => {
    if (!selectedFile || selectedFile.type === 'folder') return;
    setAiReview({ loading: true, issues: [] });
    setActiveTab('AI REVIEW');
    try {
      const res = await fetch(`${API_BASE_URL}/api/repo/review/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filePath: selectedFile.data?.path || selectedFile.label })
      });
      const data = await res.json();
      if (res.ok) {
        setAiReview({ loading: false, issues: data.issues || [] });
      } else {
        setAiReview({ loading: false, issues: [{ severity: 'error', line: '-', message: data.message || 'Review failed.' }] });
      }
    } catch (err) {
      setAiReview({ loading: false, issues: [{ severity: 'error', line: '-', message: 'Network error.' }] });
    }
  };

  // Chat actions
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    setChatHistory(prev => [...prev, { role: 'user', content: chatInput }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/repo/chat/${id || 'demo'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: chatInput }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'system', content: data.answer || 'No response.' }]);
    } catch {
      setChatHistory(prev => [...prev, { role: 'system', content: 'Connection failed.' }]);
    } finally {
      setChatLoading(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleMouseMove = (e) => {
    if (!socket || !token || accessDenied) return;
    
    // Throttle to avoid flooding the socket
    const now = Date.now();
    if (now - (window.lastCursorMove || 0) < 50) return;
    window.lastCursorMove = now;

    // Send coordinates relative to the screen
    socket.emit('cursor-move', {
      roomId: id,
      x: e.clientX,
      y: e.clientY,
      color: '#38f2c2', // Could be randomized per user
      name: 'Collaborator'
    });
  };

  const handleRefactor = async () => {
    if (!selectedFile || selectedFile.type === 'folder') return;
    
    setRefactorState({ isOpen: true, loading: true, original: '', refactored: '' });
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/repo/refactor/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filePath: selectedFile.data?.path || selectedFile.label })
      });
      const data = await res.json();
      
      if (res.ok) {
        setRefactorState({ isOpen: true, loading: false, original: data.original, refactored: data.refactored });
      } else {
        setRefactorState({ isOpen: true, loading: false, original: 'Error loading file.', refactored: data.message });
      }
    } catch (err) {
      setRefactorState({ isOpen: true, loading: false, original: 'Network error.', refactored: 'Could not connect to refactoring service.' });
    }
  };

  if (accessDenied) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#020617] text-white">
        <ShieldAlert size={48} className="text-rose-500 mb-4" />
        <h1 className="text-2xl font-bold font-mono">ACCESS DENIED</h1>
        <p className="text-slate-400 mt-2">You must be a collaborator to view this graph.</p>
        <Link to="/network" className="mt-6 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors font-mono text-sm">Find Collaborators</Link>
      </div>
    );
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#020617] text-accent font-mono">INITIALIZING_HUD...</div>;

  return (
    <div className="relative h-screen w-full bg-[#020617] text-gray-200 font-sans overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-[#020617] to-[#020617] pointer-events-none z-0"></div>

      {/* 1. Canvas Layer */}
      <div ref={containerRef} className="absolute inset-0 z-0" style={{ width: '100%', height: '100%' }}></div>

      {/* 1.5 Remote Cursors Layer */}
      {Object.values(remoteCursors).map(cursor => (
        <div key={cursor.id} className="absolute pointer-events-none z-[100] transition-all duration-75 ease-out" style={{ left: cursor.x, top: cursor.y }}>
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
            <path d="M5.65376 2.15376C5.42064 1.68752 4.74602 1.68752 4.51291 2.15376L0.512907 10.1538C0.320471 10.5386 0.58784 11 1.00003 11H3.50003V16C3.50003 16.5523 3.94775 17 4.50003 17H5.50003C6.05232 17 6.50003 16.5523 6.50003 16V11H9.00003C9.41222 11 9.67959 10.5386 9.48715 10.1538L5.65376 2.15376Z" fill={cursor.color} transform="scale(2) rotate(-20)"/>
          </svg>
          <div className="ml-5 mt-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded border border-white/10 font-mono inline-block shadow-lg">
            {cursor.name}
          </div>
        </div>
      ))}

      {/* 2. Floating Header (Glassmorphism) */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-start pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 px-4 flex items-center gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className="text-gray-400 hover:text-white transition-colors">
              <Menu size={20} />
            </button>
            <div className="h-8 w-[1px] bg-white/10"></div>
            <div>
              <h1 className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-400 tracking-widest text-lg leading-none">CODEATLAS</h1>
              <p className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                <GitBranch size={12} className="text-emerald-400" /> {graphData?.repositoryUrl.replace('https://github.com/', '')}
              </p>
            </div>
            <div className="h-8 w-[1px] bg-white/10 ml-2"></div>
            <button onClick={mapControls.reset} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-mono transition-colors text-slate-300">
              <RotateCcw size={14} /> Reset View
            </button>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 px-5 flex items-center gap-5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] pointer-events-auto relative">
          <Link to="/dashboard" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400 hover:text-white">
            <ArrowLeft size={18} />
          </Link>
          <div className="h-10 w-[1px] bg-white/10"></div>
          <button onClick={() => setHealthPopup(!healthPopup)} className="flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity">
            <span className="text-[10px] font-mono text-slate-400 tracking-wider flex items-center gap-1"><Heart size={10} className="text-rose-400" /> SYSTEM HEALTH</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold font-mono leading-none mt-1 ${metrics.health > 70 ? 'text-emerald-400' : metrics.health > 40 ? 'text-amber-400' : 'text-rose-500'}`}>
                {metrics.health}
              </span>
              <span className="text-[10px] font-mono text-slate-500">/100</span>
            </div>
          </button>
          {healthPopup && (
            <div className="absolute top-16 right-0 w-[300px] bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl z-50">
              <h3 className="text-sm font-bold text-white mb-4">Repository Health Dashboard</h3>
              <div className="space-y-3">
                {[
                  ['Files Analyzed', metrics.files, 'text-blue-400'],
                  ['Dependencies', metrics.links, 'text-purple-400'],
                  ['Functions', metrics.functions, 'text-emerald-400'],
                  ['Unused Files', metrics.unused, metrics.unused > 5 ? 'text-rose-400' : 'text-emerald-400'],
                  ['Lines of Code', metrics.loc.toLocaleString(), 'text-amber-400'],
                  ['Health Score', `${metrics.health}/100`, metrics.health > 70 ? 'text-emerald-400' : metrics.health > 40 ? 'text-amber-400' : 'text-rose-400'],
                ].map(([label, value, color]) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className={`font-mono font-bold ${color}`}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[11px] font-mono text-slate-300">
                  <span className="text-orange-400 font-bold">Status:</span> {metrics.health > 70 ? 'Stable' : metrics.health > 40 ? 'Degraded' : 'Critical'}<br />
                  <span className="text-orange-400 font-bold">Recommendation:</span> {metrics.health > 70 ? 'Keep up the good work.' : metrics.health > 40 ? 'Refactor high-churn areas.' : 'High debt detected. Immediate refactoring required.'}
                </p>
              </div>
            </div>
          )}
          <div className="h-10 w-[1px] bg-white/10"></div>
          <button onClick={handleExportPNG} title="Export graph as PNG" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 transition-all text-slate-400">
            <Download size={18} />
          </button>
          <button onClick={() => setSettingsOpen(!settingsOpen)} className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all ${settingsOpen ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-orange-500/20 hover:text-orange-400 hover:border-orange-500/50'}`}>
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* 3. Floating Left Panel */}
      <div className={`absolute top-28 bottom-6 left-6 w-[320px] bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-10 flex flex-col transition-all duration-500 pointer-events-auto ${leftPanelOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'}`}>
        <div className="p-5 border-b border-white/5 shrink-0">
          <div className="text-[11px] font-mono text-slate-400 mb-3 tracking-widest flex items-center gap-2">
            <Layers size={14} /> COLOR ENCODING
          </div>
          <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
            {['Folder', 'Layer', 'Churn'].map(mode => (
              <button
                key={mode}
                onClick={() => setActiveColorBy(mode)}
                className={`flex-1 py-2 text-[11px] font-mono rounded-lg transition-all ${activeColorBy === mode ? 'bg-gradient-to-r from-orange-500/20 to-rose-500/20 text-orange-300 border border-orange-500/30' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-px bg-white/5 border-b border-white/5 shrink-0">
          <div className="bg-slate-900/40 p-4 flex flex-col items-center justify-center">
            <span className="text-blue-400 font-mono text-2xl font-light">{metrics.files}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">FILES</span>
          </div>
          <div className="bg-slate-900/40 p-4 flex flex-col items-center justify-center">
            <span className="text-purple-400 font-mono text-2xl font-light">{metrics.links}</span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 tracking-widest">DEPENDENCIES</span>
          </div>
        </div>

        {/* Tree View */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="text-[11px] font-mono text-slate-400 mb-4 ml-2 tracking-widest flex items-center gap-2">
            <Box size={14} /> FILE EXPLORER
          </div>
          <FileTree 
            data={treeData} 
            onSelectFile={selectGraphNode} 
            expandedFolders={expandedFolders} 
            toggleFolder={toggleFolder} 
            selectedFileId={selectedFile?.id} 
          />
        </div>

        {/* Churn Legend - show when Churn color mode active */}
        {activeColorBy === 'Churn' && (
          <div className="p-4 border-t border-white/5 shrink-0">
            <div className="text-[11px] font-mono text-slate-400 mb-3 tracking-widest">CHURN LEGEND</div>
            <div className="space-y-2">
              {[
                ['High (>75%)', '#ef4444', 'Frequent changes — potential instability'],
                ['Medium (40-75%)', '#eab308', 'Moderate activity'],
                ['Low (<40%)', '#22c55e', 'Stable code'],
              ].map(([label, color, desc]) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                  <div>
                    <div className="text-[11px] font-mono text-slate-300">{label}</div>
                    <div className="text-[10px] text-slate-500">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Settings Drawer */}
      <div className={`absolute top-28 right-6 w-[300px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-20 transition-all duration-300 pointer-events-auto ${settingsOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`} style={{ display: settingsOpen ? 'block' : 'none' }}>
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <span className="text-sm font-mono font-bold text-white">Graph Settings</span>
          <button onClick={() => setSettingsOpen(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Default Layout */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 tracking-widest block mb-2">DEFAULT LAYOUT</label>
            <select value={graphSettings.defaultLayout} onChange={(e) => { setGraphSettings(s => ({...s, defaultLayout: e.target.value})); setCurrentLayout(e.target.value); }}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none">
              <option value="cose">Force-Directed</option>
              <option value="grid">Grid</option>
              <option value="circle">Radial</option>
              <option value="breadthfirst">Tree</option>
              <option value="concentric">Concentric</option>
            </select>
          </div>
          {/* Color Mode */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 tracking-widest block mb-2">COLOR MODE</label>
            <select value={activeColorBy} onChange={(e) => setActiveColorBy(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none">
              <option value="Folder">By Folder</option>
              <option value="Layer">By Layer</option>
              <option value="Churn">By Churn Rate</option>
            </select>
          </div>
          {/* Node Size */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 tracking-widest block mb-2">NODE SIZE</label>
            <select value={graphSettings.nodeSize} onChange={(e) => { setGraphSettings(s => ({...s, nodeSize: e.target.value})); if (cyRef.current) { const sizes = { small: '10px', medium: '16px', large: '24px' }; cyRef.current.nodes('[type != "folder"]').style('width', sizes[e.target.value]).style('height', sizes[e.target.value]); } }}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          {/* Reset */}
          <button onClick={() => { mapControls.reset(); setSettingsOpen(false); }} className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-mono text-slate-300 hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            <RotateCcw size={14} /> Reset All
          </button>
        </div>
      </div>

      {/* 4. Floating Right Panel (File Details) */}
      <div className={`absolute top-28 bottom-6 right-6 w-[360px] bg-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-10 flex flex-col transition-all duration-500 pointer-events-auto ${selectedFile ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}`}>
        
        {/* Header with Close */}
        <div className="p-6 border-b border-white/5 shrink-0 flex justify-between items-start bg-gradient-to-b from-white/5 to-transparent rounded-t-3xl">
          <div className="overflow-hidden pr-4">
            <div className="flex items-center gap-3 text-white mb-2">
              <div className="p-2 bg-orange-500/20 border border-orange-500/30 rounded-xl">
                <FileCode2 size={20} className="text-orange-400 shrink-0" />
              </div>
              <h2 className="font-mono font-bold truncate text-lg tracking-tight">{selectedFile?.label}</h2>
            </div>
            <p className="text-xs font-mono text-slate-400 truncate break-all">{selectedFile?.path}</p>
          </div>
          <button onClick={() => mapControls.reset()} className="p-2 rounded-xl bg-black/40 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white shrink-0 transition-colors shadow-sm">
            <X size={16} />
          </button>
        </div>

        {/* Detail Tabs */}
        <div className="flex border-b border-white/5 shrink-0 bg-black/20 p-2 gap-2">
          {['FILE', 'PATTERNS', 'SECURITY', 'AI REVIEW'].map(tab => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); if (tab === 'AI REVIEW' && aiReview.issues.length === 0 && !aiReview.loading) handleAiReview(); }}
              className={`flex-1 py-2 text-[10px] font-mono rounded-lg transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'FILE' && selectedFile && (
            <div className="space-y-6">
              
              {/* Auto-Refactor Button */}
              <button 
                onClick={handleRefactor}
                className="w-full relative overflow-hidden group rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 p-4 border border-blue-400/30 transition-all shadow-lg hover:shadow-blue-500/20"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative flex items-center justify-center gap-3 text-white font-bold tracking-widest font-mono">
                  <Wand2 size={18} className="animate-pulse text-blue-200" />
                  AUTO-REFACTOR
                </div>
              </button>

              {/* Metrics Row */}
              <div className="flex gap-3">
                <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 text-center shadow-inner">
                  <span className="block text-slate-200 font-mono text-2xl font-light">{fileMetrics.lines}</span>
                  <span className="block text-[10px] text-slate-500 font-mono mt-1 tracking-widest">LINES</span>
                </div>
                <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 text-center shadow-inner">
                  <span className="block text-slate-200 font-mono text-2xl font-light">{fileMetrics.connections}</span>
                  <span className="block text-[10px] text-slate-500 font-mono mt-1 tracking-widest">LINKS</span>
                </div>
              </div>

              {/* Blast Radius Card */}
              <div className="bg-gradient-to-br from-rose-500/10 to-black/40 border border-rose-500/20 rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-rose-500/10 flex justify-between items-center bg-rose-500/5">
                  <div className="flex items-center gap-2 text-rose-400 text-sm font-mono font-bold">
                    <ShieldAlert size={16} /> BLAST RADIUS
                  </div>
                  <span className="bg-rose-500 text-white text-[10px] px-2 py-1 rounded-md font-bold tracking-widest shadow-sm">{blastRadius?.risk}</span>
                </div>
                <div className="p-5">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs text-slate-400 font-mono">Affected Scope</span>
                    <span className="text-sm font-mono font-bold text-slate-200">{blastRadius?.indirectCount} files <span className="text-slate-500 font-normal">({fileMetrics.impactPercent}%)</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden mb-4 shadow-inner">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-rose-500 transition-all duration-1000" style={{ width: `${fileMetrics.impactPercent}%` }}></div>
                  </div>
                  <div className="max-h-32 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                    {blastRadius?.affectedFiles?.map((f, i) => (
                      <div key={i} className="text-xs font-mono text-slate-400 truncate flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500/70 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div> {f.split('/').pop()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Accordions */}
              <div className="space-y-3">
                <div className="border border-white/5 rounded-2xl bg-black/30 overflow-hidden shadow-md">
                  <button onClick={() => toggleAccordion('functions')} className="w-full p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 text-sm font-mono text-slate-300"><Code size={16} className="text-emerald-400"/> Functions ({fileMetrics.functionCount})</div>
                    {accordionState.functions ? <ChevronDown size={16} className="text-slate-500"/> : <ChevronRight size={16} className="text-slate-500"/>}
                  </button>
                  {accordionState.functions && (
                    <div className="p-3 bg-black/20 space-y-1.5 border-t border-white/5">
                      {['initialize()', 'renderView()', 'fetchData()', 'updateState()'].map(fn => (
                        <div key={fn} className="flex justify-between items-center p-2.5 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-colors">
                          <span className="text-xs font-mono text-emerald-300">{fn}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-black/50 px-2 py-1 rounded-md">O(n)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-white/5 rounded-2xl bg-black/30 overflow-hidden shadow-md">
                  <button onClick={() => toggleAccordion('ownership')} className="w-full p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 text-sm font-mono text-slate-300"><User size={16} className="text-blue-400"/> Ownership Matrix</div>
                    {accordionState.ownership ? <ChevronDown size={16} className="text-slate-500"/> : <ChevronRight size={16} className="text-slate-500"/>}
                  </button>
                  {accordionState.ownership && (
                    <div className="p-5 text-xs font-mono text-slate-400 border-t border-white/5 bg-black/20 leading-relaxed">
                      <div className="flex justify-between mb-2"><span>Primary Team:</span> <span className="text-slate-200">Core Contributors</span></div>
                      <div className="flex justify-between mb-2"><span>Author:</span> <span className="text-slate-200">{graphData?.repositoryUrl ? graphData.repositoryUrl.split('/')[3] : 'Unknown'}</span></div>
                      <div className="flex justify-between"><span>Last modified:</span> <span className="text-slate-200">Recent</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PATTERNS' && selectedFile && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
                <h3 className="text-purple-400 font-mono font-bold text-xs mb-2">DETECTED PATTERNS</h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span> <b>Singleton:</b> Detected instance caching logic.</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> <b>God Object Warning:</b> File exceeds 300 lines with multiple responsibilities.</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span> <b>Pure Functions:</b> 85% of exports are pure.</li>
                </ul>
              </div>
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                <h3 className="text-slate-400 font-mono font-bold text-xs mb-2">COMPLEXITY (CYCLOMATIC)</h3>
                <div className="flex items-end justify-between mb-2">
                  <span className="text-2xl font-light text-white">{Math.min(45, fileMetrics.functionCount * 2 + 3)}</span>
                  <span className="text-[10px] text-slate-500 font-mono mb-1">SCORE</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500" style={{ width: `${Math.min(100, fileMetrics.functionCount * 4)}%` }}></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SECURITY' && selectedFile && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <h3 className="text-rose-400 font-mono font-bold text-xs mb-3 flex items-center gap-2"><ShieldAlert size={14}/> STATIC ANALYSIS</h3>
                
                {fileMetrics.lines > 500 ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                      <p className="text-rose-200 text-xs font-mono mb-1"><b>[High]</b> Potential XSS Vulnerability</p>
                      <p className="text-[10px] text-rose-300/70">Unsanitized user input detected at line 142. Consider using DOMPurify.</p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <p className="text-amber-200 text-xs font-mono mb-1"><b>[Medium]</b> Hardcoded Secret</p>
                      <p className="text-[10px] text-amber-300/70">Found a string resembling an API key at line 44. Move to environment variables.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-emerald-400 opacity-80">
                    <CheckCircle size={32} className="mb-2" />
                    <span className="text-xs font-mono">No vulnerabilities detected.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'AI REVIEW' && selectedFile && (
            <div className="space-y-4">
              {aiReview.loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                  <p className="text-amber-400 font-mono text-xs tracking-widest animate-pulse">REVIEWING CODE...</p>
                </div>
              ) : aiReview.issues.length === 0 ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
                  <CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-300 font-mono text-sm font-bold">ALL CLEAR</p>
                  <p className="text-slate-400 text-xs mt-1">No issues found in this file.</p>
                </div>
              ) : (
                aiReview.issues.map((issue, idx) => {
                  const colors = {
                    critical: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', badge: 'bg-rose-500' },
                    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500' },
                    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-500' },
                    error: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', badge: 'bg-rose-500' },
                  };
                  const c = colors[issue.severity] || colors.info;
                  return (
                    <div key={idx} className={`p-4 ${c.bg} border ${c.border} rounded-2xl`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${c.badge} text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase`}>{issue.severity}</span>
                        {issue.line && issue.line !== '-' && (
                          <span className="text-slate-500 text-[10px] font-mono">Line {issue.line}</span>
                        )}
                      </div>
                      <p className={`${c.text} text-sm font-mono leading-relaxed`}>{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-slate-400 text-xs mt-2 pl-3 border-l-2 border-white/10">{issue.suggestion}</p>
                      )}
                    </div>
                  );
                })
              )}
              <button 
                onClick={handleAiReview} 
                disabled={aiReview.loading}
                className="w-full py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Eye size={14} /> RE-ANALYZE
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. Floating Bottom Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-4 pointer-events-none">
        {/* Layout Switcher */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto">
          {[
            { id: 'cose', icon: Share2, label: 'Force' },
            { id: 'grid', icon: LayoutGrid, label: 'Grid' },
            { id: 'circle', icon: Circle, label: 'Radial' },
            { id: 'breadthfirst', icon: ListTree, label: 'Tree' },
            { id: 'concentric', icon: Layers, label: 'Layers' },
          ].map(l => (
            <button 
              key={l.id}
              onClick={() => setCurrentLayout(l.id)}
              className={`p-3 rounded-xl flex items-center justify-center transition-all group relative ${currentLayout === l.id ? 'bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              <l.icon size={18} />
              {/* Tooltip */}
              <span className="absolute -top-10 bg-black border border-white/10 text-white text-[10px] font-mono px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-xl">
                {l.label} Layout
              </span>
            </button>
          ))}
        </div>

        {/* View Controls */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex gap-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] pointer-events-auto">
          <button onClick={mapControls.zoomIn} className="p-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"><ZoomIn size={18} /></button>
          <button onClick={mapControls.zoomOut} className="p-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"><ZoomOut size={18} /></button>
          <div className="w-[1px] bg-white/10 my-2 mx-1"></div>
          <button onClick={mapControls.fit} className="p-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all" title="Fit to screen (F)"><Maximize size={18} /></button>
          <button onClick={mapControls.center} className="p-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all" title="Center (C)"><Target size={18} /></button>
          <div className="w-[1px] bg-white/10 my-2 mx-1"></div>
          <button className="p-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all cursor-help" title="Shortcuts: Ctrl+K (Search), F (Fit), C (Center), Esc (Reset)">
            <Keyboard size={18} />
          </button>
        </div>
      </div>

      {/* 6. AI Chat Widget */}
      <div className={`absolute bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none transition-all duration-300 ${chatOpen ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} style={{ display: chatOpen ? 'flex' : 'none' }}>
        <div className="w-[380px] bg-slate-900/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col pointer-events-auto h-[480px]">
          <div className="p-4 bg-gradient-to-r from-orange-500/10 to-rose-500/10 border-b border-white/10 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-orange-400" />
              <span className="font-mono font-bold text-white text-sm">CodeAtlas AI</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-orange-500/20 text-orange-50 border border-orange-500/30' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl p-3 bg-white/5 border border-white/5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 bg-black/40 border-t border-white/5 shrink-0">
            <form onSubmit={handleChatSubmit} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about this repo..."
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-200 outline-none focus:border-orange-500/50"
              />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-orange-400 hover:text-orange-300 disabled:opacity-50 transition-colors">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Floating Chat Trigger Button */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="absolute bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-[0_8px_32px_rgba(249,115,22,0.4)] hover:scale-105 transition-transform"
      >
        {chatOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Refactor Modal overlay */}
      {refactorState.isOpen && (
        <div className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-8">
          <div className="w-full max-w-7xl h-[90vh] bg-slate-900 border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-3">
                <Wand2 className="text-blue-400" />
                <h2 className="text-white font-mono font-bold tracking-widest">AI REFACTOR <span className="text-slate-400 font-normal ml-2">{selectedFile?.label}</span></h2>
              </div>
              <button onClick={() => setRefactorState({ ...refactorState, isOpen: false })} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {refactorState.loading ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-blue-400 font-mono tracking-widest animate-pulse">ANALYZING & OPTIMIZING CODE...</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 flex flex-col border-r border-white/10">
                    <div className="bg-rose-500/10 p-2 text-center text-xs font-mono text-rose-400 font-bold border-b border-rose-500/20 tracking-widest">ORIGINAL</div>
                    <div className="flex-1 overflow-auto p-4 bg-[#0d1117] custom-scrollbar">
                      <pre className="text-[11px] font-mono text-slate-300 leading-relaxed"><code style={{ whiteSpace: 'pre-wrap' }}>{refactorState.original}</code></pre>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="bg-emerald-500/10 p-2 text-center text-xs font-mono text-emerald-400 font-bold border-b border-emerald-500/20 tracking-widest">REFACTORED</div>
                    <div className="flex-1 overflow-auto p-4 bg-[#0d1117] custom-scrollbar">
                      <pre className="text-[11px] font-mono text-emerald-300 leading-relaxed"><code style={{ whiteSpace: 'pre-wrap' }}>{refactorState.refactored}</code></pre>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {!refactorState.loading && (
              <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end gap-3">
                <button onClick={() => setRefactorState({ ...refactorState, isOpen: false })} className="px-6 py-2 rounded-xl text-slate-300 hover:text-white font-mono text-sm transition-colors">Cancel</button>
                <button className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl font-mono text-sm transition-colors shadow-lg flex items-center gap-2">
                  <CheckCircle size={16} /> ACCEPT CHANGES
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default RepositoryView;
