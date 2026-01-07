import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Search, ArrowLeft, Phone, Video, 
  Info, Paperclip, Smile
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { originUrl } from '../base';

// TODO: Replace with your actual API base URL
const BASE_URL = originUrl;

/**
 * ChatMessage Component
 * Giao diện chat đầy đủ với responsive design
 */
function ChatMessage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const {
    isConnected,
    getUnreadCount,
    getTotalUnreadCount,
    markAsRead,
    syncUnreadCounts,
    sendMessage: sendMessageContext,
    subscribeToMessages,
    subscribeToFriendSearch,
    setCurrentViewingConversation,
  } = useChat();

  // === STATE ===
  const [chatList, setChatList] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadMoreMessageId, setLoadMoreMessageId] = useState(null); // Cho load more messages
  const [lastReadMessageId, setLastReadMessageId] = useState(null); // Cho mark as read
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // Mobile sidebar toggle
  const [searchQuery, setSearchQuery] = useState('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  // === REFS ===
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedChatRef = useRef(selectedChat);
  const lastMarkedMessageIdRef = useRef(null);
  const isAutoScrollingRef = useRef(false);
  const searchTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  /**
   * Keep selectedChatRef in sync with selectedChat state
   */
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  /**
   * Detect mobile viewport to adjust layout similar to Messenger mobile flow
   */
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobileView(window.innerWidth < 768);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Ensure sidebar visibility syncs with viewport + selection state
   */
  useEffect(() => {
    if (!isMobileView) {
      setShowSidebar(true);
    } else if (!selectedChat) {
      setShowSidebar(true);
    }
  }, [isMobileView, selectedChat]);

  // === API FUNCTIONS ===

  /**
   * Fetch conversation list from server
   */
  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('access') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/api/v1/conversations/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      const conversations = (data.data || []).map(conv => ({
        id: conv.id,
        name: conv.to_user,
        lastMessage: conv.last_message || '',
        lastMessageId: conv.last_message_id || null, // Lưu last_message_id từ API
        timestamp: conv.time_last_send ? new Date(conv.time_last_send) : new Date(),
        avatar: conv.avatar || null,
        isOnline: conv.is_online || false
      }));

      setChatList(conversations.reverse());
      await fetchUnreadCounts();
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch unread counts from server
   */
  const fetchUnreadCounts = async () => {
    try {
      const token = localStorage.getItem('access') || localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${BASE_URL}/api/v1/messages/unread/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        syncUnreadCounts(data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching unread counts:', error);
    }
  };

  /**
   * Fetch messages for a conversation
   */
  const fetchMessages = async (conversationId, options = {}) => {
    const { append = false, beforeId = null } = options;

    try {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const token = localStorage.getItem('access') || localStorage.getItem('token');
      if (!token) return;

      let url = `${BASE_URL}/api/v1/conversations/${conversationId}/messages/`;
      if (beforeId) {
        url += `?last_message_id=${beforeId}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      const messagesData = data.data?.data || [];
      const lastMessageId = data.data?.last_message_id;

      const formattedMessages = messagesData.map(msg => ({
        id: msg.id,
        sender: msg.sender,
        senderUsername: msg.sender_username,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isOwn: msg.sender === user?.id,
        type: msg.type || 'text',
        conversation: msg.conversation,
        status: msg.is_read ? 'read' : 'sent' // read, sent, sending
      }));

      if (append) {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = formattedMessages.filter(m => !existingIds.has(m.id));
          return [...newMessages, ...prev];
        });
      } else {
        setMessages(formattedMessages);
        // Khi fetch lần đầu, set lastReadMessageId là tin nhắn mới nhất (nếu có)
        if (formattedMessages.length > 0) {
          const newestMessageId = Math.max(...formattedMessages.map(m => m.id));
          setLastReadMessageId(prev => {
            if (!prev || newestMessageId > prev) {
              return newestMessageId;
            }
            return prev;
          });
        }
        setTimeout(() => scrollToBottom(), 100);
      }

      // Cập nhật loadMoreMessageId khi fetch messages
      if (lastMessageId !== undefined && lastMessageId !== null) {
        // Còn tin nhắn để load
        setLoadMoreMessageId(lastMessageId);
        setHasMoreMessages(true);
      } else {
        // lastMessageId = null -> đã hết tin nhắn
        setLoadMoreMessageId(null);
        setHasMoreMessages(false);
        console.log('🛑 No more messages to load (lastMessageId is null)');
      }

    } catch (error) {
      console.error('❌ Error fetching messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  /**
   * Load more (older) messages
   */
  const loadMoreMessages = async () => {
    // Kiểm tra điều kiện trước khi load
    if (!hasMoreMessages) {
      console.log('🛑 No more messages available');
      return;
    }
    if (!loadMoreMessageId || !selectedChat || isLoadingMore) return;

    const container = messagesContainerRef.current;
    const oldScrollHeight = container?.scrollHeight || 0;

    await fetchMessages(selectedChat.id, {
      append: true,
      beforeId: loadMoreMessageId
    });

    setTimeout(() => {
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop = newScrollHeight - oldScrollHeight;
      }
    }, 100);
  };

  // === WEBSOCKET MESSAGE HANDLING ===

  // Subscribe to friend search results
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = subscribeToFriendSearch((friends) => {
      setSearchResults(friends);
      setIsSearching(false);
    });

    return unsubscribe;
  }, [isAuthenticated, subscribeToFriendSearch]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(() => {
        // Emit socket event to search for friends
        sendMessageContext({
          action: 'find_friend_conversation',
          user_filter: searchQuery.trim()
        });
      }, 500); // 500ms debounce
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, sendMessageContext]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = subscribeToMessages((messageData) => {
      const conversationId = messageData.conversation;

      // Update conversation list
      setChatList(prev => {
        const updated = prev.map(conv =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage: messageData.content,
                timestamp: new Date(messageData.created_at || new Date())
              }
            : conv
        );

        const idx = updated.findIndex(c => c.id === conversationId);
        if (idx > 0) {
          const [chat] = updated.splice(idx, 1);
          updated.unshift(chat);
        }

        return updated;
      });

      // If viewing this conversation
      const currentChat = selectedChatRef.current;
      
      // If we're in a new conversation (no id) and receive a message, update the chat with conversation_id
      if (currentChat && !currentChat.id && conversationId) {
        setSelectedChat(prev => ({
          ...prev,
          id: conversationId
        }));
        setCurrentViewingConversation(conversationId, user?.id);
      }
      
      // Show message if: 
      // 1. We're viewing this conversation (by id), OR
      // 2. We're in a new conversation (no id) and receive any message (will update conversation_id)
      const shouldShowMessage = currentChat && (
        conversationId === currentChat.id || 
        (!currentChat.id && conversationId)
      );
      
      if (shouldShowMessage) {
        const newMessage = {
          id: messageData.id,
          sender: messageData.sender,
          senderUsername: messageData.sender_username,
          content: messageData.content,
          timestamp: new Date(messageData.created_at || new Date()),
          isOwn: messageData.sender === user?.id,
          type: messageData.type || 'text',
          conversation: messageData.conversation,
          status: 'sent'
        };

        setMessages(prev => {
          if (prev.some(msg => msg.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        // Cập nhật lastReadMessageId khi nhận tin nhắn mới (chỉ khi lớn hơn giá trị hiện tại)
        const newMessageId = messageData.id;
        setLastReadMessageId(prev => {
          if (!prev || newMessageId > prev) {
            return newMessageId;
          }
          return prev;
        });
        setTimeout(() => scrollToBottom('smooth'), 100);

        // Mark as read if not own message
        const isOwnMessage = messageData.sender === user?.id;
        if (!isOwnMessage) {
          setTimeout(() => {
            markAsRead(conversationId, messageData.id);
          }, 500);
        }
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, subscribeToMessages, user, markAsRead]);

  // === SCROLL HANDLING ===

  const scrollToBottom = (behavior = 'auto') => {
    isAutoScrollingRef.current = true;

    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }

    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 500);
  };

  useEffect(() => {
    if (!selectedChat || messages.length === 0) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    let scrollTimeout = null;

    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        if (isAutoScrollingRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

        if (isAtBottom && lastReadMessageId && lastMarkedMessageIdRef.current !== lastReadMessageId) {
          markAsRead(selectedChat.id, lastReadMessageId);
          lastMarkedMessageIdRef.current = lastReadMessageId;
        }
      }, 300);
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [messages, selectedChat, lastReadMessageId, markAsRead]);

  const handleScroll = (e) => {
    if (e.target.scrollTop < 100 && !isLoadingMore) {
      loadMoreMessages();
    }
  };

  // === LIFECYCLE ===

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedChat) {
      lastMarkedMessageIdRef.current = null;
      setLastReadMessageId(null); // Reset khi chọn chat mới
      setLoadMoreMessageId(null); // Reset khi chọn chat mới
      
      // Only fetch messages if conversation exists (has id)
      if (selectedChat.id) {
        setCurrentViewingConversation(selectedChat.id, user?.id);
        setHasMoreMessages(true);
        fetchMessages(selectedChat.id);
      } else {
        // New conversation - no messages yet
        setMessages([]);
        setCurrentViewingConversation(null, user?.id);
      }
      
      // On mobile, hide sidebar when chat selected
      if (isMobileView) {
        setShowSidebar(false);
      }
    } else {
      setCurrentViewingConversation(null, user?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat, user?.id, setCurrentViewingConversation, isMobileView]);

  // === USER ACTIONS ===

  // Auto-resize textarea (max 4 rows)
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 4 * 24; // 4 rows * 24px per row (approximate)
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  // Auto-resize when inputMessage changes
  useEffect(() => {
    autoResizeTextarea();
  }, [inputMessage]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedChat) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // If this is a new conversation (no conversation_id), send DM
    if (!selectedChat.id && selectedChat.toUserId) {
      const sent = sendMessageContext({
        action: 'dm',
        to_user_id: selectedChat.toUserId,
        content: messageText,
        reply: null
      });

      if (!sent) {
        alert('Không thể kết nối. Vui lòng thử lại.');
        return;
      }

      // Reload conversations list after sending first message
      setTimeout(() => {
        fetchConversations().then(() => {
          // Try to find the new conversation and update selectedChat
          // The conversation_id will be set when we receive the message response
        });
      }, 1000);
    } else {
      // Existing conversation
      const sent = sendMessageContext({
        action: 'send_message',
        conversation_id: selectedChat.id,
        content: messageText,
        reply: null
      });

      if (!sent) {
        alert('Không thể kết nối. Vui lòng thử lại.');
      }
    }
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    if (isMobileView) {
      setShowSidebar(false);
    }
  };

  /**
   * Handle selecting a user from search results
   */
  const handleSelectUser = async (selectedUser) => {
    try {
      const token = localStorage.getItem('access') || localStorage.getItem('token');
      if (!token) return;

      // Call API to get/create conversation
      const response = await fetch(
        `${BASE_URL}/api/v1/conversations/user/?to_user_id=${selectedUser.id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      const data = await response.json();
      const conversationId = data.data?.conversation_id;

      if (conversationId) {
        // Conversation exists, navigate to it
        const existingChat = chatList.find(c => c.id === conversationId);
        if (existingChat) {
          setSelectedChat(existingChat);
        } else {
          // Fetch conversation details if not in list
          await fetchConversations();
          const updatedChat = chatList.find(c => c.id === conversationId);
          if (updatedChat) {
            setSelectedChat(updatedChat);
          }
        }
      } else {
        // New conversation - create a temporary chat object
        const newChat = {
          id: null, // Will be set after first message
          name: selectedUser.username,
          lastMessage: '',
          timestamp: new Date(),
          avatar: selectedUser.avatar,
          isOnline: false,
          toUserId: selectedUser.id
        };
        setSelectedChat(newChat);
        setMessages([]);
      }

      // Clear search
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('❌ Error selecting user:', error);
    }
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setShowSidebar(true);
  };

  // === UTILITY FUNCTIONS ===

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes}p`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    return messageDate.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter conversations by search (only if not showing search results)
  const filteredChatList = searchQuery && searchResults.length === 0
    ? chatList.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : chatList;

  const totalUnread = getTotalUnreadCount();

  const sidebarClassNames = isMobileView
    ? `absolute inset-0 z-20 flex w-full transform transition-transform duration-300 ${
        showSidebar ? 'translate-x-0' : '-translate-x-full'
      }`
    : 'hidden md:flex w-full md:w-80 lg:w-96';

  const chatPanelClassNames = isMobileView
    ? `absolute inset-0 flex flex-col bg-gray-50 transform transition-transform duration-300 ${
        showSidebar ? 'translate-x-full' : 'translate-x-0'
      }`
    : 'flex-1 flex flex-col';

  // === RENDER ===

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Send className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng đến Chat</h2>
          <p className="text-gray-600 mb-6">Vui lòng đăng nhập để sử dụng tính năng chat</p>
          <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all">
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] md:h-screen bg-gray-50 overflow-hidden">
      {/* === SIDEBAR: Conversation List === */}
      <div
        className={`${sidebarClassNames} flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          isMobileView ? 'shadow-2xl' : ''
        }`}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center cursor-pointer" onClick={() => navigate('/') }>
                <span className="text-lg font-bold">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold cursor-pointer" onClick={() => navigate('/') }>Tin nhắn</h2>
                <div className="flex items-center space-x-1 text-xs text-blue-100">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span>{isConnected ? 'Đang hoạt động' : 'Mất kết nối'}</span>
                </div>
              </div>
            </div>
            {totalUnread > 0 && (
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <span className="text-sm font-bold">{totalUnread}</span>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-200" />
            <input
              type="text"
              placeholder="Tìm kiếm cuộc trò chuyện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Conversation List / Search Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500">Đang tải cuộc trò chuyện...</p>
            </div>
          ) : searchResults.length > 0 ? (
            // Show search results
            <div>
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-gray-700">Kết quả tìm kiếm</p>
              </div>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className="p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.username}
                      </h3>
                      {user.first_name || user.last_name ? (
                        <p className="text-sm text-gray-600 truncate">
                          {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                        </p>
                      ) : null}
                      {user.email && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChatList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-900 font-medium">
                  {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có cuộc trò chuyện'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu trò chuyện mới'}
                </p>
              </div>
            </div>
          ) : (
            filteredChatList.map((chat) => {
              const unreadCount = getUnreadCount(chat.id);
              const isSelected = selectedChat?.id === chat.id;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar with online status */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                        {chat.name.charAt(0).toUpperCase()}
                      </div>
                      {chat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-semibold truncate ${
                          unreadCount > 0 ? 'text-gray-900' : 'text-gray-800'
                        }`}>
                          {chat.name}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(chat.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                          {chat.lastMessage || 'Chưa có tin nhắn'}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-2 flex-shrink-0">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* === MAIN: Message View === */}
      <div className={chatPanelClassNames}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile */}
                  <button
                    onClick={handleBackToList}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                  </button>

                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {selectedChat.name.charAt(0).toUpperCase()}
                    </div>
                    {selectedChat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>

                  {/* Name and status */}
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedChat.name}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedChat.isOnline ? 'Đang hoạt động' : 'Không hoạt động'}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-1">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video className="h-5 w-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Info className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white"
            >
              {/* Loading more indicator */}
              {isLoadingMore && (
                <div className="flex justify-center py-2">
                  <div className="bg-white rounded-full px-4 py-2 shadow-sm flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-600">Đang tải thêm...</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((message, index) => {
                const showTimestamp = index === 0 || 
                  new Date(messages[index - 1].timestamp).toDateString() !== new Date(message.timestamp).toDateString();

                return (
                  <React.Fragment key={message.id}>
                    {/* Date separator */}
                    {showTimestamp && (
                      <div className="flex justify-center my-4">
                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {new Date(message.timestamp).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-end space-x-2 max-w-[80%] md:max-w-[70%] ${
                        message.isOwn ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        {/* Avatar for other user's messages */}
                        {!message.isOwn && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {message.senderUsername?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}

                        {/* Message content */}
                        <div className="group relative">
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              message.isOwn
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm shadow-lg shadow-blue-200/60'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                              {message.content}
                            </p>
                          </div>

                          {/* Time and status */}
                          <div
                            className={`flex items-center space-x-1 mt-1 text-xs ${
                              message.isOwn ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span className="text-gray-500">{formatMessageTime(message.timestamp)}</span>
                            {message.isOwn && (
                              <span className="text-blue-600">
                                {message.status === 'read' ? '✓✓' : '✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-2">
                {/* Attachment button */}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
                  <Paperclip className="h-5 w-5 text-gray-600" />
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value);
                      autoResizeTextarea();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Nhập tin nhắn..."
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 overflow-y-auto"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '96px' }}
                  />
                  {/* Emoji button */}
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded transition-colors">
                    <Smile className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Send button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                    inputMessage.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          // No conversation selected - Welcome screen
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
                <Send className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Chào mừng đến với Chat
              </h3>
              <p className="text-gray-600 mb-6">
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
              </p>
              <div className="flex flex-col space-y-3 text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'Đã kết nối với server' : 'Đang kết nối lại...'}</span>
                </div>
                {totalUnread > 0 && (
                  <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full inline-block">
                    Bạn có {totalUnread} tin nhắn chưa đọc
                  </div>
                )}
              </div>
              
              {/* Mobile: Show button to open sidebar */}
              <button
                onClick={() => setShowSidebar(true)}
                className="md:hidden mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Xem danh sách chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;