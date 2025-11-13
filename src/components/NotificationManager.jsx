import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * NotificationManager - Component quản lý hệ thống thông báo global
 * - Tự động khởi tạo khi user đăng nhập
 * - Quản lý long-polling cho real-time updates
 * - Hiển thị toast notifications khi có thông báo mới
 * - Đồng bộ với tất cả các trang
 */
const NotificationManager = () => {
  const { 
    notifications, 
    unreadCount, 
    isPolling, 
    isInitialized,
    lastStatus,
    pollingError,
    requestNotificationPermission 
  } = useNotifications();

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Show browser notification for new notifications
  useEffect(() => {
    if (notifications.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      const latestNotification = notifications[0];
      
      // Only show notification if it's very recent (within last 30 seconds)
      const notificationTime = new Date(latestNotification.created_at);
      const now = new Date();
      const timeDiff = (now - notificationTime) / 1000;
      
      if (timeDiff < 30) {
        const notification = new Notification('Thông báo mới', {
          body: latestNotification.message,
          icon: '/favicon.ico',
          tag: `notification-${latestNotification.id}`,
          requireInteraction: false
        });

        // Auto close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle click to focus window
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }
  }, [notifications]);

  // Debug logging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 NotificationManager Status:', {
        isInitialized,
        isPolling,
        lastStatus,
        pollingError,
        unreadCount,
        notificationsCount: notifications.length
      });
    }
  }, [isInitialized, isPolling, lastStatus, pollingError, unreadCount, notifications.length]);

  // This component doesn't render anything visible
  return null;
};

export default NotificationManager;