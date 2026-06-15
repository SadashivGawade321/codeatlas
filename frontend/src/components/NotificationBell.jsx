import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, MessageSquare, GitBranch, UserPlus, Shield, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const iconMap = {
  chat: MessageSquare,
  analysis: GitBranch,
  friend: UserPlus,
  security: Shield,
  default: Bell,
};

const colorMap = {
  chat: 'text-blue-400',
  analysis: 'text-emerald-400',
  friend: 'text-orange-400',
  security: 'text-rose-400',
  default: 'text-slate-400',
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) markAllRead();
  };

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={handleOpen}
        className="p-2.5 rounded-xl transition-all hover:scale-105 relative"
        style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)', color: 'var(--ca-text-secondary)' }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2" style={{ borderColor: 'var(--ca-bg)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[420px] rounded-2xl overflow-hidden shadow-2xl z-50"
          style={{ background: 'var(--ca-surface)', border: '1px solid var(--ca-border)' }}>
          
          {/* Header */}
          <div className="px-4 py-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--ca-border)' }}>
            <h3 className="font-mono font-bold text-sm" style={{ color: 'var(--ca-text)' }}>Notifications</h3>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-xs flex items-center gap-1 transition-colors hover:opacity-80" style={{ color: 'var(--ca-text-secondary)' }}>
                <Trash2 size={12} /> Clear
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-[350px] custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--ca-text-secondary)' }}>
                <Bell size={24} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.filter(n => !n.dismissed).map(notif => {
                const Icon = iconMap[notif.type] || iconMap.default;
                const color = colorMap[notif.type] || colorMap.default;
                return (
                  <div 
                    key={notif.id} 
                    className="px-4 py-3 flex items-start gap-3 transition-colors hover:bg-white/5"
                    style={{ borderBottom: '1px solid var(--ca-border)', opacity: notif.read ? 0.7 : 1 }}
                  >
                    <div className={`mt-0.5 ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--ca-text)' }}>{notif.title}</p>
                      <p className="text-xs truncate mt-0.5" style={{ color: 'var(--ca-text-secondary)' }}>{notif.message}</p>
                      <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--ca-text-secondary)', opacity: 0.6 }}>
                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
        {notifications.filter(n => !n.dismissed && !n.read).slice(0, 3).map(notif => {
          const Icon = iconMap[notif.type] || iconMap.default;
          const color = colorMap[notif.type] || colorMap.default;
          return (
            <div 
              key={notif.id}
              className="bg-slate-900 border border-white/10 rounded-xl p-3 px-4 flex items-center gap-3 shadow-2xl pointer-events-auto animate-slide-in min-w-[280px]"
              style={{ animation: 'slideIn 0.3s ease-out' }}
            >
              <div className={color}><Icon size={16} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{notif.title}</p>
                <p className="text-slate-400 text-xs truncate">{notif.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NotificationBell;
