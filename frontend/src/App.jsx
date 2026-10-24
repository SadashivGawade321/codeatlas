import { useContext, useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import RepositoryView from './pages/RepositoryView';
import Settings from './pages/Settings';
import Network from './pages/Network';
import GlobalChat from './components/GlobalChat';
import NotificationBell from './components/NotificationBell';
import { NotificationProvider } from './context/NotificationContext';

import { Moon, Sun, Code, Settings as SettingsIcon, Shield, LayoutDashboard, ChevronDown, Users, Sparkles, Compass } from 'lucide-react';

// User dropdown menu (Free profile)
const UserMenu = () => {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleResetSession = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-105"
        style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)' }}>
          {user?.name?.[0]?.toUpperCase() || 'D'}
        </div>
        <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{user?.name || 'Developer'}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--ca-text-secondary)' }} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden shadow-xl z-50"
          style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--ca-border)' }}>
            <div className="font-semibold text-sm" style={{ color: 'var(--ca-text)' }}>{user?.name}</div>
            <div className="text-xs truncate" style={{ color: 'var(--ca-text-secondary)' }}>{user?.email}</div>
            <span className="inline-block mt-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(56,242,194,0.1)',
                color: 'var(--ca-accent)',
              }}>
              Free Unlocked
            </span>
          </div>
          <div className="py-1">
            <Link to="/dashboard" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--ca-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link to="/repo/demo" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--ca-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Compass size={16} /> Demo Architecture
            </Link>
            <Link to="/network" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--ca-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Users size={16} /> Network
            </Link>
            <Link to="/admin" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--ca-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Shield size={16} /> System Health
            </Link>
            <Link to="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--ca-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <SettingsIcon size={16} /> Preferences
            </Link>
          </div>
          <div style={{ borderTop: '1px solid var(--ca-border)' }}>
            <button onClick={handleResetSession}
              className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors"
              style={{ color: 'var(--ca-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Sparkles size={16} /> Reset Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function AppContent() {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isRepoView = location.pathname.startsWith('/repo/');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ca-bg)', color: 'var(--ca-text)' }}>
      {/* Navbar — hidden on repo view */}
      {!isRepoView && (
        <nav className="glass sticky top-0 z-50 flex items-center justify-between px-6 py-3"
          style={{ borderBottom: '1px solid var(--ca-border)' }}>
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: 'var(--ca-accent)' }}>
              <Code size={18} style={{ color: 'var(--ca-bg)' }} />
            </div>
            <span className="font-mono font-bold text-lg tracking-widest gradient-text">CODEATLAS</span>
          </Link>

          <div className="flex gap-3 items-center">
            {/* Quick Links */}
            <Link to="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105"
              style={{ color: 'var(--ca-text-secondary)' }}>
              <LayoutDashboard size={15} /> Dashboard
            </Link>

            <Link to="/repo/demo"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105"
              style={{ color: 'var(--ca-text-secondary)' }}>
              <Compass size={15} /> Demo
            </Link>

            {/* Launch Console Button */}
            <Link to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)' }}>
              <Sparkles size={15} /> Build Map
            </Link>

            {/* Theme Toggle */}
            <button onClick={toggleTheme}
              className="p-2.5 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text-secondary)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <NotificationBell />
            <UserMenu />
          </div>
        </nav>
      )}

      <main className="flex-1 flex flex-col min-h-0 relative">
        <GlobalChat />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repo/:id" element={<RepositoryView />} />
          <Route path="/network" element={<Network />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Redirect deprecated auth routes directly to dashboard */}
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </Router>
  );
}

export default App;
