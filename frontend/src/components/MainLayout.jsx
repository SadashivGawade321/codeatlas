import { useContext, useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Code, Users, Settings as SettingsIcon, LayoutDashboard, MessageSquare, Menu, X, LogOut, Code2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import GlobalChat from './GlobalChat';

const MainLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/repo/history`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter unique repos
          const unique = [];
          const seen = new Set();
          for (const item of data) {
            if (!seen.has(item.repositoryUrl)) {
              seen.add(item.repositoryUrl);
              unique.push(item);
            }
          }
          setRepos(unique.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchHistory();
  }, [user, location.pathname]); // Refresh on navigation

  const getInitials = (url) => {
    const parts = url.replace('https://github.com/', '').split('/');
    if (parts.length < 2) return 'R';
    return (parts[1][0]).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full bg-[#020617] text-gray-200 font-sans overflow-hidden">
      
      {/* YELLOW BOX: Left Navigation Sidebar */}
      <nav className="w-[72px] shrink-0 bg-slate-950 border-r border-white/5 flex flex-col items-center py-4 gap-3 z-50 shadow-2xl">
        
        {/* App Logo / Dashboard */}
        <Link 
          to="/dashboard" 
          title="Dashboard"
          className={`w-12 h-12 rounded-[24px] hover:rounded-2xl transition-all duration-300 flex items-center justify-center relative group ${location.pathname === '/dashboard' ? 'bg-orange-500 rounded-2xl' : 'bg-slate-800 hover:bg-orange-500/80'}`}
        >
          <Code size={24} className="text-white" />
          <div className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Dashboard</div>
        </Link>

        <div className="w-8 h-[2px] bg-white/10 rounded-full my-1"></div>

        {/* Network */}
        <Link 
          to="/network"
          title="Developer Network"
          className={`w-12 h-12 rounded-[24px] hover:rounded-2xl transition-all duration-300 flex items-center justify-center relative group ${location.pathname === '/network' ? 'bg-emerald-500 rounded-2xl text-white' : 'bg-slate-800 text-slate-400 hover:bg-emerald-500 hover:text-white'}`}
        >
          <Users size={22} />
          <div className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Developer Network</div>
        </Link>

        {/* Settings */}
        <Link 
          to="/settings"
          title="Settings"
          className={`w-12 h-12 rounded-[24px] hover:rounded-2xl transition-all duration-300 flex items-center justify-center relative group ${location.pathname === '/settings' ? 'bg-blue-500 rounded-2xl text-white' : 'bg-slate-800 text-slate-400 hover:bg-blue-500 hover:text-white'}`}
        >
          <SettingsIcon size={22} />
          <div className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Settings</div>
        </Link>

        {repos.length > 0 && <div className="w-8 h-[2px] bg-white/10 rounded-full my-1"></div>}

        {/* Recent Repos */}
        {repos.map((repo, i) => {
          const isRepoActive = location.pathname.includes(repo.graphId);
          return (
            <Link 
              key={repo._id || i}
              to={`/repo/${repo.graphId}`}
              className={`w-12 h-12 rounded-[24px] hover:rounded-2xl transition-all duration-300 flex items-center justify-center relative group font-mono font-bold text-lg ${isRepoActive ? 'bg-rose-500 rounded-2xl text-white' : 'bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white'}`}
            >
              {getInitials(repo.repositoryUrl)}
              <div className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {repo.repositoryUrl.replace('https://github.com/', '')}
              </div>
            </Link>
          );
        })}

        <div className="flex-1"></div>
        
        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-12 h-12 rounded-[24px] hover:rounded-2xl transition-all duration-300 flex items-center justify-center relative group bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white"
        >
          <LogOut size={20} />
          <div className="absolute left-16 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">Logout</div>
        </button>
      </nav>

      {/* GREEN BOX: Main Content */}
      <main className="flex-1 relative flex bg-[#020617] overflow-hidden">
        <Outlet />
      </main>

    </div>
  );
};

export default MainLayout;
