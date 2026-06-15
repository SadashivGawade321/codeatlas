import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Moon, Sun, Save, Trash2, Shield, AlertTriangle, Check } from 'lucide-react';

const Settings = () => {
  const { user, token, updateProfile, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Update failed');
    }
    setSaving(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.message || 'Password change failed');
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure? This action is irreversible. All your data will be deleted.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        navigate('/');
      }
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl p-5 md:p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-black" style={{ color: 'var(--ca-text)' }}>Settings</h1>
        <p className="mt-2" style={{ color: 'var(--ca-text-secondary)' }}>Manage your account preferences and security.</p>
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
            <div className="font-semibold" style={{ color: 'var(--ca-text)' }}>Theme</div>
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
          <User size={18} /> Profile
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--ca-text-secondary)' }} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl pl-12 pr-4 py-3 outline-none"
                style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Email</label>
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
                background: user?.role === 'admin' ? 'rgba(255,200,87,0.15)' : 'rgba(56,242,194,0.1)',
                color: user?.role === 'admin' ? 'var(--ca-warning)' : 'var(--ca-accent)',
              }}>
              <Shield size={12} className="inline mr-1" />{user?.role}
            </span>
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
            style={{ background: 'var(--ca-accent)', color: 'var(--ca-bg)' }}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.form>

      {/* Change Password */}
      <motion.form onSubmit={handleChangePassword} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ca-text)' }}>
          <Lock size={18} /> Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
              className="w-full rounded-xl px-4 py-3 outline-none"
              style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}
              placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--ca-text-secondary)' }}>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
              className="w-full rounded-xl px-4 py-3 outline-none"
              style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all"
            style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text)' }}>
            <Lock size={16} /> Update Password
          </button>
        </div>
      </motion.form>

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6"
        style={{ borderColor: 'rgba(255,92,122,0.3)' }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--ca-danger)' }}>
          <AlertTriangle size={18} /> Danger Zone
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--ca-text-secondary)' }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button onClick={handleDeleteAccount}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all"
          style={{ background: 'rgba(255,92,122,0.1)', border: '1px solid rgba(255,92,122,0.3)', color: 'var(--ca-danger)' }}>
          <Trash2 size={16} /> Delete Account
        </button>
      </motion.div>
    </div>
  );
};

export default Settings;
