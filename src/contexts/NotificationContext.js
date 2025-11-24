import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import apiService from '../utils/api';
import { useLongPollingNotifications } from '../hooks/useLongPollingNotifications';
import { debugLocalStorage, clearNotificationData } from '../utils/localStorageDebug';
import { baseUrl } from '../base';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isInitialized, setIsInitialized] = useState(false);
  const pendingMarkIdsRef = React.useRef(new Set());
  const flushTimerRef = React.useRef(null);
  const isFlushingMarksRef = React.useRef(false);

  // LocalStorage key for unread count cache
  const LS_UNREAD_KEY = 'notifications:unreadCount';

  // ---- LocalStorage short-term cache (3 minutes) ----
  const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
  const CACHE_KEY_LIST = 'notifications:list';
  const CACHE_KEY_META = 'notifications:meta';

  const readCache = useCallback(() => {
    try {
      const listRaw = localStorage.getItem(CACHE_KEY_LIST);
      const metaRaw = localStorage.getItem(CACHE_KEY_META);
      if (!listRaw || !metaRaw) return null;
      const list = JSON.parse(listRaw);
      const meta = JSON.parse(metaRaw);
      if (!meta?.expiresAt || Date.now() > meta.expiresAt) {
        // expired
        localStorage.removeItem(CACHE_KEY_LIST);
        localStorage.removeItem(CACHE_KEY_META);
        return null;
      }
      if (!Array.isArray(list)) return null;
      return { items: list, next: meta.next ?? null };
    } catch (_) {
      return null;
    }
  }, []);

  const writeCache = useCallback((items, next) => {
    try {
      localStorage.setItem(CACHE_KEY_LIST, JSON.stringify(items || []));
      localStorage.setItem(
        CACHE_KEY_META,
        JSON.stringify({ next: next ?? null, expiresAt: Date.now() + CACHE_TTL_MS })
      );
    } catch (_) {
      // ignore quota errors
    }
  }, []);

  const appendCache = useCallback((newItems, newNext) => {
    try {
      const current = readCache();
      const existing = current?.items || [];
      const idSet = new Set(existing.map(n => n.id));
      const merged = [...existing];
      for (const item of newItems || []) {
        if (!idSet.has(item.id)) {
          idSet.add(item.id);
          merged.push(item);
        }
      }
      writeCache(merged, newNext ?? current?.next ?? null);
    } catch (_) {}
  }, [readCache, writeCache]);

  // Fetch unread notifications count (declared early so it can be used in other hooks)
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiService.authenticatedGet('notifications/not-read-count/', {}, false);
      const count = Number(data?.not_readed) || 0;
      setUnreadCount(count);
      try { localStorage.setItem(LS_UNREAD_KEY, String(count)); } catch (_) {}
      return count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
      try { localStorage.setItem(LS_UNREAD_KEY, '0'); } catch (_) {}
      return 0;
    }
  }, []);

  // Fetch notifications via HTTP
  const fetchNotifications = useCallback(async (page = 1, append = false) => {
    try {
      console.log('🔔 fetchNotifications called with page:', page, 'append:', append);
      setLoading(true);
      setCurrentPage(page);
      
      // When fetching the first page (not append), try local cache first
      if (!append && page === 1) {
        const cached = readCache();
        if (cached && Array.isArray(cached.items)) {
          console.log('📦 Using notifications from localStorage cache');
          setNotifications(cached.items);
          setNextPage(cached.next ?? null);
          setLoading(false);
          return; // skip network call, UI will show cached results
        }
      }

      const data = await apiService.authenticatedGet(`notifications/?page=${page}&page_size=${pageSize}`, {}, false);

      // Handle API response structure
      const results = Array.isArray(data?.results) ? data.results : [];

      
      console.log('data:', data);
      console.log('results:', results);
      
      if (append) {
        setNotifications(prev => {
          const idSet = new Set(prev.map(n => n.id));
          const merged = [...prev, ...results.filter(r => !idSet.has(r.id))];
          console.log('🔔 Appending notifications. Total:', merged.length);
          return merged;
        });
        // Update cache with appended items
        appendCache(results, data?.next ?? null);
      } else {
        console.log('🔔 Setting notifications. Count:', results.length);
        setNotifications(results);
        // Write fresh cache for first page
        writeCache(results, data?.next ?? null);
      }

      setNextPage(data?.next ?? null);
      setTotalCount(Number(data?.count) || 0);
      console.log('🔔 Next page:', data?.next);
    } catch (e) {
      console.error('❌ Failed to fetch notifications:', e);
      console.error('❌ Error details:', e.message, e.stack);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more notifications
  const loadMoreNotifications = useCallback(async () => {
    if (!nextPage || loading) return;

    let pageNumber = null;

    if (typeof nextPage === 'number') {
      pageNumber = nextPage;
    } else if (typeof nextPage === 'string') {
      // Try to extract page from URL or plain string number
      try {
        const url = new URL(nextPage, window.location.origin);
        const pageParam = url.searchParams.get('page');
        if (pageParam) pageNumber = parseInt(pageParam, 10);
      } catch (e) {
        const maybeNumber = parseInt(nextPage, 10);
        if (!Number.isNaN(maybeNumber)) pageNumber = maybeNumber;
      }
    }

    if (pageNumber && Number.isFinite(pageNumber)) {
      await fetchNotifications(pageNumber, true);
    }
  }, [nextPage, loading, fetchNotifications]);

  // Debounced queue flush for mark-as-read to avoid server overload
  const flushMarkAsReadQueue = useCallback(async () => {
    if (isFlushingMarksRef.current) return;
    const ids = Array.from(pendingMarkIdsRef.current);
    if (ids.length === 0) return;
    isFlushingMarksRef.current = true;
    pendingMarkIdsRef.current.clear();
    try {
      // Send sequentially to avoid burst; could be changed to limited parallelism
      for (const id of ids) {
        try {
          // fire-and-forget but await to limit concurrency to 1
          // backend expects PUT notifications/{id}/ with action 'readed'
          // ignore response body
          // eslint-disable-next-line no-await-in-loop
          await apiService.authenticatedPut(`notifications/${id}/`, { action: 'readed' });
        } catch (err) {
          console.warn('markAsRead failed for id', id, err?.message);
        }
      }
      // Refresh unread count once after batch
      await fetchUnreadCount();
    } finally {
      isFlushingMarksRef.current = false;
    }
  }, [fetchUnreadCount]);

  const scheduleFlushMarks = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      flushMarkAsReadQueue();
    }, 800); // debounce 800ms
  }, [flushMarkAsReadQueue]);

  const markAsRead = useCallback((notificationId) => {
    // Optimistic update
    setNotifications(prev => prev.map(notif => notif.id === notificationId ? { ...notif, isRead: true, is_read: true } : notif));

    // Update cache optimistically
    try {
      const cached = readCache();
      if (cached?.items) {
        const updated = cached.items.map(n => n.id === notificationId ? { ...n, isRead: true, is_read: true } : n);
        writeCache(updated, cached.next ?? null);
      }
    } catch (_) {}

    // Optimistically decrement unreadCount (floor at 0) and persist to LS
    setUnreadCount(prev => {
      const next = Math.max(0, Number(prev || 0) - 1);
      try { localStorage.setItem(LS_UNREAD_KEY, String(next)); } catch (_) {}
      return next;
    });

    // Enqueue id for debounced PUT
    pendingMarkIdsRef.current.add(notificationId);
    scheduleFlushMarks();
  }, [readCache, writeCache, scheduleFlushMarks]);

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
    setNextPage(null);
  };

  // fetchUnreadCount is declared earlier (above) so it can be referenced here

  // Refresh all notification data
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      fetchUnreadCount(),
      fetchNotifications(1, false)
    ]);
  }, [fetchUnreadCount, fetchNotifications]);

  // Force refresh notifications (bypass cache)
  const forceRefreshNotifications = useCallback(async () => {
    try {
      console.log('🔄 Force refreshing notifications...');
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('🔄 No token found for force refresh');
        return;
      }
      
      // Direct API call bypassing apiService cache
      const response = await fetch(`${baseUrl}notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      if (!response.ok) {
        console.error('🔄 Force refresh failed:', response.status, response.statusText);
        return;
      }
      
      const data = await response.json();
      console.log('🔄 Force refresh response:', data);
      
      // Process the data
      const results = Array.isArray(data?.results) ? data.results : [];
      const normalized = results.map((item) => ({
        id: item.id,
        type: item.type,
        message: item.message,
        isRead: !!item.is_read,
        is_read: !!item.is_read,
        url: item.url,
        created_at: item.created_at,
        timestamp: item.created_at,
        image_representation: item.image_representation,
        ranges: item.ranges || [],
        user: item.user,
        is_deleted: item.is_deleted || false,
      }));
      
      console.log('🔄 Force refresh normalized:', normalized);
      setNotifications(normalized);
      setNextPage(data?.next);
      // Replace cache on force refresh
      writeCache(normalized, data?.next ?? null);
      
    } catch (error) {
      console.error('🔄 Force refresh error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Long polling setup
  const { startPolling, stopPolling, isPolling, lastStatus, error: pollingError } = useLongPollingNotifications(async () => {
    // When long-polling detects new data, refresh list and unread count
    localStorage.removeItem(CACHE_KEY_LIST);
    localStorage.removeItem(CACHE_KEY_META);
    await Promise.all([
      fetchNotifications(1, false),
      fetchUnreadCount()
    ]);
  });

  // Initialize notification system when user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isInitialized) {
      console.log('🔔 Initializing notification system...');
      
      // Clear any old notification data from localStorage
      localStorage.removeItem(CACHE_KEY_LIST);
      localStorage.removeItem(CACHE_KEY_META);
      const clearedCount = clearNotificationData();
      if (clearedCount > 0) {
        console.log(`🧹 Cleared ${clearedCount} old notification data entries`);
      }
      
      // Debug localStorage in development
      if (process.env.NODE_ENV === 'development') {
        debugLocalStorage();
      }
      
      // Check localStorage for unreadCount first - display immediately if found
      const checkAndInitializeUnreadCount = async () => {
        try {
          const stored = localStorage.getItem(LS_UNREAD_KEY);
          if (stored !== null) {
            // Found cached unreadCount, display immediately
            const parsed = Number(stored);
            const count = Number.isFinite(parsed) ? parsed : 0;
            setUnreadCount(count);
            console.log('🔔 Using cached unreadCount:', count);
          } else {
            // No cached unreadCount, fetch from API
            console.log('🔔 No cached unreadCount, fetching from API...');
            await fetchUnreadCount();
          }
        } catch (error) {
          console.error('🔔 Error initializing unreadCount:', error);
          setUnreadCount(0);
        }
      };

      // Initialize unreadCount first, then proceed with other initialization
      checkAndInitializeUnreadCount().then(() => {
        setIsInitialized(true);
        
        // Fetch initial data (list), then start long polling
        refreshNotifications().then(() => {
          startPolling();
        });
      });
    } else if (!token && isInitialized) {
      // User logged out, cleanup
      console.log('🔔 Cleaning up notification system...');
      stopPolling();
      setIsInitialized(false);
      setNotifications([]);
      setUnreadCount(0);
      setNextPage(null);
      try { localStorage.removeItem(LS_UNREAD_KEY); } catch (_) {}
    }
  }, [isInitialized, refreshNotifications, startPolling, stopPolling]);

  // Listen for storage changes (login/logout in other tabs)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue && !isInitialized) {
          // User logged in
          setIsInitialized(true);
          refreshNotifications().then(() => {
            startPolling();
          });
        } else if (!e.newValue && isInitialized) {
          // User logged out
          stopPolling();
          setIsInitialized(false);
          setNotifications([]);
          setUnreadCount(0);
          setNextPage(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isInitialized, refreshNotifications, startPolling, stopPolling]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  };

  const sendContactRequest = useCallback(async (propertyId, message) => {
    try {
      await apiService.authenticatedPost('contact-requests/', { property: propertyId, message });
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message || 'Failed to send contact request' };
    }
  }, []);

  // Debug function to test API directly
  const testNotificationAPI = useCallback(async () => {
    try {
      console.log('🧪 Testing notification API directly...');
      const token = localStorage.getItem('token');
      console.log('🧪 Token exists:', !!token);
      console.log('🧪 Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      const response = await fetch(`${baseUrl}notifications/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('🧪 Response status:', response.status);
      console.log('🧪 Response statusText:', response.statusText);
      console.log('🧪 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('🧪 Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('🧪 Error response body:', errorText);
        return null;
      }
      
      const data = await response.json();
      console.log('🧪 Raw API response:', data);
      console.log('🧪 Raw API response type:', typeof data);
      console.log('🧪 Raw API response keys:', Object.keys(data || {}));
      
      if (data?.results) {
        console.log('🧪 Results array:', data.results);
        console.log('🧪 Results length:', data.results.length);
        if (data.results.length > 0) {
          console.log('🧪 First result item:', data.results[0]);
          console.log('🧪 First result item keys:', Object.keys(data.results[0] || {}));
        }
      }
      
      return data;
    } catch (error) {
      console.error('🧪 API test failed:', error);
      console.error('🧪 Error details:', error.message, error.stack);
      return null;
    }
  }, []);

  const value = {
    notifications,
    unreadCount,
    totalCount,
    currentPage,
    pageSize,
    isPolling,
    isInitialized,
    lastStatus,
    pollingError,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    requestNotificationPermission,
    fetchNotifications,
    fetchUnreadCount,
    refreshNotifications,
    forceRefreshNotifications,
    sendContactRequest,
    loadMoreNotifications,
    hasMore: !!nextPage,
    loading,
    goToPage: (page) => fetchNotifications(page, false),
    // Debug utilities (development only)
    ...(process.env.NODE_ENV === 'development' && {
      debugLocalStorage,
      clearNotificationData,
      testNotificationAPI
    })
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};