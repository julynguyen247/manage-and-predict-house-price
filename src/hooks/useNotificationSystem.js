import { useNotifications } from '../contexts/NotificationContext';

/**
 * Custom hook để sử dụng hệ thống thông báo
 * Export từ 1 trang và sử dụng lại ở các trang khác
 */
export const useNotificationSystem = () => {
  const {
    notifications,
    unreadCount,
    totalCount,
    currentPage,
    pageSize,
    isPolling,
    isInitialized,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestNotificationPermission,
    goToPage
  } = useNotifications();

  /**
   * Lấy thông báo theo loại
   * @param {string} type - Loại thông báo (contact_request, etc.)
   * @returns {Array} Danh sách thông báo theo loại
   */
  const getNotificationsByType = (type) => {
    return notifications.filter(notification => notification.type === type);
  };

  /**
   * Lấy thông báo chưa đọc
   * @returns {Array} Danh sách thông báo chưa đọc
   */
  const getUnreadNotifications = () => {
    return notifications.filter(notification => !notification.isRead);
  };

  /**
   * Lấy thông báo đã đọc
   * @returns {Array} Danh sách thông báo đã đọc
   */
  const getReadNotifications = () => {
    return notifications.filter(notification => notification.isRead);
  };

  /**
   * Đánh dấu nhiều thông báo là đã đọc
   * @param {Array} notificationIds - Danh sách ID thông báo
   */
  const markMultipleAsRead = (notificationIds) => {
    notificationIds.forEach(id => markAsRead(id));
  };

  /**
   * Xóa thông báo theo loại
   * @param {string} type - Loại thông báo cần xóa
   */
  const clearNotificationsByType = (type) => {
    const filteredNotifications = notifications.filter(notification => notification.type !== type);
    // Cập nhật lại state (cần implement trong context)
  };

  /**
   * Lấy số lượng thông báo theo loại
   * @param {string} type - Loại thông báo
   * @returns {number} Số lượng thông báo
   */
  const getNotificationCountByType = (type) => {
    return notifications.filter(notification => notification.type === type).length;
  };

  /**
   * Lấy thông báo mới nhất
   * @param {number} limit - Số lượng thông báo muốn lấy
   * @returns {Array} Danh sách thông báo mới nhất
   */
  const getLatestNotifications = (limit = 5) => {
    return notifications.slice(0, limit);
  };

  /**
   * Kiểm tra có thông báo mới không
   * @returns {boolean} True nếu có thông báo mới
   */
  const hasNewNotifications = () => {
    return unreadCount > 0;
  };

  /**
   * Lấy thông báo contact request
   * @returns {Array} Danh sách thông báo contact request
   */
  const getContactRequests = () => {
    return getNotificationsByType('contact_request');
  };

  /**
   * Lấy số lượng contact request chưa đọc
   * @returns {number} Số lượng contact request chưa đọc
   */
  const getUnreadContactRequestsCount = () => {
    return getContactRequests().filter(notification => !notification.isRead).length;
  };

  return {
    // State
    notifications,
    unreadCount,
    totalCount,
    currentPage,
    pageSize,
    isPolling,
    isInitialized,
    
    // Actions
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestNotificationPermission,
    goToPage,
    
    // Utility functions
    getNotificationsByType,
    getUnreadNotifications,
    getReadNotifications,
    markMultipleAsRead,
    clearNotificationsByType,
    getNotificationCountByType,
    getLatestNotifications,
    hasNewNotifications,
    
    // Specific functions for contact requests
    getContactRequests,
    getUnreadContactRequestsCount
  };
};
