import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Clock, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { formatMessageWithRanges } from '../utils/notificationFormatter';
import { baseUrlWeb } from '../base';

const NotificationDropdown = ({
  className = "relative",
  iconClassName = "h-6 w-6",
  badgeClassName = "absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-lg"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { 
    notifications: contextNotifications, 
    unreadCount, 
    isPolling,
    isInitialized,
    lastStatus,
    pollingError,
    markAsRead: contextMarkAsRead, 
    fetchUnreadCount,
    fetchNotifications, 
    loadMoreNotifications, 
    hasMore, 
    loading 
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Use context notifications directly
  const notifications = contextNotifications;
  const markAsRead = async (notificationId) => {
    try {
      await contextMarkAsRead(notificationId);
      await fetchUnreadCount(); // nếu backend không tự trả count
    } catch (e) {
      console.error("Mark as read failed", e);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Vừa xong';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Vừa xong';
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return `${Math.floor(diffInMinutes / 1440)} ngày trước`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'property_view':
        return '👁️';
      case 'favorite':
        return '❤️';
      case 'message':
        return '💬';
      case 'price_update':
        return '💰';
      case 'contact_request':
        return '📞';
      default:
        return '🔔';
    }
  };

  return (
    <div className={className} ref={dropdownRef}>
      <button
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
      >
        <Bell className={iconClassName} />
        {unreadCount > 0 && (
          <div className={badgeClassName}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
              {isPolling && (
                <span className="text-xs text-green-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  Đang lắng nghe
                </span>
              )}
              {!isPolling && isInitialized && (
                <span className="text-xs text-gray-400">Tạm dừng</span>
              )}
              {loading && <span className="text-xs text-blue-600">Đang tải...</span>}
              {pollingError && (
                <span className="text-xs text-red-600">Lỗi kết nối</span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div 
            className="max-h-96 overflow-y-auto"
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.target;
              if (scrollHeight - scrollTop === clientHeight && hasMore && !loading) {
                loadMoreNotifications();
              }
            }}
          >
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Chưa có thông báo nào</p>
                <p className="text-xs text-gray-400 mt-1">
                  Bấm chuông để tải thông báo
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                    onClick={async () => {
                      if (!notification.is_read) {
                        await markAsRead(notification.id);
                      }   
                      // Navigate based on notification type
                      if (notification.type === 'property_view' && notification.url) {
                        const match = notification.url.match(/\/properties\/(\d+)\//);
                        if (match && match[1]) {
                          navigate(`/property/${match[1]}`);
                        }
                      } else if (notification.type === 'contact_request' && notification.url) {
                        navigate(`${baseUrlWeb}${notification.url}`);
                      } else if (notification.url) {
                        navigate(`${baseUrlWeb}${notification.url}`);  
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: notification.message 
                                ? formatMessageWithRanges(notification.message, notification.ranges)
                                : 'Thông báo mới' 
                            }} 
                          />
                        </div>
                       
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                              {formatTimeAgo(notification.timestamp || notification.created_at)}
                          </p>
                            {!notification.is_read ? (
                            <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                          ) : (
                            <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      {!notification.is_read ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-green-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      ) : (
                        // Read notifications: no tick shown
                        <></>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Loading indicator at bottom */}
          {loading && notifications.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <div className="text-center text-sm text-gray-500">
                Đang tải thêm...
              </div>
            </div>
          )}

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              {/* Xem thêm thông báo (show while hasMore) */}
              {hasMore && (
                <button
                  onClick={() => loadMoreNotifications()}
                  className="w-full mb-3 text-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Xem thêm thông báo
                </button>
              )}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
