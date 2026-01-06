import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { baseUrl } from '../base';
// Removed WebSocket usage

// Utility function to handle token expiration
const handleTokenExpiration = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('expectRedirect');
  localStorage.removeItem('notifications:list');
  localStorage.removeItem('notifications:unreadCount');
  localStorage.removeItem('notifications:meta');
  // Redirect to homepage instead of login page
  window.location.href = '/';
};

// Token validation cache to avoid repeated checks
let tokenValidationCache = {
  isValid: null,
  lastChecked: 0,
  cacheDuration: 5 * 60 * 1000 // 5 minutes cache
};

// Optimized global fetch interceptor - only check when necessary
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  
  // Only check token expiration for authenticated requests that fail
  const options = args[1] || {};
  const headers = options.headers || {};
  const isAuthenticatedRequest = headers.Authorization && headers.Authorization.includes('Bearer');
  
  const shouldSkipAuthRefresh = options.skipAuthRefresh;
  const hasRefreshToken = !!localStorage.getItem('refreshToken');

  if (
    isAuthenticatedRequest &&
    (response.status === 401 || response.status === 403) &&
    !shouldSkipAuthRefresh &&
    !hasRefreshToken
  ) {
    // Clear cache when token is invalid
    tokenValidationCache.isValid = false;
    tokenValidationCache.lastChecked = Date.now();
    
    // Token expired - handle globally
    handleTokenExpiration();
  }
  
  return response;
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [user_fullname, setUser_fullname] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Optimized token validation with caching
  const validateToken = useCallback(async (storedToken) => {
    const now = Date.now();
    
    // Check cache first
    if (tokenValidationCache.isValid !== null && 
        (now - tokenValidationCache.lastChecked) < tokenValidationCache.cacheDuration) {
      return tokenValidationCache.isValid;
    }

    try {
      const response = await fetch(`${baseUrl}auth/check/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`
        }
      });

      const isValid = response.ok;
      
      // Update cache
      tokenValidationCache.isValid = isValid;
      tokenValidationCache.lastChecked = now;
      
      return isValid;
    } catch (error) {
      console.warn('Token validation failed:', error);
      tokenValidationCache.isValid = false;
      tokenValidationCache.lastChecked = now;
      return false;
    }
  }, []);

  // Check token validity on app start - optimized
  useEffect(() => {
    const checkToken = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setUser_fullname(parsed.full_name || parsed.first_name || null);
        } catch (e) {
          console.warn('Failed to parse stored user:', e);
        }
      }
      if (storedToken) {
        setToken(storedToken);
        
        const isValid = await validateToken(storedToken);
        if (!isValid) {
          // Token is invalid - logout and redirect
          handleTokenExpiration();
          return;
        }
      }
      setLoading(false);
    };

    checkToken();
  }, [validateToken]);

  const persistAuth = useCallback((authResponse) => {
    const accessToken = authResponse?.access || authResponse?.token || authResponse?.jwt;
    const refreshToken = authResponse?.refresh;
    const userPayload = authResponse?.user;
    
    if (accessToken) {
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (userPayload) {
      try {
        localStorage.setItem('user', JSON.stringify(userPayload));
        setUser(userPayload);
        setUser_fullname(userPayload.full_name || userPayload.first_name || null);
      } catch (e) {
        console.warn('Failed to persist user to localStorage:', e);
      }
    }
    
    // Clear cache when new token is set
    tokenValidationCache.isValid = null;
    tokenValidationCache.lastChecked = 0;
  }, []);

  // Optimized user data fetching (fallback only)
  const fetchUserData = useCallback(async () => {
    // Prefer localStorage; this function can be used as a fallback if needed
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        return;
      } catch {}
    }
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const response = await fetch(`${baseUrl}auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        persistAuth(data);
        await fetchUserData();
        return { success: true, data };
      } else {
        return { success: false, error: data.message || data.detail || 'Đăng nhập thất bại' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Lỗi kết nối' };
    }
  }, [persistAuth, fetchUserData]);

  const register = useCallback(async (userData) => {
    try {
      console.log(userData);
      const response = await fetch(`${baseUrl}auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        persistAuth(data);
        await fetchUserData();
        return { success: true, data };
      } else {
        return { success: false, error: data.message || data.detail || 'Đăng ký thất bại' };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Lỗi kết nối' };
    }
  }, [persistAuth, fetchUserData]);

  const googleLogin = useCallback(async (googleToken) => {
    try {

      
      // Thêm timeout cho request để tránh chờ quá lâu
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 giây timeout

      const requestBody = { token: googleToken };
      console.log('Request body prepared');

      const response = await fetch(`${baseUrl}oauth/firebase/google/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Backend authentication successful');
        persistAuth(data);
        await fetchUserData();
        return { success: true, data };
      } else {
        console.error('Backend authentication failed:', data);
        return { success: false, error: data.error || 'Đăng nhập Google thất bại' };
      }
    } catch (error) {
      console.error('Google login error:', error);
      
      if (error.name === 'AbortError') {
        return { success: false, error: 'Kết nối quá chậm. Vui lòng thử lại.' };
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.' };
      } else {
        return { success: false, error: 'Lỗi kết nối. Vui lòng thử lại.' };
      }
    }
  }, [persistAuth, fetchUserData]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('expectRedirect');
    localStorage.removeItem('notifications:list');
    localStorage.removeItem('notifications:unreadCount');
    localStorage.removeItem('notifications:meta');
    setToken(null);
    setUser(null);
    
    // Clear cache on logout
    tokenValidationCache.isValid = null;
    tokenValidationCache.lastChecked = 0;
  }, []);

  useEffect(() => {
    const handleTokenRefreshed = (event) => {
      const newToken = event.detail?.token;
      if (newToken) {
        setToken(newToken);
        tokenValidationCache.isValid = true;
        tokenValidationCache.lastChecked = Date.now();
      }
    };

    const handleForceLogoutEvent = () => {
      logout();
      handleTokenExpiration();
    };

    window.addEventListener('auth:tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('auth:forceLogout', handleForceLogoutEvent);

    return () => {
      window.removeEventListener('auth:tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('auth:forceLogout', handleForceLogoutEvent);
    };
  }, [logout]);

  // Optimized API response handler
  const handleApiResponse = useCallback(async (response) => {
    if (response.status === 401 || response.status === 403) {
      // Clear cache when token is invalid
      tokenValidationCache.isValid = false;
      tokenValidationCache.lastChecked = Date.now();
      
      handleTokenExpiration();
      return { expired: true };
    }
    return { expired: false, response };
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch {}
  }, []);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    token,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    handleApiResponse,
    isAuthenticated: !!token,
  }), [
    user,
    token,
    loading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    handleApiResponse
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
