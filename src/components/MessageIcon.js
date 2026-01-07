import React, { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';

const MessageIcon = ({
  className = 'relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all duration-200',
  iconClassName = 'h-6 w-6',
  badgeClassName = 'absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center shadow-lg'
}) => {
  const navigate = useNavigate();
  const { getTotalUnreadCount } = useChat();

  const totalUnreadCount = useMemo(() => getTotalUnreadCount(), [getTotalUnreadCount]);

  const handleClick = () => {
    navigate('/messages');
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      aria-label="Tin nhắn"
    >
      <MessageCircle className={iconClassName} />
      {totalUnreadCount > 0 && (
        <span className={badgeClassName}>
          {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
        </span>
      )}
    </button>
  );
};

export default MessageIcon;

