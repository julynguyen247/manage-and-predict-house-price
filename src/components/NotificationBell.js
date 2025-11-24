import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationBell = ({ 
  onClick, 
  className = "p-2 text-gray-400 hover:text-gray-600 transition-colors",
  iconClassName = "h-5 w-5",
  badgeClassName = "absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-pulse"
}) => {
  const { unreadCount } = useNotifications();

  const hasUnread = Number(unreadCount) > 0;
  const label = `Thông báo${hasUnread ? ` (${unreadCount} chưa đọc)` : ''}`;

  return (
    <button 
      className={`relative ${className} group`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Bell className={`${iconClassName} transition-transform group-hover:scale-110`} />
      {hasUnread && (
        <div className={badgeClassName}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  );
};

export default NotificationBell;
