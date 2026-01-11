import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// TODO: Import from your config file
// import { baseUrlWebsocket } from '../base';
const baseUrlWebsocket = 'ws://localhost:8000/ws/'; // Placeholder

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

/**
 * ChatSocket - Simple WebSocket wrapper
 * Handles connection, reconnection, and message queueing
 */
class ChatSocket {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.isConnected = false;
    this.pendingMessages = [];
    this.reconnectTimer = null;
    this.onMessage = null;
    this.onOpen = null;
    this.onFriendFound = null;
    
    // Attach token to URL
    const token = localStorage.getItem('access') || localStorage.getItem('token');
    if (token) {
      this.url += `?token=${encodeURIComponent(token)}`;
    }
  }

  connect(onMessage, onOpen, onFriendFound) {
    // Store callbacks for reconnection
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.onFriendFound = onFriendFound;
    
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnected = true;
        
        // Callback to update parent state
        if (this.onOpen) this.onOpen();
        
        // Send all pending messages
        while (this.pendingMessages.length > 0) {
          const msg = this.pendingMessages.shift();
          this.send(msg);
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          // Call the message handler
          if (data.type === 'message' && this.onMessage) {
            this.onMessage(data.data);
          }
          
          // Handle friend_found event
          if (data.type === 'friend_found' && this.onFriendFound) {
            this.onFriendFound(data.data || []);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        this.isConnected = false;
        
        // Auto reconnect after 3 seconds
        this.reconnectTimer = setTimeout(() => {
          console.log('🔄 Reconnecting...');
          this.connect(this.onMessage, this.onOpen, this.onFriendFound);
        }, 3000);
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnected = false;
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    } else {
      // Queue message if socket not ready
      console.warn('⚠️ Socket not ready, queueing message');
      this.pendingMessages.push(data);
      return false;
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
  }
}

/**
 * ChatProvider - Global chat state management
 * Manages WebSocket connection, unread counts, and message broadcasting
 */
export const ChatProvider = ({ children }) => {
  // === STATE ===
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({}); // { conversationId: count }
  const [unreadMessages, setUnreadMessages] = useState([]); // Array of unread message objects

  // === REFS ===
  const socketRef = useRef(null);
  const messageCallbacksRef = useRef([]); // Subscribers for incoming messages
  const friendSearchCallbacksRef = useRef([]); // Subscribers for friend search results
  const currentViewingConversationIdRef = useRef(null); // Which conversation user is viewing
  const currentUserIdRef = useRef(null); // Current user ID

  // === LOCALSTORAGE KEYS ===
  const LS_UNREAD_COUNTS = 'chat:unreadCounts';
  const LS_UNREAD_MESSAGES = 'chat:unreadMessages';

  /**
   * Load unread data from localStorage on mount
   */
  useEffect(() => {
    try {
      // Load unread counts
      const storedCounts = localStorage.getItem(LS_UNREAD_COUNTS);
      if (storedCounts) {
        const counts = JSON.parse(storedCounts);
        setUnreadCounts(counts);
      }

      // Load unread messages
      const storedMessages = localStorage.getItem(LS_UNREAD_MESSAGES);
      if (storedMessages) {
        const messages = JSON.parse(storedMessages);
        setUnreadMessages(Array.isArray(messages) ? messages : []);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  /**
   * Save unread counts to localStorage whenever it changes
   */
  useEffect(() => {
    try {
      localStorage.setItem(LS_UNREAD_COUNTS, JSON.stringify(unreadCounts));
    } catch (error) {
      console.error('Error saving unread counts:', error);
    }
  }, [unreadCounts]);

  /**
   * Save unread messages to localStorage whenever it changes
   */
  useEffect(() => {
    try {
      localStorage.setItem(LS_UNREAD_MESSAGES, JSON.stringify(unreadMessages));
    } catch (error) {
      console.error('Error saving unread messages:', error);
    }
  }, [unreadMessages]);

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    const token = localStorage.getItem('access') || localStorage.getItem('token');
    if (!token) {
      console.log('⚠️ No token found, skipping WebSocket connection');
      return;
    }

    const WS_URL = baseUrlWebsocket + 'chat/';
    const socket = new ChatSocket(WS_URL);

    /**
     * Handle incoming WebSocket messages
     * This is the CORE logic for managing unread messages
     */
    const handleIncomingMessage = (messageData) => {
      const conversationId = messageData.conversation;
      const senderId = messageData.sender;
      
      // Get current user ID
      const currentUserId = currentUserIdRef.current;
      const isViewingConversation = currentViewingConversationIdRef.current === conversationId;
      const isOwnMessage = senderId === currentUserId;

      // Only add to unread if:
      // 1. NOT own message
      // 2. NOT currently viewing this conversation
      if (!isOwnMessage && !isViewingConversation) {
        // Add to unread messages list (avoid duplicates)
        setUnreadMessages(prev => {
          const exists = prev.some(msg => msg.id === messageData.id);
          if (exists) return prev;

          return [...prev, {
            id: messageData.id,
            conversationId: conversationId,
            sender: senderId,
            senderUsername: messageData.sender_username,
            content: messageData.content,
            createdAt: messageData.created_at,
            type: messageData.type || 'text'
          }];
        });

        // Increment unread count
        setUnreadCounts(prev => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1
        }));

        console.log('📬 Added to unread:', { conversationId, messageId: messageData.id });
      }

      // Notify all subscribers (e.g., ChatMessage component)
      messageCallbacksRef.current.forEach(callback => {
        try {
          callback(messageData);
        } catch (error) {
          console.error('Error in message callback:', error);
        }
      });
    };

    const handleConnected = () => {
      setIsConnected(true);
      console.log('✅ WebSocket ready');
    };

    const handleFriendFound = (friends) => {
      console.log('👥 Friend search results:', friends);
      // Notify all subscribers
      friendSearchCallbacksRef.current.forEach(callback => {
        try {
          callback(friends);
        } catch (error) {
          console.error('Error in friend search callback:', error);
        }
      });
    };

    socket.connect(handleIncomingMessage, handleConnected, handleFriendFound);
    socketRef.current = socket;

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, []);

  // === PUBLIC METHODS ===

  /**
   * Subscribe to incoming messages
   * Returns unsubscribe function
   */
  const subscribeToMessages = useCallback((callback) => {
    messageCallbacksRef.current.push(callback);
    
    return () => {
      messageCallbacksRef.current = messageCallbacksRef.current.filter(cb => cb !== callback);
    };
  }, []);

  /**
   * Subscribe to friend search results
   * Returns unsubscribe function
   */
  const subscribeToFriendSearch = useCallback((callback) => {
    friendSearchCallbacksRef.current.push(callback);
    
    return () => {
      friendSearchCallbacksRef.current = friendSearchCallbacksRef.current.filter(cb => cb !== callback);
    };
  }, []);

  /**
   * Send message via WebSocket
   */
  const sendMessage = useCallback((payload) => {
    if (!socketRef.current) {
      console.error('❌ Socket not available');
      return false;
    }
    return socketRef.current.send(payload);
  }, []);

  /**
   * Get unread count for a specific conversation
   */
  const getUnreadCount = useCallback((conversationId) => {
    return unreadCounts[conversationId] || 0;
  }, [unreadCounts]);

  /**
   * Get total unread count across all conversations
   */
  const getTotalUnreadCount = useCallback(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  /**
   * Mark a conversation as read (set count to 0)
   * Also removes unread messages for this conversation
   */
  const markConversationAsRead = useCallback((conversationId) => {
    // Set count to 0
    setUnreadCounts(prev => ({
      ...prev,
      [conversationId]: 0
    }));

    // Remove unread messages for this conversation
    setUnreadMessages(prev => 
      prev.filter(msg => msg.conversationId !== conversationId)
    );

    console.log('✅ Marked conversation as read:', conversationId);
  }, []);

  /**
   * Mark as read - sends WebSocket event to server
   * Then calls markConversationAsRead
   */
  const markAsRead = useCallback((conversationId, messageId) => {
    if (!socketRef.current || !conversationId || !messageId) {
      console.log('⚠️ Cannot mark as read: missing parameters');
      return;
    }

    const readMessage = {
      action: 'read_up_to',
      conversation_id: conversationId,
      message_id: messageId
    };

    console.log('📤 Sending read_up_to:', readMessage);
    
    const sent = socketRef.current.send(readMessage);
    
    if (sent) {
      markConversationAsRead(conversationId);
    } else {
      console.log('⏳ Read message queued');
    }
  }, [markConversationAsRead]);

  /**
   * Sync unread counts from server API
   * Called after fetching /messages/unread/
   */
  const syncUnreadCounts = useCallback((serverData) => {
    if (!Array.isArray(serverData)) return;

    const newCounts = {};
    serverData.forEach(item => {
      const convId = Number(item.conversation_id);
      const count = Number(item.unread_count) || 0;
      if (convId) {
        newCounts[convId] = count;
      }
    });

    setUnreadCounts(newCounts);
    console.log('🔄 Synced unread counts from server:', newCounts);
  }, []);

  /**
   * Set which conversation user is currently viewing
   * This prevents incoming messages from being marked as unread
   */
  const setCurrentViewingConversation = useCallback((conversationId, userId = null) => {
    currentViewingConversationIdRef.current = conversationId;
    if (userId) {
      currentUserIdRef.current = userId;
    }
    console.log('👁️ Viewing conversation:', conversationId);
  }, []);

  /**
   * Get unread messages for a specific conversation
   */
  const getUnreadMessages = useCallback((conversationId) => {
    return unreadMessages.filter(msg => msg.conversationId === conversationId);
  }, [unreadMessages]);

  /**
   * Get all unread messages
   */
  const getAllUnreadMessages = useCallback(() => {
    return unreadMessages;
  }, [unreadMessages]);

  /**
   * Remove a specific unread message
   */
  const removeUnreadMessage = useCallback((messageId) => {
    setUnreadMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  // === CONTEXT VALUE ===
  const value = {
    // Connection
    isConnected,

    // Unread counts
    unreadCounts,
    getUnreadCount,
    getTotalUnreadCount,
    markConversationAsRead,
    markAsRead,
    syncUnreadCounts,

    // Unread messages
    unreadMessages,
    getUnreadMessages,
    getAllUnreadMessages,
    removeUnreadMessage,

    // Messaging
    sendMessage,
    subscribeToMessages,
    subscribeToFriendSearch,
    setCurrentViewingConversation,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};