import { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotif = { id, timestamp: Date.now(), read: false, ...notification };
    setNotifications(prev => [newNotif, ...prev]);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, dismissed: true } : n));
    }, 5000);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAllRead, clearAll, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
