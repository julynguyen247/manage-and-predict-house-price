import { useEffect, useRef, useState, useCallback } from 'react';
import { baseUrl } from '../base';

/**
 * Hook để long-polling notifications
 * - Gọi notifications/long-polling/ để chờ thay đổi
 * - Trả về 200: có thông báo mới, cần refresh
 * - Trả về 204: không có gì xảy ra, tiếp tục chờ
 * - Lỗi: backoff với exponential delay
 */
export const useLongPollingNotifications = (onUpdate) => {
  const isActiveRef = useRef(false);
  const abortControllerRef = useRef(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [error, setError] = useState(null);

  const startPolling = useCallback(() => {
    if (isActiveRef.current) return;
    isActiveRef.current = true;
    setError(null);
    loop();
  }, []);

  const stopPolling = useCallback(() => {
    isActiveRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const loop = useCallback(async () => {
    if (!isActiveRef.current) return;

    const token = localStorage.getItem('token');
      const username = JSON.parse(localStorage.getItem('user')).username;
      if (!token) {
      setLastStatus('no_token');
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    let attempt = 0;
    
    while (isActiveRef.current) {
      try {
        abortControllerRef.current = new AbortController();
        const response = await fetch(`${baseUrl}notifications/long-polling/?from=${username}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          signal: abortControllerRef.current.signal,
        });

        setLastStatus(response.status);
        setError(null);

        if (response.status === 200) {
          // Có thông báo mới, trigger refresh
          if (typeof onUpdate === 'function') {
            await onUpdate();
          }
          attempt = 0; // reset backoff
          continue; // tiếp tục chờ thay đổi tiếp theo
        }

        if (response.status === 204) {
          // Không có cập nhật, tiếp tục chờ
          attempt = 0;
          continue;
        }

        // Với các status code khác, backoff
        attempt += 1;
        const delayMs = Math.min(30000, 1000 * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, delayMs));
      } catch (error) {
        if (error?.name === 'AbortError') {
          // Đã dừng
          return;
        }
        
        setError(error.message);
        attempt += 1;
        const delayMs = Math.min(30000, 1000 * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, delayMs));
      } finally {
        abortControllerRef.current = null;
      }
    }
  }, [onUpdate]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return { 
    startPolling, 
    stopPolling, 
    isPolling, 
    lastStatus, 
    error,
    isActive: isActiveRef.current
  };
};

export default useLongPollingNotifications;
