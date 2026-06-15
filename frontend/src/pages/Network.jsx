import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Search, UserPlus, Check, X, Users, UserCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';

const Network = () => {
  const { token, user } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const fetchNetwork = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/network`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFriends(data.friends || []);
        setFriendRequests(data.friendRequests || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) fetchNetwork();
    
    // Connect to socket for presence
    const socket = io(API_BASE_URL);
    if (user && user._id) {
      socket.emit('identify', user._id);
    }
    
    socket.on('presence-update', (onlineIds) => {
      setOnlineUsers(new Set(onlineIds));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

  const handleSearch = async (queryParam = searchQuery) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/search?query=${queryParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSearchResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      handleSearch('');
    }
  }, [token]);

  const sendRequest = async (targetId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/request/${targetId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSearchResults(prev => prev.map(u => u._id === targetId ? { ...u, status: 'request_sent' } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (requesterId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/accept/${requesterId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchNetwork();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (requesterId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/reject/${requesterId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchNetwork();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-5 md:p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 font-mono">Developer Network</h1>
          <p className="text-slate-400">Connect with other developers to collaborate on architecture maps.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Search & Add */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-card p-6 border border-white/10 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Search size={20} className="text-blue-400" /> {searchQuery.length > 0 ? 'Find Collaborators' : 'All Developers'}</h2>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search by name or email..."
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
            
            <div className="space-y-3">
              {loading && <p className="text-slate-400 text-sm text-center py-4">Searching...</p>}
              {!loading && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-slate-400 text-sm text-center py-4">No developers found.</p>
              )}
              {searchResults.map(u => (
                <div key={u._id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#020617] ${onlineUsers.has(u._id) ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.name}</p>
                      <p className="text-slate-400 text-xs">{u.email}</p>
                    </div>
                  </div>
                  {u.status === 'request_sent' || u.status === 'incoming_request' ? (
                    <span className="text-xs px-3 py-1 bg-white/10 text-slate-300 rounded-lg">Pending</span>
                  ) : (
                    <button 
                      onClick={() => sendRequest(u._id)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <UserPlus size={14} /> Request
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Requests & Friends */}
        <div className="space-y-6">
          <div className="glass-card p-6 border border-white/10 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-orange-400" /> 
              Incoming Requests
              {friendRequests.length > 0 && <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">{friendRequests.length}</span>}
            </h2>
            {friendRequests.length === 0 ? (
              <p className="text-slate-500 text-sm italic">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {friendRequests.map(req => (
                  <div key={req._id} className="p-3 bg-black/40 rounded-xl border border-white/5">
                    <p className="text-white text-sm font-medium mb-1">{req.name}</p>
                    <p className="text-slate-400 text-xs mb-3">{req.email}</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleAccept(req._id)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs rounded-lg transition-colors">
                        <Check size={14} /> Accept
                      </button>
                      <button onClick={() => handleReject(req._id)} className="flex-1 flex justify-center items-center gap-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs rounded-lg transition-colors">
                        <X size={14} /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6 border border-white/10 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Users size={20} className="text-emerald-400" /> My Network</h2>
            {friends.length === 0 ? (
              <p className="text-slate-500 text-sm italic">You haven't added anyone yet.</p>
            ) : (
              <div className="space-y-3">
                {friends.map(friend => (
                  <div key={friend._id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xs">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[#020617] ${onlineUsers.has(friend._id) ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{friend.name}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                      {onlineUsers.has(friend._id) ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Network;
