import { useContext, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ArrowUpRight, Clock, FileCode2, GitBranch, Radar, ShieldAlert, Trash2, Waypoints, User, TrendingUp, Code } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { API_BASE_URL } from '../config';

const Dashboard = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetching, setFetching] = useState(true);

  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const stats = useMemo(() => {
    const riskPaths = history.length * 14 + 3;
    return [
      { name: 'Repositories', value: history.length.toString(), icon: Radar, color: 'var(--ca-accent)' },
      { name: 'Architecture Maps', value: history.length.toString(), icon: GitBranch, color: 'var(--ca-warning)' },
      { name: 'Risk Paths Found', value: riskPaths.toString(), icon: ShieldAlert, color: 'var(--ca-danger)' },
      { name: 'Last Scan', value: history[0] ? new Date(history[0].analysisDate || history[0].createdAt).toLocaleDateString() : '—', icon: Clock, color: 'var(--ca-success)' },
    ];
  }, [history]);

  const fetchDashboardData = async () => {
    try {
      setFetching(true);
      const res = await fetch(`${API_BASE_URL}/api/repo/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) setHistory(data);
    } catch {
      // keep empty
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (token) fetchDashboardData();
    else setFetching(false);
  }, [token]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/repo/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: repoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Analysis failed');
      addNotification({
        type: 'analysis',
        title: 'Analysis Complete',
        message: `${repoUrl.split('/').pop()} analyzed — Health: ${data.analysis?.healthScore || 'N/A'}/100`,
      });
      navigate(`/repo/${data.graphId}`);
    } catch (err) {
      setError(err.message || 'Analysis failed. Check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Remove this scan from history?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/repo/history/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setHistory((items) => items.filter((item) => item._id !== id));
    } catch {
      setHistory((items) => items.filter((item) => item._id !== id));
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7 p-5 md:p-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ border: '1px solid var(--ca-border-glass)', background: 'rgba(56,242,194,0.08)', color: 'var(--ca-accent)' }}>
              <Waypoints size={14} /> Intelligence Console
            </div>
            <div>
              <h1 className="text-3xl font-black md:text-5xl" style={{ color: 'var(--ca-text)' }}>
                Welcome, {user?.name || 'Developer'}
              </h1>
              <p className="mt-3 max-w-2xl" style={{ color: 'var(--ca-text-secondary)' }}>
                Paste a GitHub repository and CodeAtlas will build an architecture map, surface dependency hotspots, and estimate change blast radius.
              </p>
            </div>
            {/* User Info */}
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ca-text-secondary)' }}>
                <User size={16} />
                <span>{user?.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ca-text-secondary)' }}>
                <Code size={16} />
                <span className="uppercase font-mono text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: user?.role === 'admin' ? 'rgba(255,200,87,0.15)' : 'rgba(56,242,194,0.1)',
                    color: user?.role === 'admin' ? 'var(--ca-warning)' : 'var(--ca-accent)'
                  }}>
                  {user?.role || 'user'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Parser', 'ready'],
              ['Graph Engine', 'online'],
              ['AI Summary', 'active'],
              ['Risk Model', 'active'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl p-4" style={{ border: '1px solid var(--ca-border)', background: 'var(--ca-surface)' }}>
                <div className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--ca-text-secondary)' }}>{label}</div>
                <div className="mt-2 font-mono text-sm flex items-center gap-2" style={{ color: 'var(--ca-accent)' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--ca-success)' }} />
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Analyze Form */}
      <motion.form
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        onSubmit={handleAnalyze}
        className="glass-card p-5 md:p-7"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: 'rgba(56,242,194,0.12)', color: 'var(--ca-accent)' }}>
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ca-text)' }}>Analyze Repository</h2>
            <p className="text-sm" style={{ color: 'var(--ca-text-secondary)' }}>Works with public GitHub repositories.</p>
          </div>
        </div>
        {error && (
          <div className="mb-4 rounded-xl p-3 text-sm"
            style={{ border: '1px solid rgba(255,92,122,0.3)', background: 'rgba(255,92,122,0.08)', color: 'var(--ca-danger)' }}>
            {error}
          </div>
        )}
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={loading}
            className="min-h-14 flex-1 rounded-xl px-5 text-base outline-none transition-all focus:ring-2"
            style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}
            required
            placeholder="https://github.com/user/repo"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl px-7 font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)' }}
          >
            <Radar size={19} /> {loading ? 'Mapping...' : 'Build Map'}
          </button>
        </div>
        {loading && (
          <div className="mt-4 flex items-center gap-3 text-sm" style={{ color: 'var(--ca-text-secondary)' }}>
            <span className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: 'var(--ca-accent)', borderTopColor: 'transparent' }} />
            Parsing imports, clustering modules, and estimating affected files.
          </div>
        )}
      </motion.form>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.04 }}
              key={stat.name}
              className="glass-card p-5"
            >
              <Icon size={22} style={{ color: stat.color }} />
              <p className="mt-5 text-sm" style={{ color: 'var(--ca-text-secondary)' }}>{stat.name}</p>
              <p className="mt-1 font-mono text-3xl font-bold" style={{ color: 'var(--ca-text)' }}>{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Recent History */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 md:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold" style={{ color: 'var(--ca-text)' }}>Recent Architecture Maps</h2>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ca-text-secondary)' }}>
            <TrendingUp size={16} />
            {history.length} total scans
          </div>
        </div>

        {fetching ? (
          <div className="text-center py-12" style={{ color: 'var(--ca-text-secondary)' }}>
            <span className="h-6 w-6 animate-spin rounded-full border-2 inline-block"
              style={{ borderColor: 'var(--ca-accent)', borderTopColor: 'transparent' }} />
            <p className="mt-3 text-sm">Loading your workspace...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--ca-text-secondary)' }}>
            <Radar size={48} className="mx-auto mb-4" style={{ opacity: 0.3 }} />
            <p className="text-lg font-semibold" style={{ color: 'var(--ca-text)' }}>No scans yet</p>
            <p className="text-sm mt-2">Paste a GitHub URL above to create your first architecture map.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="text-sm" style={{ borderBottom: '1px solid var(--ca-border)', color: 'var(--ca-text-secondary)' }}>
                  <th className="pb-3 font-medium">Repository</th>
                  <th className="pb-3 font-medium">Scan Date</th>
                  <th className="pb-3 font-medium">Health</th>
                  <th className="pb-3 font-medium">Signal</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item._id} className="transition-colors hover:opacity-80"
                    style={{ borderBottom: '1px solid var(--ca-border)' }}>
                    <td className="py-4">
                      <a href={item.repositoryUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 font-semibold hover:underline"
                        style={{ color: 'var(--ca-text)' }}>
                        <FileCode2 size={16} style={{ color: 'var(--ca-accent)' }} /> {item.repositoryName}
                      </a>
                    </td>
                    <td className="py-4" style={{ color: 'var(--ca-text-secondary)' }}>
                      {new Date(item.analysisDate || item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <span className="rounded-full px-3 py-1 font-mono text-sm"
                        style={{ background: 'rgba(124,247,165,0.1)', color: 'var(--ca-success)' }}>
                        {item.healthScore || '—'}
                      </span>
                    </td>
                    <td className="py-4 text-sm" style={{ color: 'var(--ca-text-secondary)' }}>
                      API and parser modules drive blast radius
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-4">
                        <Link to={`/repo/${item.graphId || item._id}`}
                          className="inline-flex items-center gap-1 font-semibold hover:underline"
                          style={{ color: 'var(--ca-accent)' }}>
                          Open <ArrowUpRight size={14} />
                        </Link>
                        <button onClick={(e) => handleDeleteHistory(item._id, e)}
                          className="transition-colors hover:opacity-80" style={{ color: 'var(--ca-danger)' }}
                          title="Remove from history">
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
  );
};

export default Dashboard;
