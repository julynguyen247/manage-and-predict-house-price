import { useState, useEffect, useCallback } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { logExtensionConflict, createUserFriendlyErrorMessage } from '../utils/chromeExtensionHandler';

const provider = new GoogleAuthProvider();
// Cấu hình provider cho redirect mode
provider.setCustomParameters({ 
  prompt: "select_account"
});
// Thêm scope để lấy thông tin cơ bản
provider.addScope('email');
provider.addScope('profile');

export const useFirebaseAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirectResult, setRedirectResult] = useState(null);

  // Popup flow: không cần kiểm tra redirect result

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      try {
        // No-op for popup; keep structure for potential future use
      } catch (_) {}
    }, (error) => {
      console.error('Auth state change error:', error);
      
      // Xử lý lỗi Chrome extension conflicts
      if (logExtensionConflict('auth state change', error)) {
        return;
      }
      
      setError('Lỗi xác thực. Vui lòng thử lại.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!auth) {
        throw new Error('Firebase Auth chưa được khởi tạo');
      }

      const result = await signInWithPopup(auth, provider);
      const signedInUser = result.user;
      let idToken = null;
      try {
        idToken = await signedInUser.getIdToken(true);
      } catch (tokenError) {
        console.error('Error getting ID token:', tokenError);
      }
      setLoading(false);
      return { success: true, user: signedInUser, idToken };
    } catch (popupError) {
      console.error('Popup sign-in failed:', popupError);
      
      if (logExtensionConflict('sign in popup', popupError)) {
        const friendlyError = createUserFriendlyErrorMessage(popupError);
        setError(`${friendlyError.title}: ${friendlyError.message}`);
        setLoading(false);
        return { success: false, error: `${friendlyError.title}: ${friendlyError.message}` };
      }
      
      let errorMessage = 'Không thể đăng nhập với Google. ';
      if (popupError.code === 'auth/network-request-failed') {
        errorMessage += 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
      } else if (popupError.code === 'auth/too-many-requests') {
        errorMessage += 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.';
      } else if (popupError.code === 'auth/user-disabled') {
        errorMessage += 'Tài khoản này đã bị vô hiệu hóa.';
      } else if (popupError.code === 'auth/account-exists-with-different-credential') {
        errorMessage += 'Tài khoản đã tồn tại với phương thức đăng nhập khác.';
      } else if (popupError.message?.includes('Firebase Auth chưa được khởi tạo')) {
        errorMessage += 'Hệ thống xác thực chưa sẵn sàng. Vui lòng tải lại trang.';
      } else {
        errorMessage += 'Vui lòng thử lại hoặc liên hệ hỗ trợ.';
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      setError('Lỗi khi đăng xuất: ' + error.message);
      return { success: false, error: error.message };
    }
  }, []);

  const getIdToken = useCallback(async (forceRefresh = false) => {
    if (!user) return null;
    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }, [user]);

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    getIdToken,
    clearError: () => setError(null),
    clearRedirectResult: () => setRedirectResult(null)
  };
};

