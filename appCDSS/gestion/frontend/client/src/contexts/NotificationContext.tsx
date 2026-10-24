import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
  {
    id: '1',
    title: 'Welcome!',
    message: 'Welcome to your Material Dashboard. Explore all the features!',
    type: 'info',
    timestamp: new Date(),
    read: false
  },
  {
    id: '2',
    title: 'New Update Available',
    message: 'Dashboard version 2.1 is now available with new features.',
    type: 'success',
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    read: false
  },
  {
    id: '3',
    title: 'Billing Reminder',
    message: 'Your subscription will expire in 7 days. Please renew to continue.',
    type: 'warning',
    timestamp: new Date(Date.now() - 172800000), // 2 days ago
    read: true
  }]
  );

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };
    setNotifications((prev) => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
    prev.map((notif) =>
    notif.id === id ? { ...notif, read: true } : notif
    )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
    prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
      unreadCount
    }} data-id="fvqr2s7hg" data-path="src/contexts/NotificationContext.tsx">
      {children}
    </NotificationContext.Provider>);

};