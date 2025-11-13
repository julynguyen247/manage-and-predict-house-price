/**
 * Utility functions để debug và quản lý localStorage
 */

// Debug function để xem tất cả dữ liệu trong localStorage
export const debugLocalStorage = () => {
  console.log('🔍 LocalStorage Debug:');
  console.log('Total items:', localStorage.length);
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    
    console.log(`Key: ${key}`);
    try {
      const parsed = JSON.parse(value);
      console.log('Value (parsed):', parsed);
    } catch {
      console.log('Value (raw):', value);
    }
    console.log('---');
  }
};

// Clear tất cả dữ liệu notification cũ
export const clearNotificationData = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('notification') || key.includes('notifications'))) {
      keysToRemove.push(key);
    }
  }
  
  console.log('🧹 Clearing notification data:', keysToRemove);
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  return keysToRemove.length;
};

// Clear tất cả dữ liệu localStorage (trừ token)
export const clearAllDataExceptToken = () => {
  const token = localStorage.getItem('token');
  localStorage.clear();
  if (token) {
    localStorage.setItem('token', token);
    console.log('🔑 Preserved token');
  }
  console.log('🧹 Cleared all localStorage data except token');
};

// Export default
export default {
  debugLocalStorage,
  clearNotificationData,
  clearAllDataExceptToken
};
