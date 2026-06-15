import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Activity, Globe, Database, Trash2, Shield, Heart, Cpu, HardDrive,
  Clock, ChevronDown, ChevronRight, Search, Settings, BarChart3,
  RefreshCw, AlertTriangle, CheckCircle, XCircle, Eye, UserCog, Zap, Layers
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement, Filler);

const API = `${API_BASE_URL}/api/admin`;

const AdminDashboard = () => {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [analytics, setAnalytics] = useState({ totalUsers: 0, activeUsersToday: 0, onlineUsers: 0, totalRepos: 0, totalLogs: 0 });

  // Panels
  const [activePanel, setActivePanel] = useState('overview'); // 'overview' | 'health' | 'churn' | 'settings' | 'logs' | 'user-detail'
  const [healthData, setHealthData] = useState(null);
  const [churnData, setChurnData] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}` };

  // ── Fetch Core Data ──
  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [analRes, usersRes] = await Promise.all([
        fetch(`${API}/analytics`, { headers }),
        fetch(`${API}/users`, { headers }),
      ]);
      const analData = await analRes.json();
      const usersData = await usersRes.json();
      if (analRes.ok) setAnalytics(analData);
      if (usersRes.ok) setUsers(usersData);
    } catch (err) { console.error(err); }
    setRefreshing(false);
  };

  // ── Fetch System Health ──
  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API}/health`, { headers });
      const data = await res.json();
      if (res.ok) setHealthData(data);
    } catch (err) { console.error(err); }
  };

  // ── Fetch Churn Data ──
  const fetchChurn = async () => {
    try {
      const res = await fetch(`${API}/churn-data`, { headers });
      const data = await res.json();
      if (res.ok) setChurnData(data);
    } catch (err) { console.error(err); }
  };

  // ── Fetch Activity Logs ──
  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API}/activity-log?limit=100`, { headers });
      const data = await res.json();
      if (res.ok) setActivityLogs(data.logs || []);
    } catch (err) { console.error(err); }
  };

  // ── Fetch User Detail ──
  const fetchUserDetail = async (userId) => {
    try {
      const res = await fetch(`${API}/user-history/${userId}`, { headers });
      const data = await res.json();
      if (res.ok) setSelectedUserData(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (token) { fetchData(); fetchLogs(); }
  }, [token]);

  useEffect(() => {
    if (activePanel === 'health') fetchHealth();
    if (activePanel === 'churn') fetchChurn();
  }, [activePanel]);

  // ── Actions ──
  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their data?')) return;
    try {
      const res = await fetch(`${API}/users/${id}`, { method: 'DELETE', headers });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handlePromoteUser = async (id) => {
    try {
      const res = await fetch(`${API}/promote/${id}`, { method: 'POST', headers });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Clear all activity logs?')) return;
    try {
      await fetch(`${API}/clear-logs`, { method: 'DELETE', headers });
      fetchLogs();
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { name: 'Total Users', value: analytics.totalUsers, icon: Users, color: '#3b82f6' },
    { name: 'Active Today', value: analytics.activeUsersToday, icon: Activity, color: 'var(--ca-success)' },
    { name: 'Online Now', value: analytics.onlineUsers, icon: Globe, color: 'var(--ca-accent)' },
    { name: 'Repos Analyzed', value: analytics.totalRepos, icon: Database, color: '#a78bfa' },
  ];

  const panels = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'health', label: 'System Health', icon: Heart },
    { id: 'churn', label: 'Churn Analysis', icon: BarChart3 },
    { id: 'logs', label: 'Activity Logs', icon: Eye },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // ── Chart Options ──
  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { grid: { color: 'var(--ca-border)' }, ticks: { color: 'var(--ca-text-secondary)' } },
      x: { grid: { color: 'var(--ca-border)' }, ticks: { color: 'var(--ca-text-secondary)' } },
    },
  };

  // Action icon color
  const getActionColor = (action) => {
    const map = { login: 'var(--ca-success)', signup: '#3b82f6', analyze_repo: 'var(--ca-accent)', view_graph: '#a78bfa', delete_history: 'var(--ca-danger)', logout: 'var(--ca-warning)' };
    return map[action] || 'var(--ca-text-secondary)';
  };

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Admin Control Panel</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ca-text-secondary)' }}>Manage users, monitor system health, and analyze usage patterns.</p>
        </div>
        <button onClick={() => { fetchData(); fetchLogs(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${refreshing ? 'opacity-50' : ''}`}
          style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}>
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
        </button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }} className="glass-card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm" style={{ color: 'var(--ca-text-secondary)' }}>{stat.name}</p>
                  <p className="text-3xl font-bold mt-2 font-mono" style={{ color: 'var(--ca-text)' }}>{stat.value}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: `${stat.color}15`, color: stat.color }}>
                  <Icon size={24} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Panel Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {panels.map(p => {
          const Icon = p.icon;
          return (
            <button key={p.id} onClick={() => setActivePanel(p.id)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                background: activePanel === p.id ? 'var(--ca-accent)' : 'var(--ca-surface)',
                color: activePanel === p.id ? 'var(--ca-bg)' : 'var(--ca-text-secondary)',
                border: `1px solid ${activePanel === p.id ? 'var(--ca-accent)' : 'var(--ca-border)'}`,
              }}>
              <Icon size={16} /> {p.label}
            </button>
          );
        })}
      </div>

      {/* ═══ OVERVIEW PANEL ═══ */}
      {activePanel === 'overview' && (
        <div className="space-y-6">
          {/* Traffic Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 lg:col-span-2">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ca-text)' }}>Activity This Week</h2>
              {activityLogs.length > 0 ? (
                <Line options={chartOpts} data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [{
                    data: (() => {
                      const days = [0, 0, 0, 0, 0, 0, 0];
                      activityLogs.forEach(log => { const d = new Date(log.timestamp).getDay(); days[d === 0 ? 6 : d - 1]++; });
                      return days;
                    })(),
                    borderColor: 'var(--ca-accent)',
                    backgroundColor: 'rgba(56, 242, 194, 0.1)',
                    tension: 0.4,
                    fill: true,
                  }],
                }} />
              ) : (
                <div className="text-center py-12" style={{ color: 'var(--ca-text-secondary)' }}>No activity data yet</div>
              )}
            </motion.div>

            {/* Quick Status */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ca-text)' }}>System Status</h2>
              <div className="space-y-3">
                {[['Parser Engine', 'online'], ['Database', 'online'], ['AI Integration', 'online'], ['Auth Service', 'online']].map(([name, status]) => (
                  <div key={name} className="flex justify-between items-center p-3 rounded-xl"
                    style={{ background: 'var(--ca-badge-bg)' }}>
                    <span style={{ color: 'var(--ca-text)' }}>{name}</span>
                    <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--ca-success)' }}>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--ca-success)' }} />
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* User Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--ca-text)' }}>User Management</h2>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
                <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }} />
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--ca-text-secondary)' }}>No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--ca-border)', color: 'var(--ca-text-secondary)' }}>
                      <th className="pb-3 font-medium text-sm">User</th>
                      <th className="pb-3 font-medium text-sm">Registered</th>
                      <th className="pb-3 font-medium text-sm">Role</th>
                      <th className="pb-3 font-medium text-sm">Last Login</th>
                      <th className="pb-3 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="transition-colors" style={{ borderBottom: '1px solid var(--ca-border)' }}>
                        <td className="py-4">
                          <div className="font-semibold" style={{ color: 'var(--ca-text)' }}>{u.name}</div>
                          <div className="text-sm" style={{ color: 'var(--ca-text-secondary)' }}>{u.email}</div>
                        </td>
                        <td className="py-4 text-sm" style={{ color: 'var(--ca-text-secondary)' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-mono font-bold uppercase px-2 py-1 rounded-full"
                            style={{
                              background: u.role === 'admin' ? 'rgba(255,200,87,0.15)' : 'rgba(56,242,194,0.1)',
                              color: u.role === 'admin' ? 'var(--ca-warning)' : 'var(--ca-accent)',
                            }}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 text-sm" style={{ color: 'var(--ca-text-secondary)' }}>
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedUser(u); setActivePanel('user-detail'); fetchUserDetail(u._id); }}
                              className="p-2 rounded-lg transition-colors" title="View History"
                              style={{ color: 'var(--ca-accent)' }}>
                              <Eye size={16} />
                            </button>
                            <button onClick={() => handlePromoteUser(u._id)}
                              className="p-2 rounded-lg transition-colors" title={u.role === 'admin' ? 'Demote' : 'Promote'}
                              style={{ color: 'var(--ca-warning)' }}>
                              <UserCog size={16} />
                            </button>
                            <button onClick={() => handleDeleteUser(u._id)}
                              className="p-2 rounded-lg transition-colors" title="Delete"
                              style={{ color: 'var(--ca-danger)' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ═══ SYSTEM HEALTH PANEL ═══ */}
      {activePanel === 'health' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: 'var(--ca-text)' }}>System Health Monitor</h2>
            <button onClick={fetchHealth} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
              style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-accent)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {!healthData ? (
            <div className="glass-card p-12 text-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 inline-block"
                style={{ borderColor: 'var(--ca-accent)', borderTopColor: 'transparent' }} />
              <p className="mt-4" style={{ color: 'var(--ca-text-secondary)' }}>Fetching system health...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Server */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(56,242,194,0.1)' }}>
                    <Zap size={20} style={{ color: 'var(--ca-accent)' }} />
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--ca-text)' }}>Server</div>
                    <div className="text-xs flex items-center gap-1" style={{ color: 'var(--ca-success)' }}>
                      <CheckCircle size={12} /> {healthData.server.status}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ['Uptime', healthData.server.uptime],
                    ['Node.js', healthData.server.nodeVersion],
                    ['Platform', healthData.server.platform],
                    ['PID', healthData.server.pid],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--ca-text-secondary)' }}>{k}</span>
                      <span className="font-mono" style={{ color: 'var(--ca-text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <Database size={20} style={{ color: '#3b82f6' }} />
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--ca-text)' }}>MongoDB</div>
                    <div className="text-xs flex items-center gap-1"
                      style={{ color: healthData.database.status === 'online' ? 'var(--ca-success)' : 'var(--ca-danger)' }}>
                      {healthData.database.status === 'online' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {healthData.database.status}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--ca-text-secondary)' }}>Latency</span>
                    <span className="font-mono" style={{ color: healthData.database.latencyMs < 50 ? 'var(--ca-success)' : 'var(--ca-warning)' }}>
                      {healthData.database.latency}
                    </span>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Response Time</div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--ca-badge-bg)' }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, healthData.database.latencyMs)}%`, background: healthData.database.latencyMs < 50 ? 'var(--ca-success)' : 'var(--ca-warning)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(167,139,250,0.1)' }}>
                    <HardDrive size={20} style={{ color: '#a78bfa' }} />
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--ca-text)' }}>Memory</div>
                    <div className="text-xs" style={{ color: 'var(--ca-text-secondary)' }}>{healthData.memory.usagePercent}% used</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    ['Heap Used', healthData.memory.heapUsed],
                    ['Heap Total', healthData.memory.heapTotal],
                    ['RSS', healthData.memory.rss],
                    ['System', `${healthData.memory.systemFree} / ${healthData.memory.systemTotal}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--ca-text-secondary)' }}>{k}</span>
                      <span className="font-mono" style={{ color: 'var(--ca-text)' }}>{v}</span>
                    </div>
                  ))}
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--ca-badge-bg)' }}>
                    <div className="h-full rounded-full" style={{ width: `${healthData.memory.usagePercent}%`, background: healthData.memory.usagePercent > 80 ? 'var(--ca-danger)' : '#a78bfa' }} />
                  </div>
                </div>
              </div>

              {/* CPU */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(251,146,60,0.1)' }}>
                    <Cpu size={20} style={{ color: '#fb923c' }} />
                  </div>
                  <div>
                    <div className="font-bold" style={{ color: 'var(--ca-text)' }}>CPU</div>
                    <div className="text-xs" style={{ color: 'var(--ca-text-secondary)' }}>{healthData.cpu.usagePercent}% usage</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--ca-text-secondary)' }}>Model</span>
                    <span className="font-mono text-xs truncate max-w-[200px]" style={{ color: 'var(--ca-text)' }}>{healthData.cpu.model}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--ca-text-secondary)' }}>Cores</span>
                    <span className="font-mono" style={{ color: 'var(--ca-text)' }}>{healthData.cpu.cores}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--ca-badge-bg)' }}>
                    <div className="h-full rounded-full" style={{ width: `${healthData.cpu.usagePercent}%`, background: healthData.cpu.usagePercent > 80 ? 'var(--ca-danger)' : '#fb923c' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ CHURN ANALYSIS PANEL ═══ */}
      {activePanel === 'churn' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--ca-text)' }}>Churn Analysis</h2>

          {!churnData ? (
            <div className="glass-card p-12 text-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 inline-block"
                style={{ borderColor: 'var(--ca-accent)', borderTopColor: 'transparent' }} />
              <p className="mt-4" style={{ color: 'var(--ca-text-secondary)' }}>Loading churn data...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Churn Distribution Donut */}
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4" style={{ color: 'var(--ca-text)' }}>Distribution</h3>
                <div className="max-w-[200px] mx-auto">
                  <Doughnut data={{
                    labels: ['High', 'Medium', 'Low'],
                    datasets: [{
                      data: [churnData.distribution.high, churnData.distribution.medium, churnData.distribution.low],
                      backgroundColor: ['#ef4444', '#eab308', '#22c55e'],
                      borderWidth: 0,
                    }],
                  }} options={{ plugins: { legend: { labels: { color: 'var(--ca-text-secondary)' } } } }} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div><div className="font-bold" style={{ color: '#ef4444' }}>{churnData.distribution.high}</div><div style={{ color: 'var(--ca-text-secondary)' }}>High</div></div>
                  <div><div className="font-bold" style={{ color: '#eab308' }}>{churnData.distribution.medium}</div><div style={{ color: 'var(--ca-text-secondary)' }}>Medium</div></div>
                  <div><div className="font-bold" style={{ color: '#22c55e' }}>{churnData.distribution.low}</div><div style={{ color: 'var(--ca-text-secondary)' }}>Low</div></div>
                </div>
              </div>

              {/* Weekly Trend */}
              <div className="glass-card p-6 lg:col-span-2">
                <h3 className="font-bold mb-4" style={{ color: 'var(--ca-text)' }}>Weekly Change Trend</h3>
                <Bar options={chartOpts} data={{
                  labels: churnData.trend.map(t => t.day),
                  datasets: [{
                    data: churnData.trend.map(t => t.changes),
                    backgroundColor: 'rgba(56, 242, 194, 0.5)',
                    borderColor: 'var(--ca-accent)',
                    borderWidth: 1,
                    borderRadius: 6,
                  }],
                }} />
              </div>

              {/* Top Churn Files */}
              <div className="glass-card p-6 lg:col-span-3">
                <h3 className="font-bold mb-4" style={{ color: 'var(--ca-text)' }}>Top Files by Churn Rate</h3>
                <div className="space-y-2">
                  {churnData.topChurn.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: 'var(--ca-badge-bg)' }}>
                      <span className="font-mono text-xs w-6" style={{ color: 'var(--ca-text-secondary)' }}>#{i + 1}</span>
                      <span className="flex-1 font-mono text-sm truncate" style={{ color: 'var(--ca-text)' }}>{item.file}</span>
                      <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'var(--ca-badge-bg)' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${item.churn}%`,
                          background: item.churn > 75 ? '#ef4444' : item.churn > 40 ? '#eab308' : '#22c55e',
                        }} />
                      </div>
                      <span className="font-mono text-sm w-12 text-right"
                        style={{ color: item.churn > 75 ? '#ef4444' : item.churn > 40 ? '#eab308' : '#22c55e' }}>
                        {item.churn}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ ACTIVITY LOGS PANEL ═══ */}
      {activePanel === 'logs' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold" style={{ color: 'var(--ca-text)' }}>Activity Logs</h2>
            <div className="flex gap-2">
              <button onClick={fetchLogs} className="px-4 py-2 rounded-xl text-sm flex items-center gap-2"
                style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-accent)' }}>
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={handleClearLogs} className="px-4 py-2 rounded-xl text-sm flex items-center gap-2"
                style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.3)', color: 'var(--ca-danger)' }}>
                <Trash2 size={14} /> Clear All
              </button>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            {activityLogs.length === 0 ? (
              <div className="p-12 text-center" style={{ color: 'var(--ca-text-secondary)' }}>No activity logs recorded yet.</div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                {activityLogs.map((log, i) => (
                  <div key={log._id || i} className="flex items-center gap-4 px-6 py-4 transition-colors"
                    style={{ borderBottom: '1px solid var(--ca-border)' }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getActionColor(log.action) }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate" style={{ color: 'var(--ca-text)' }}>
                          {log.userId?.name || log.userName || 'Unknown'}
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                          style={{ background: `${getActionColor(log.action)}15`, color: getActionColor(log.action) }}>
                          {log.action}
                        </span>
                      </div>
                      {log.details && <div className="text-xs truncate mt-1" style={{ color: 'var(--ca-text-secondary)' }}>{log.details}</div>}
                    </div>
                    <div className="text-xs whitespace-nowrap" style={{ color: 'var(--ca-text-secondary)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ═══ SETTINGS PANEL ═══ */}
      {activePanel === 'settings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--ca-text)' }}>Admin Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Server Config */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ca-text)' }}>
                <Settings size={18} /> Server Configuration
              </h3>
              <div className="space-y-3">
                {[
                  ['API Port', '5000'],
                  ['Database', 'MongoDB (localhost:27017)'],
                  ['JWT Expiry', '7 days'],
                  ['CORS', 'Enabled (all origins)'],
                  ['Activity Logging', 'Enabled'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center p-3 rounded-xl text-sm" style={{ background: 'var(--ca-badge-bg)' }}>
                    <span style={{ color: 'var(--ca-text-secondary)' }}>{k}</span>
                    <span className="font-mono" style={{ color: 'var(--ca-text)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ca-text)' }}>
                <Zap size={18} /> Quick Actions
              </h3>
              <div className="space-y-3">
                <button onClick={handleClearLogs}
                  className="w-full p-4 rounded-xl text-left flex items-center gap-3 transition-colors"
                  style={{ background: 'var(--ca-badge-bg)', color: 'var(--ca-text)', border: '1px solid var(--ca-border)' }}>
                  <Trash2 size={18} style={{ color: 'var(--ca-danger)' }} />
                  <div>
                    <div className="font-semibold text-sm">Clear Activity Logs</div>
                    <div className="text-xs" style={{ color: 'var(--ca-text-secondary)' }}>Remove all activity history records</div>
                  </div>
                </button>
                <button onClick={() => { fetchData(); fetchLogs(); }}
                  className="w-full p-4 rounded-xl text-left flex items-center gap-3 transition-colors"
                  style={{ background: 'var(--ca-badge-bg)', color: 'var(--ca-text)', border: '1px solid var(--ca-border)' }}>
                  <RefreshCw size={18} style={{ color: 'var(--ca-accent)' }} />
                  <div>
                    <div className="font-semibold text-sm">Refresh All Data</div>
                    <div className="text-xs" style={{ color: 'var(--ca-text-secondary)' }}>Reload users, analytics, and logs</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="glass-card p-6 md:col-span-2">
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ca-text)' }}>
                <AlertTriangle size={18} style={{ color: 'var(--ca-warning)' }} /> Platform Info
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  ['Total Users', analytics.totalUsers],
                  ['Total Repos', analytics.totalRepos],
                  ['Total Logs', analytics.totalLogs || activityLogs.length],
                  ['Admin Key', '••••'],
                ].map(([k, v]) => (
                  <div key={k} className="p-4 rounded-xl" style={{ background: 'var(--ca-badge-bg)' }}>
                    <div className="text-2xl font-bold font-mono" style={{ color: 'var(--ca-accent)' }}>{v}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--ca-text-secondary)' }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ USER DETAIL PANEL ═══ */}
      {activePanel === 'user-detail' && selectedUser && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setActivePanel('overview')} className="p-2 rounded-xl"
              style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}>
              <ChevronRight size={18} className="rotate-180" />
            </button>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--ca-text)' }}>{selectedUser.name}</h2>
              <p className="text-sm" style={{ color: 'var(--ca-text-secondary)' }}>{selectedUser.email}</p>
            </div>
          </div>

          {!selectedUserData ? (
            <div className="glass-card p-12 text-center">
              <span className="h-8 w-8 animate-spin rounded-full border-2 inline-block"
                style={{ borderColor: 'var(--ca-accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Repo History */}
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4" style={{ color: 'var(--ca-text)' }}>Repository History ({selectedUserData.history?.length || 0})</h3>
                {(selectedUserData.history || []).length === 0 ? (
                  <p style={{ color: 'var(--ca-text-secondary)' }}>No repositories analyzed.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {selectedUserData.history.map(h => (
                      <div key={h._id} className="p-3 rounded-xl" style={{ background: 'var(--ca-badge-bg)' }}>
                        <div className="font-semibold text-sm" style={{ color: 'var(--ca-text)' }}>{h.repositoryName}</div>
                        <div className="text-xs mt-1" style={{ color: 'var(--ca-text-secondary)' }}>
                          {new Date(h.createdAt).toLocaleString()} • Health: {h.healthScore || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Activity */}
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4" style={{ color: 'var(--ca-text)' }}>Recent Activity ({selectedUserData.activity?.length || 0})</h3>
                {(selectedUserData.activity || []).length === 0 ? (
                  <p style={{ color: 'var(--ca-text-secondary)' }}>No activity recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {selectedUserData.activity.map((a, i) => (
                      <div key={a._id || i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--ca-badge-bg)' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: getActionColor(a.action) }} />
                        <div className="flex-1">
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                            style={{ background: `${getActionColor(a.action)}15`, color: getActionColor(a.action) }}>
                            {a.action}
                          </span>
                          {a.details && <div className="text-xs mt-1 truncate" style={{ color: 'var(--ca-text-secondary)' }}>{a.details}</div>}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--ca-text-secondary)' }}>
                          {new Date(a.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
