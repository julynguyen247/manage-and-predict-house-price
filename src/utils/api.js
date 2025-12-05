import { baseUrl } from '../base';

// Cache for API responses to reduce redundant calls
const apiCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const AUTH_REFRESH_ENDPOINT = `${baseUrl}auth/token/refresh/`;
let refreshTokenPromise = null;

const dispatchTokenRefreshed = (token) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:tokenRefreshed', { detail: { token } }));
  }
};

const dispatchForceLogout = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:forceLogout'));
  }
};

const clearAuthStorage = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  } catch (_) {
    // ignore
  }
};

export const refreshAccessToken = async () => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return null;
  }

  refreshTokenPromise = (async () => {
    try {
      const response = await fetch(AUTH_REFRESH_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
        skipAuthRefresh: true,
      });

      if (!response.ok) {
        throw new Error(`Refresh token failed with status ${response.status}`);
      }

      const data = await response.json();
      const newAccessToken = data?.access;

      if (!newAccessToken) {
        throw new Error('Refresh token response did not include access token');
      }

      localStorage.setItem('token', newAccessToken);
      dispatchTokenRefreshed(newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      clearAuthStorage();
      dispatchForceLogout();
      return null;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

const performAuthenticatedFetch = async (url, options = {}, retry = true) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const originalHeaders = options.headers || {};
  const fetchOptions = {
    ...options,
    headers: {
      ...originalHeaders,
      'Authorization': `Bearer ${token}`,
    },
    skipAuthRefresh: true,
  };

  const response = await fetch(url, fetchOptions);

  if ((response.status === 401 || response.status === 403) && retry) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const retryOptions = {
      ...options,
      headers: {
        ...originalHeaders,
        'Authorization': `Bearer ${newToken}`,
      },
      skipAuthRefresh: true,
    };

    const retryResponse = await fetch(url, retryOptions);

    if (retryResponse.status === 401 || retryResponse.status === 403) {
      dispatchForceLogout();
      throw new Error(`HTTP error! status: ${retryResponse.status}`);
    }

    return retryResponse;
  }

  if (response.status === 401 || response.status === 403) {
    dispatchForceLogout();
  }

  return response;
};

// Utility function to get cached response
const getCachedResponse = (url, params = {}) => {
  const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
  const cached = apiCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  return null;
};

// Utility function to set cached response
const setCachedResponse = (url, params = {}, data) => {
  const cacheKey = `${url}?${new URLSearchParams(params).toString()}`;
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

// Optimized API service with caching
const apiService = {
  // GET request with caching
  async get(endpoint, params = {}, useCache = true) {
    const url = `${baseUrl}${endpoint}`;
    
    // Check cache first for GET requests
    if (useCache) {
      const cached = getCachedResponse(url, params);
      if (cached) {
        console.log('Using cached response for:', url);
        return cached;
      }
    }
    
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    try {
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache successful GET responses
      if (useCache && response.ok) {
        setCachedResponse(url, params, data);
      }
      
      return data;
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  },