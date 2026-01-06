import { useState, useEffect, useCallback } from 'react';
import apiService from '../utils/api';

/*
 * Hook để lấy số lượng favorite properties
 * Sử dụng HTTP API để lấy dữ liệu
*/
export const useFavoriteCount = () => {
  const [favoriteCount, setFavoriteCount] = useState(0);

  // Fetch favorite count
  const fetchFavoriteCount = useCallback(async () => {
    try {
      const data = await apiService.authenticatedGet('favourites/listID/', {}, false);
      const count = Array.isArray(data?.data) ? data.data.length : 0;
      setFavoriteCount(count);
      return count;
    } catch (error) {
      console.error('Failed to fetch favorite count:', error);
      setFavoriteCount(0);
      return 0;
    }
  }, []);

  // Fetch count on mount if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchFavoriteCount();
    }
  }, [fetchFavoriteCount]);

  return {
    favoriteCount,
    refreshFavoriteCount: fetchFavoriteCount
  };
};

export default useFavoriteCount;
