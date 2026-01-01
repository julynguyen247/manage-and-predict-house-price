// import { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

/**
 * Hook để quản lý số lượng thông báo chưa đọc
 * Chỉ sử dụng NotificationContext, không dùng localStorage
 */
export const useNotificationCount = () => {
  const { unreadCount } = useNotifications();

  return {
    notificationCount: unreadCount
  };
};

export default useNotificationCount;