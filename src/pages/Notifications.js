import React, { useState } from 'react';
import { useNotificationSystem } from '../hooks/useNotificationSystem';
import { useNavigate } from 'react-router-dom';
import { ConfigUrl } from '../base';
import NotificationTest from '../components/NotificationTest';
import { 
  Bell, 
  MessageCircle, 
  Check, 
  Trash2, 
  Filter,
  ArrowLeft,
  Home
} from 'lucide-react';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    totalCount,
    currentPage,
    pageSize,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    getUnreadNotifications,
    getReadNotifications,
    getContactRequests,
    goToPage
  } = useNotificationSystem();

  const [activeFilter, setActiveFilter] = useState('all');
  const [showRead, setShowRead] = useState(true);
  const navigate = useNavigate();

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Filter by type
    switch (activeFilter) {
      case 'contact_request':
        filtered = notifications.filter(n => n.type === 'contact_request');
        break;
      case 'unread':
        filtered = notifications.filter(n => (n.isRead ?? n.is_read ?? false) === false);
        break;
      case 'read':
        filtered = notifications.filter(n => (n.isRead ?? n.is_read ?? false) === true);
        break;
      default:
        filtered = notifications;
    }

    // Filter by read status toggle
    if (!showRead) {
      filtered = filtered.filter(n => (n.isRead ?? n.is_read ?? false) === false);
    }

    return filtered;
  };

  const renderMessageWithRanges = (message, ranges) => {
    if (!message) return null;
    const safeRanges = Array.isArray(ranges) ? [...ranges].sort((a, b) => (a.offset || 0) - (b.offset || 0)) : [];
    const result = [];
    let cursor = 0;
    safeRanges.forEach((r, idx) => {
      const start = Math.max(0, Number(r.offset || 0));
      const end = Math.max(start, start + Number(r.length || 0));
      if (start > cursor) {
        result.push(message.slice(cursor, start));
      }
      if (end > start) {
        result.push(<strong key={`b-${start}-${idx}`}>{message.slice(start, end)}</strong>);
      }
      cursor = Math.max(cursor, end);
    });
    if (cursor < message.length) {
      result.push(message.slice(cursor));
    }
    return result;
  };

  const renderNotificationIcon = (type) => {
    switch (type) {
      case 'contact_request':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-blue-600" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Bell className="h-5 w-5 text-gray-600" />
          </div>
        );
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'property_view' && notification.url) {
      // Extract id from URL: "/api/v1/properties/18/" -> 18
      const match = notification.url.match(/\/properties\/(\d+)\//);
      if (match && match[1]) {
        navigate(`/property/${match[1]}`);
        markAsRead(notification.id);
      }
    }
  };

  const renderNotificationContent = (notification) => {
    switch (notification.type) {
      case 'contact_request':
        return (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                Yêu cầu liên hệ mới
              </p>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(notification.timestamp || notification.created_at)}
              </span>
            </div>
            <div className="text-sm text-gray-600 mt-1 whitespace-pre-line">
              {renderMessageWithRanges(notification.message, notification.ranges)}
            </div>
            {notification.property && (
              <div className="mt-3 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={ConfigUrl(notification.property.thumbnail)} 
                  alt={notification.property.title}
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {notification.property.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {notification.property.price} • {notification.property.area_m2}m²
                  </p>
                  <p className="text-xs text-gray-500">
                    {notification.property.address}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/property/${notification.property.id}`)}
                  className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-800"
                >
                  <Home className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-900 whitespace-pre-line">
                {renderMessageWithRanges(notification.message || 'Thông báo mới', notification.ranges)}
              </p>
              <span className="text-xs text-gray-500">
                {formatTimeAgo(notification.timestamp || notification.created_at)}
              </span>
            </div>
          </div>
        );
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const totalPages = Math.max(1, Math.ceil((Number(totalCount) || notifications.length) / (pageSize || 10)));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Thông báo
                </h1>
                <p className="text-sm text-gray-500">
                  {unreadCount} thông báo chưa đọc • Tổng: {totalCount || notifications.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Đánh dấu đã đọc
                </button>
              )}
              <button
                onClick={clearNotifications}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Lọc:</span>
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tất cả ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('contact_request')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeFilter === 'contact_request'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Liên hệ ({getContactRequests().length})
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    activeFilter === 'unread'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Chưa đọc ({unreadCount})
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showRead}
                  onChange={(e) => setShowRead(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Hiển thị đã đọc</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Test Component - Only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <NotificationTest />
        </div>
      )}

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không có thông báo nào
            </h3>
            <p className="text-gray-500">
              {activeFilter === 'all' 
                ? 'Bạn chưa có thông báo nào'
                : `Không có thông báo nào phù hợp với bộ lọc "${activeFilter}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-colors ${
                  (notification.isRead ?? notification.is_read ?? false) ? '' : 'border-l-4 border-l-blue-500 bg-blue-50'
                } ${notification.type === 'property_view' ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              >
                <div className="flex items-start space-x-4">
                  {renderNotificationIcon(notification.type)}
                  
                  <div className="flex-1">
                    {renderNotificationContent(notification)}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(notification.isRead ?? notification.is_read ?? false) === false && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Đánh dấu đã đọc"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <button
              onClick={() => currentPage > 1 && goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`px-3 py-2 rounded-md border text-sm ${currentPage <= 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 hover:bg-gray-50 border-gray-300'}`}
            >
              Trang trước
            </button>
            <div className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => currentPage < totalPages && goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`px-3 py-2 rounded-md border text-sm ${currentPage >= totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 hover:bg-gray-50 border-gray-300'}`}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
