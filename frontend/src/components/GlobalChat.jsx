import { useState, useEffect, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Send, Users, Circle, MessageSquare } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { API_BASE_URL } from '../config';

const GlobalChat = () => {
  const { user, token } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [activeFriend, setActiveFriend] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { addNotification } = useNotifications();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/network`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) setFriends(data.friends || []);
      } catch (err) {
        console.error(err);
      }
    };
    if (token && isOpen) fetchFriends();
  }, [token, isOpen]);

  useEffect(() => {
    if (!token || !user) return;
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);

    // Identify self to socket server
    newSocket.emit('identify', user._id);

    newSocket.on('direct-message', (data) => {
      setMessages(prev => {
        const partnerId = data.senderId === user._id ? data.receiverId : data.senderId;
        const thread = prev[partnerId] || [];
        // Deduplicate: skip if we already have this exact message
        const isDuplicate = thread.some(m => m.timestamp === data.timestamp && m.senderId === data.senderId && m.text === data.text);
        if (isDuplicate) return prev;
        return { ...prev, [partnerId]: [...thread, data] };
      });
      // Auto-open chat if someone messages us
      if (data.senderId !== user._id) {
        setIsOpen(true);
        addNotification({
          type: 'chat',
          title: 'New Message',
          message: data.text?.substring(0, 60) || 'You received a message',
        });
      }
    });

    return () => newSocket.close();
  }, [token, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeFriend, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeFriend || !socket) return;

    const msgData = {
      senderId: user._id,
      receiverId: activeFriend._id,
      text: input,
      timestamp: Date.now()
    };

    socket.emit('direct-message', msgData);
    
    // Optimistically update UI
    setMessages(prev => {
      const thread = prev[activeFriend._id] || [];
      return { ...prev, [activeFriend._id]: [...thread, msgData] };
    });

    setInput('');
  };

  // Keep socket connection alive for notifications, but only show UI on /network
  if (!user || location.pathname !== '/network') return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 h-[500px] mb-4 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto transition-all transform origin-bottom-right">
          {!activeFriend ? (
            <div className="flex-1 flex flex-col h-full bg-slate-900">
              <div className="p-4 border-b border-white/5 shadow-sm flex justify-between items-center bg-black/40">
                <h2 className="text-white font-mono font-bold flex items-center gap-2">
                  <Users size={18} className="text-emerald-400"/> Messages
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {friends.length === 0 ? (
                  <div className="text-center p-6 text-slate-500 font-mono text-sm">
                    <p>You don't have any friends yet.</p>
                    <p className="text-xs mt-2">Go to the Network tab to find collaborators!</p>
                  </div>
                ) : (
                  friends.map(friend => (
                    <button 
                      key={friend._id}
                      onClick={() => setActiveFriend(friend)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {friend.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-200 font-medium truncate group-hover:text-white transition-colors">{friend.name}</div>
                        <div className="text-slate-500 text-xs truncate font-mono">Tap to chat</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full bg-slate-900">
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center gap-3 shadow-sm bg-black/40 shrink-0">
                <button onClick={() => setActiveFriend(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                  <MessageSquare size={16} className="rotate-180" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {activeFriend.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate text-sm">{activeFriend.name}</div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0d1117]">
                {(messages[activeFriend._id] || []).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500">
                    <MessageSquare size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">Say hello to {activeFriend.name}!</p>
                  </div>
                ) : (
                  (messages[activeFriend._id] || []).map((msg, idx) => {
                    const isMe = msg.senderId === user._id;
                    return (
                      <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white/10 text-slate-200 border border-white/5 rounded-bl-sm'}`}>
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-black/40 border-t border-white/5 shrink-0">
                <form onSubmit={handleSend} className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message...`}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-200 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim()}
                    className="absolute right-2 p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-colors flex items-center justify-center shadow-md"
                  >
                    <Send size={14} className={input.trim() ? "ml-0.5" : ""} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bubble Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all pointer-events-auto border-2 border-slate-900"
      >
        <MessageSquare size={24} />
        {(messages && Object.values(messages).flat().length > 0 && !isOpen) && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-900"></span>
        )}
      </button>
    </div>
  );
};

export default GlobalChat;
