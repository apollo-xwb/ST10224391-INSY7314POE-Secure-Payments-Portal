import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Cookies from 'js-cookie';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const isAuthenticated = () => {
    return !!Cookies.get('accessToken');
  };

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated()) return;
    
    setIsLoading(true);
    try {
      const response = await api.get('/notifications', {
        params: { limit: 20 }
      });
      const newNotifications = response.data.data.notifications;
      const newUnreadCount = response.data.data.unreadCount;
      
      // Check if there are new notifications (compare by ID or timestamp)
      setNotifications(prev => {
        const previousIds = new Set(prev.map(n => n.id));
        const hasNew = newNotifications.some(n => !previousIds.has(n.id));
        
        if (hasNew && prev.length > 0) {
          setHasNewNotifications(true);
          // Reset the flag after 3 seconds
          setTimeout(() => setHasNewNotifications(false), 3000);
        }
        
        return newNotifications;
      });
      
      setUnreadCount(newUnreadCount);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    if (isAuthenticated()) {
      loadNotifications();
    }
  }, [loadNotifications]);

  // Poll for new notifications every 10 seconds for faster real-time updates
  useEffect(() => {
    if (!isAuthenticated()) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 10000); // Poll every 10 seconds for faster updates

    return () => clearInterval(interval);
  }, [loadNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        lastUpdate,
        hasNewNotifications,
        loadNotifications,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    // Return default values if context is not available
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      loadNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {}
    };
  }
  return context;
}

