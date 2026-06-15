import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';

import Home from './pages/Home';
import { Login, Signup } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import RepositoryView from './pages/RepositoryView';
import Settings from './pages/Settings';
import Network from './pages/Network';
import GlobalChat from './components/GlobalChat';
import NotificationBell from './components/NotificationBell';
import { NotificationProvider } from './context/NotificationContext';

import { Moon, Sun, Code, LogOut, Settings as SettingsIcon, Shield, LayoutDashboard, ChevronDown, User, Users } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Protected Route Wrapper
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ca-bg)', color: 'var(--ca-accent)' }}>
      <div className="text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 inline-block mb-4"
          style={{ borderColor: 'var(--ca-accent)', borderTopColor: 'transparent' }} />
        <div className="font-mono text-sm">LOADING...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

// User dropdown menu
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

  const handleLogout = () => {
    logout();
    navigate('/');
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
        style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)' }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">{user?.name || 'User'}</span>
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
                background: user?.role === 'admin' ? 'rgba(255,200,87,0.15)' : 'rgba(56,242,194,0.1)',
                color: user?.role === 'admin' ? 'var(--ca-warning)' : 'var(--ca-accent)',
              }}>
              {user?.role}
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
            <Link to="/network" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--ca-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Users size={16} /> Network
            </Link>
            {user?.role === 'admin' && (
              <Link to="/admin" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--ca-text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Shield size={16} /> Admin Panel
              </Link>
            )}
            <Link to="/settings" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{ color: 'var(--ca-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <SettingsIcon size={16} /> Settings
            </Link>
          </div>
          <div style={{ borderTop: '1px solid var(--ca-border)' }}>
            <button onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors"
              style={{ color: 'var(--ca-danger)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ca-surface-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <LogOut size={16} /> Logout
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
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--ca-bg)', color: 'var(--ca-text)' }}>
      {/* Navbar — hidden on repo view and auth pages */}
      {!isRepoView && !isAuthPage && (
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
            {/* Theme Toggle */}
            <button onClick={toggleTheme}
              className="p-2.5 rounded-xl transition-all hover:scale-105"
              style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text-secondary)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <>
                <NotificationBell />
                <UserMenu />
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium px-4 py-2 rounded-xl transition-all hover:scale-105"
                  style={{ color: 'var(--ca-text-secondary)' }}>
                  Login
                </Link>
                <Link to="/signup"
                  className="text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105"
                  style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)' }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      )}

      <main className="flex-1 flex flex-col min-h-0 relative">
        {user && <GlobalChat />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/network" element={
            <ProtectedRoute>
              <Network />
            </ProtectedRoute>
          } />
          <Route path="/repo/:id" element={
            <ProtectedRoute>
              <RepositoryView />
            </ProtectedRoute>
          } />
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
