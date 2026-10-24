import { createContext, useState } from 'react';

export const AuthContext = createContext();

const STORAGE_KEY = 'codeatlas_user_profile';

const createDefaultUser = () => ({
  id: 'dev_' + Math.random().toString(36).substring(2, 9),
  _id: 'dev_' + Math.random().toString(36).substring(2, 9),
  name: 'Developer',
  email: 'free-user@codeatlas.dev',
  role: 'developer',
  avatar: null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    const defaultUser = createDefaultUser();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    } catch (e) {}
    return defaultUser;
  });

  const [token] = useState('free-access-token');
  const [loading] = useState(false);

  const login = async (email, password) => {
    const updated = { ...user, email: email || user.email };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  };

  const signup = async (name, email) => {
    const updated = { ...user, name: name || user.name, email: email || user.email };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  };

  const adminSignup = async (name, email) => {
    const updated = { ...user, name: name || 'Admin', email: email || user.email, role: 'admin' };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  };

  const updateProfile = async (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    const fresh = createDefaultUser();
    setUser(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, adminSignup, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
