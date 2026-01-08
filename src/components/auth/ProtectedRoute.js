import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { refreshAccessToken } from '../../utils/api';


const ProtectedRoute = ({ children, redirectTo = '/' }) => {
  const { isAuthenticated, loading } = useAuth();

  // Đang kiểm tra / thử refresh lần đầu
  const [checkingRefresh, setCheckingRefresh] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Nếu context vẫn đang loading user ban đầu thì chưa làm gì
    if (loading) return;

    // Nếu đã authenticated rồi thì không cần refresh nữa
    if (isAuthenticated) {
      setCheckingRefresh(false);
      return;
    }

    // Chưa authenticated -> thử xem có refreshToken không
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      // Không có refreshToken -> redirect về login
      setCheckingRefresh(false);
      setShouldRedirect(true);
      return;
    }

    // Có refreshToken -> gọi hàm refresh dùng chung
    (async () => {
      const newToken = await refreshAccessToken();

      // refreshAccessToken:
      // - Trả về access token mới nếu OK
      // - Trả về null nếu fail + tự clear token, bắn event forceLogout
      if (!newToken) {
        setShouldRedirect(true);
      }

      setCheckingRefresh(false);
    })();
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Đang tải...</span>
        </div>
      </div>
    );
  }

  // 2. Không auth + không refresh được -> về login
  if (shouldRedirect || !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default ProtectedRoute;
