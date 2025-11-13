import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Home, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConfigUrl } from '../base';
import { formatMessageWithRanges } from '../utils/notificationFormatter';

const NotificationToast = ({ notification, onClose, onMarkAsRead }) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Auto hide after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.property_id) {
      navigate(`/property/${notification.property_id}`);
    }
    
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'contact_request':
        return <Phone className="h-5 w-5 text-blue-600" />;
      default:
        return <Home className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'contact_request':
        return 'Yêu cầu liên hệ mới';
      default:
        return 'Thông báo mới';
    }
  };

  const getMessage = () => {
    if (notification.type === 'contact_request') {
      return `${notification.from_username} muốn liên hệ về bất động sản của bạn`;
    }
    return notification.message || 'Bạn có thông báo mới';
  };

  const safeTime = () => {
    const src = notification.timestamp || notification.created_at;
    if (!src) return 'Vừa xong';
    const d = new Date(src);
    if (isNaN(d.getTime())) return 'Vừa xong';
    return d.toLocaleTimeString();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 400, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 400, scale: 0.8 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden cursor-pointer"
          onClick={handleClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center space-x-2">
              {getIcon()}
              <span className="text-sm font-semibold text-blue-900">
                {getTitle()}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-3">
            <div className="text-sm text-gray-800 mb-2">
              {notification.message ? (
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessageWithRanges(notification.message, notification.ranges)
                  }} 
                />
              ) : (
                getMessage()
              )}
            </div>
            
            {notification.property && (
              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                <img
                  src={ConfigUrl(notification.property.thumbnail)}
                  alt={notification.property.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {notification.property.title}
                  </p>
                  <p className="text-xs text-gray-600">
                    {notification.property.price} • {notification.property.area_m2}m²
                  </p>
                </div>
              </div>
            )}

            {notification.from_username && (
              <div className="flex items-center space-x-2 mt-2 text-xs text-gray-600">
                <User className="h-3 w-3" />
                <span>Từ: {notification.from_username}</span>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">{safeTime()}</span>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-200">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;
