import { useState, useCallback, useRef } from 'react';
import apiService from '../utils/api';

// Hook để tối ưu hóa việc gọi API
export const useOptimizedAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Debounce function để tránh gọi API quá nhiều
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Optimized GET request với caching và debouncing
  const get = useCallback(async (endpoint, params = {}, options = {}) => {
    const {
      useCache = true,
      debounceMs = 300,
      skipLoading = false
    } = options;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    if (!skipLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await apiService.get(endpoint, params, useCache);
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return null;
      }
      setError(err.message);
      throw err;
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced GET request
  const getDebounced = useCallback(
    debounce(async (endpoint, params = {}, options = {}) => {
      return await get(endpoint, params, options);
    }, 300),
    [get, debounce]
  );

  // Optimized POST request
  const post = useCallback(async (endpoint, data = {}, options = {}) => {
    const { skipLoading = false } = options;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!skipLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await apiService.post(endpoint, data);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return null;
      }
      setError(err.message);
      throw err;
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Optimized authenticated GET request
  const authenticatedGet = useCallback(async (endpoint, params = {}, options = {}) => {
    const {
      useCache = true,
      debounceMs = 300,
      skipLoading = false
    } = options;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!skipLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await apiService.authenticatedGet(endpoint, params, useCache);
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return null;
      }
      setError(err.message);
      throw err;
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Optimized authenticated POST request
  const authenticatedPost = useCallback(async (endpoint, data = {}, options = {}) => {
    const { skipLoading = false } = options;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (!skipLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await apiService.authenticatedPost(endpoint, data);
      return result;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
        return null;
      }
      setError(err.message);
      throw err;
    } finally {
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    apiService.clearCache();
  }, []);

  // Clear specific cache entry
  const clearCacheEntry = useCallback((endpoint, params = {}) => {
    apiService.clearCacheEntry(endpoint, params);
  }, []);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    loading,
    error,
    get,
    getDebounced,
    post,
    authenticatedGet,
    authenticatedPost,
    clearCache,
    clearCacheEntry,
    cancelRequest
  };
};

// Hook để quản lý favorite properties với tối ưu hóa
export const useFavoriteAPI = () => {
  const { loading, error, authenticatedPost, clearCacheEntry } = useOptimizedAPI();

  const toggleFavorite = useCallback(async (propertyId) => {
    try {
      const result = await authenticatedPost('favourites/', { property_id: propertyId });
      
      // Clear cache for favorites list to ensure fresh data
      clearCacheEntry('favourites/listID/');
      
      return result;
    } catch (err) {
      console.error('Toggle favorite error:', err);
      throw err;
    }
  }, [authenticatedPost, clearCacheEntry]);

  const getFavoriteIds = useCallback(async () => {
    try {
      const result = await authenticatedPost('favourites/listID/', {});
      return result.data || [];
    } catch (err) {
      console.error('Get favorite IDs error:', err);
      return [];
    }
  }, [authenticatedPost]);

  return {
    loading,
    error,
    toggleFavorite,
    getFavoriteIds
  };
};

// Hook để quản lý properties với tối ưu hóa
export const usePropertyAPI = () => {
  const { loading, error, get, getDebounced, authenticatedPost } = useOptimizedAPI();

  const getProperties = useCallback(async (params = {}) => {
    try {
      const result = await get('properties/', params, { useCache: true });
      return result;
    } catch (err) {
      console.error('Get properties error:', err);
      throw err;
    }
  }, [get]);

  const getPropertyDetail = useCallback(async (propertyId) => {
    try {
      const result = await get(`properties/${propertyId}/`, {}, { useCache: true });
      return result;
    } catch (err) {
      console.error('Get property detail error:', err);
      throw err;
    }
  }, [get]);

  const searchProperties = useCallback(async (searchParams = {}) => {
    try {
      const result = await getDebounced('properties/', searchParams, { useCache: false });
      return result;
    } catch (err) {
      console.error('Search properties error:', err);
      throw err;
    }
  }, [getDebounced]);

  const contactProperty = useCallback(async (propertyId, message) => {
    try {
      const result = await authenticatedPost('contact-requests/', {
        property: propertyId,
        message: message
      });
      return result;
    } catch (err) {
      console.error('Contact property error:', err);
      throw err;
    }
  }, [authenticatedPost]);

  return {
    loading,
    error,
    getProperties,
    getPropertyDetail,
    searchProperties,
    contactProperty
  };
};
