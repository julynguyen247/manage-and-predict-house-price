import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import UserDropdown from './UserDropdown';

const AuthWrapper = React.memo(() => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { isAuthenticated, loading } = useAuth();

  // Memoized handlers using useCallback (not useMemo)
  const handleShowLogin = useCallback(() => {
    setShowLoginModal(true);
    setShowRegisterModal(false);
  }, []);

  const handleShowRegister = useCallback(() => {
    setShowRegisterModal(true);
    setShowLoginModal(false);
  }, []);

  const handleCloseModals = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(false);
  }, []);

  const switchToRegister = useCallback(() => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  }, []);

  const switchToLogin = useCallback(() => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  }, []);

  // Memoized loading component
  const LoadingComponent = useMemo(() => (
    <div className="flex items-center space-x-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="text-gray-600">Đang tải...</span>
    </div>
  ), []);

  // Memoized unauthenticated component
  const UnauthenticatedComponent = useMemo(() => (
    <>
      <div className="flex items-center space-x-4">
        <button
          onClick={handleShowLogin}
          className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Đăng Nhập
        </button>
        <button
          onClick={handleShowRegister}
          className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          Đăng Ký
        </button>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={handleCloseModals}
        onSwitchToRegister={switchToRegister}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={handleCloseModals}
        onSwitchToLogin={switchToLogin}
      />
    </>
  ), [showLoginModal, showRegisterModal, handleShowLogin, handleShowRegister, handleCloseModals, switchToRegister, switchToLogin]);

  // All hooks are called at top level, no conditional hooks
  if (loading) {
    return LoadingComponent;
  }

  if (isAuthenticated) {
    return <UserDropdown />;
  }

  return UnauthenticatedComponent;
});

AuthWrapper.displayName = 'AuthWrapper';

export default AuthWrapper;
