import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { debugLocalStorage, clearNotificationData, clearAllDataExceptToken } from '../utils/localStorageDebug';

/**
 * NotificationDebug - Component để debug notification system
 * Chỉ hiển thị trong development mode
 */
const NotificationDebug = () => {
  const { 
    notifications, 
    unreadCount, 
    isPolling, 
    isInitialized,
    lastStatus,
    pollingError,
    debugLocalStorage: contextDebugLocalStorage,
    clearNotificationData: contextClearNotificationData,
    testNotificationAPI,
    forceRefreshNotifications
  } = useNotifications();
  
  const [showDebug, setShowDebug] = useState(false);

  // Chỉ hiển thị trong development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="bg-red-500 text-white px-3 py-2 rounded text-xs font-mono"
      >
        🔧 Debug
      </button>
      
      {showDebug && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="space-y-2">
            <h3 className="font-bold text-sm">Notification Debug</h3>
            
            <div className="text-xs space-y-1">
              <div>Status: {isInitialized ? '✅ Initialized' : '❌ Not initialized'}</div>
              <div>Polling: {isPolling ? '🟢 Active' : '🔴 Inactive'}</div>
              <div>Last Status: {lastStatus || 'N/A'}</div>
              <div>Error: {pollingError || 'None'}</div>
              <div>Unread Count: {unreadCount}</div>
              <div>Notifications: {notifications.length}</div>
            </div>
            
            <div className="border-t pt-2 space-y-1">
              <button
                onClick={() => {
                  debugLocalStorage();
                  if (contextDebugLocalStorage) contextDebugLocalStorage();
                }}
                className="w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
              >
                Debug localStorage
              </button>
              
              <button
                onClick={() => {
                  const count = clearNotificationData();
                  alert(`Cleared ${count} notification entries`);
                }}
                className="w-full bg-yellow-500 text-white px-2 py-1 rounded text-xs"
              >
                Clear notification data
              </button>
              
              <button
                onClick={() => {
                  clearAllDataExceptToken();
                  alert('Cleared all data except token');
                }}
                className="w-full bg-red-500 text-white px-2 py-1 rounded text-xs"
              >
                Clear all data (keep token)
              </button>
              
              <button
                onClick={async () => {
                  if (testNotificationAPI) {
                    const result = await testNotificationAPI();
                    console.log('🧪 API test result:', result);
                  }
                }}
                className="w-full bg-purple-500 text-white px-2 py-1 rounded text-xs"
              >
                Test API directly
              </button>
              
              <button
                onClick={async () => {
                  if (forceRefreshNotifications) {
                    await forceRefreshNotifications();
                  }
                }}
                className="w-full bg-green-500 text-white px-2 py-1 rounded text-xs"
              >
                Force refresh
              </button>
            </div>
            
            <div className="border-t pt-2">
              <div className="text-xs font-mono max-h-32 overflow-y-auto bg-gray-100 p-2 rounded">
                {notifications.slice(0, 3).map(notif => (
                  <div key={notif.id} className="mb-1">
                    ID: {notif.id}, Type: {notif.type}, Read: {notif.isRead ? '✅' : '❌'}
                  </div>
                ))}
                {notifications.length > 3 && <div>... and {notifications.length - 3} more</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDebug;
