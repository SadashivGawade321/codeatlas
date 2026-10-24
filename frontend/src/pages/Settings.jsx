import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Mail, Moon, Sun, Save, Trash2, Shield, AlertTriangle, Check, RotateCcw } from 'lucide-react';

const Settings = () => {
  const { user, updateProfile, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await updateProfile({ name, email });
      setMessage('Preferences saved locally!');
    } catch (err) {
      setError(err.message || 'Update failed');
    }
    setSaving(false);
  };

  const handleClearHistory = () => {
    if (!window.confirm('Clear all locally saved scan history?')) return;
    try {
      localStorage.removeItem('codeatlas_history');
      setMessage('Scan history cleared successfully!');
    } catch (err) {
      setError('Failed to clear history');
    }
  };

  const handleResetSession = () => {
    if (!window.confirm('Reset local preferences to default?')) return;
    logout();
    setName('Developer');
    setEmail('free-user@codeatlas.dev');
    setMessage('Session reset to default.');
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-5 md:p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black" style={{ color: 'var(--ca-text)' }}>Preferences</h1>
        <p className="mt-2" style={{ color: 'var(--ca-text-secondary)' }}>Manage your workspace settings and display preferences.</p>
      </motion.div>

      {/* Messages */}
      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl p-4"
          style={{ background: 'rgba(124,247,165,0.1)', border: '1px solid rgba(124,247,165,0.3)', color: 'var(--ca-success)' }}>
          <Check size={18} /> {message}
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl p-4"
          style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.3)', color: 'var(--ca-danger)' }}>
          <AlertTriangle size={18} /> {error}
        </motion.div>
      )}

      {/* Theme Toggle */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ca-text)' }}>
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} Appearance
        </h2>
        <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--ca-badge-bg)' }}>
          <div>
            <div className="font-semibold" style={{ color: 'var(--ca-text)' }}>Theme Mode</div>
            <div className="text-sm" style={{ color: 'var(--ca-text-secondary)' }}>Switch between dark and light mode</div>
          </div>
          <button onClick={toggleTheme}
            className="relative w-16 h-8 rounded-full transition-all duration-300"
            style={{ background: theme === 'dark' ? 'var(--ca-accent)' : 'var(--ca-border)' }}>
            <div className="absolute top-1 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
              style={{
                left: theme === 'dark' ? '2.25rem' : '0.25rem',
                background: 'var(--ca-bg)',
              }}>
              {theme === 'dark' ? <Moon size={12} style={{ color: 'var(--ca-accent)' }} /> : <Sun size={12} style={{ color: 'var(--ca-warning)' }} />}
            </div>
          </button>
        </div>
      </motion.div>

      {/* Profile */}
      <motion.form onSubmit={handleUpdateProfile} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ca-text)' }}>
          <User size={18} /> Developer Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Display Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl pl-12 pr-4 py-3 outline-none"
                style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Email / Contact</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl pl-12 pr-4 py-3 outline-none"
                style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1 rounded-full"
              style={{
                background: 'rgba(56,242,194,0.1)',
                color: 'var(--ca-accent)',
              }}>
              <Shield size={12} className="inline mr-1" />Free Unlocked Tier
            </span>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
            style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </motion.form>

      {/* Local Storage & Session Management */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6"
        style={{ borderColor: 'var(--ca-border)' }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ca-text)' }}>
          <RotateCcw size={18} /> Storage & Data
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--ca-text-secondary)' }}>
          CodeAtlas runs 100% free with no database tracking. Your scan history is safely stored in your browser's local storage.
        </p>
        <div className="flex flex-wrap gap-4">
          <button onClick={handleClearHistory}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.3)', color: 'var(--ca-danger)' }}>
            <Trash2 size={16} /> Clear Scan History
          </button>
          <button onClick={handleResetSession}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}>
            <RotateCcw size={16} /> Reset Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
