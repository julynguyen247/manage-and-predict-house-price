// Utility để xử lý conflicts với Chrome extensions
// Đặc biệt là lỗi runtime.lastError

export const suppressChromeExtensionErrors = () => {
  if (typeof window === 'undefined') return;

  // Lưu lại console.error gốc
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  // Override console.error để suppress Chrome extension errors
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Suppress các lỗi từ Chrome extensions
    if (message.includes('runtime.lastError') || 
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist') ||
        message.includes('Extension context invalidated') ||
        message.includes('message port closed')) {
      // Chỉ log warning thay vì error
      console.warn('Chrome extension conflict detected and suppressed:', message);
      return;
    }
    
    // Gọi console.error gốc cho các lỗi khác
    originalConsoleError.apply(console, args);
  };

  // Override console.warn để suppress Chrome extension warnings
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    
    // Suppress các warning từ Chrome extensions
    if (message.includes('runtime.lastError') || 
        message.includes('Could not establish connection') ||
        message.includes('Receiving end does not exist')) {
      return;
    }
    
    // Gọi console.warn gốc cho các warning khác
    originalConsoleWarn.apply(console, args);
  };
};

// Function để detect Chrome extension conflicts
export const detectChromeExtensionConflicts = () => {
  if (typeof window === 'undefined') return false;

  // Kiểm tra các dấu hiệu của Chrome extension conflicts
  const hasExtensionConflicts = 
    window.chrome?.runtime?.lastError ||
    document.querySelector('[data-extension-id]') ||
    document.querySelector('script[src*="extension://"]');

  return !!hasExtensionConflicts;
};

// Function để restore console methods
export const restoreConsoleMethods = () => {
  if (typeof window === 'undefined') return;

  // Restore console methods (nếu cần)
  // Note: Trong thực tế, việc restore có thể không cần thiết
  // vì các methods đã được override sẽ hoạt động tốt
};

// Function để log extension conflicts một cách an toàn
export const logExtensionConflict = (context, error) => {
  const message = error?.message || error?.toString() || 'Unknown error';
  
  if (message.includes('runtime.lastError') || 
      message.includes('Could not establish connection')) {
    console.warn(`Chrome extension conflict in ${context}:`, message);
    return true; // Indicates conflict was detected
  }
  
  return false; // No conflict detected
};

// Function để tạo error message thân thiện với người dùng
export const createUserFriendlyErrorMessage = (error) => {
  const message = error?.message || error?.toString() || '';
  
  if (message.includes('runtime.lastError') || 
      message.includes('Could not establish connection')) {
    return {
      title: 'Có vấn đề với trình duyệt',
      message: 'Vui lòng tắt các Chrome extension (đặc biệt là ad blocker, VPN) và thử lại.',
      suggestion: 'Hoặc thử trình duyệt khác như Firefox, Safari.'
    };
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return {
      title: 'Lỗi kết nối mạng',
      message: 'Kiểm tra kết nối internet và thử lại.',
      suggestion: 'Nếu vẫn lỗi, có thể do tường lửa hoặc proxy.'
    };
  }
  
  return {
    title: 'Lỗi không xác định',
    message: 'Vui lòng thử lại hoặc liên hệ hỗ trợ.',
    suggestion: 'Nếu lỗi tiếp tục, hãy tải lại trang.'
  };
};
