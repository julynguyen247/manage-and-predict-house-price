# Firebase Setup & Usage Guide

## 🔧 **Cài đặt Firebase**

### 1. **Cài đặt package**
```bash
npm install firebase
```

### 2. **Cấu hình Firebase**
File: `src/config/firebase.js`
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export { app };
```

## 🚀 **Sử dụng Firebase Authentication**

### **Cách 1: Sử dụng Hook tùy chỉnh (Khuyến nghị)**
```javascript
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

const { signInWithGoogle, user, loading, error } = useFirebaseAuth();

const handleGoogleSignIn = async () => {
  const result = await signInWithGoogle();
  
  if (result.success && result.user) {
    // Xử lý kết quả popup thành công
    console.log('User signed in:', result.user);
  } else if (result.success && result.redirect) {
    // Redirect đang xử lý
    console.log('Redirect initiated...');
  } else {
    // Có lỗi
    console.error('Error:', result.error);
  }
};
```

### **Cách 2: Import trực tiếp (Legacy)**
```javascript
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '../../config/firebase';
```

### **Google Sign-in với fallback và timeout**
```javascript
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

async function signInWithGoogle() {
  try {
    // Thử popup với timeout 10 giây
    const popupPromise = signInWithPopup(auth, provider);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Popup timeout')), 10000)
    );
    
    const result = await Promise.race([popupPromise, timeoutPromise]);
    return result;
  } catch (popupError) {
    console.log('Popup failed, trying redirect:', popupError);
    
    // Fallback sang redirect nếu popup thất bại
    try {
      await signInWithRedirect(auth, provider);
      return { redirect: true };
    } catch (redirectError) {
      throw redirectError;
    }
  }
}
```

### **Xử lý kết quả redirect**
```javascript
React.useEffect(() => {
  const checkRedirectResult = async () => {
    try {
      const result = await getRedirectResult(auth);
      if (result) {
        await handleGoogleSignInResult(result);
      }
    } catch (error) {
      console.error('Redirect result error:', error);
    }
  };

  checkRedirectResult();
}, []);
```

## 🛠️ **Xử lý lỗi phổ biến**

### **1. Lỗi Popup bị chặn**
- **Nguyên nhân**: Popup bị chặn bởi browser hoặc ad blocker
- **Giải pháp**: Sử dụng fallback sang `signInWithRedirect`

### **2. Lỗi "Pending promise was never set"**
- **Nguyên nhân**: Popup window bị đóng đột ngột
- **Giải pháp**: Đã được xử lý bằng fallback logic và timeout

### **3. Lỗi "Could not establish connection"**
- **Nguyên nhân**: Sử dụng CDN imports thay vì npm package
- **Giải pháp**: Đã chuyển sang sử dụng `firebase` package

### **4. Lỗi "auth/network-request-failed"**
- **Nguyên nhân**: Vấn đề kết nối mạng
- **Giải pháp**: Thêm timeout và fallback logic

### **5. Lỗi "auth/popup-closed-by-user"**
- **Nguyên nhân**: User đóng popup
- **Giải pháp**: Thông báo rõ ràng và cho phép thử lại

## 📱 **Best Practices**

1. **Luôn có fallback**: Sử dụng cả popup và redirect
2. **Timeout cho popup**: Tránh popup treo vô thời hạn
3. **Xử lý lỗi tốt**: Catch và log tất cả lỗi với thông báo cụ thể
4. **Kiểm tra redirect result**: Trong useEffect khi component mount
5. **Sử dụng cấu hình tập trung**: Tránh duplicate config
6. **Sử dụng custom hook**: `useFirebaseAuth` để quản lý state tốt hơn

## 🔍 **Debug**

### **Console logs hữu ích**
```javascript
console.log('Popup failed, trying redirect:', popupError);
console.log('Both popup and redirect failed:', redirectError);
console.log('Redirect result error:', error);
console.log('Redirect initiated, waiting for result...');
```

### **Kiểm tra trạng thái kết nối**
```javascript
console.log('WebSocket connected for notifications');
console.log('WebSocket disconnected:', event.code, event.reason);
```

### **Error codes Firebase**
```javascript
// Các error code phổ biến
'auth/network-request-failed'     // Lỗi mạng
'auth/popup-closed-by-user'       // Popup bị đóng
'auth/popup-blocked'              // Popup bị chặn
'auth/cancelled-popup-request'    // Yêu cầu popup bị hủy
'auth/popup-timeout'              // Popup timeout
```

## 🆕 **Hook mới: useFirebaseAuth**

Hook này cung cấp:
- **State management**: `user`, `loading`, `error`
- **Methods**: `signInWithGoogle`, `signOut`, `getIdToken`
- **Auto redirect handling**: Tự động xử lý kết quả redirect
- **Error handling**: Xử lý lỗi chi tiết với thông báo rõ ràng

```javascript
const {
  user,                    // Firebase user object
  loading,                 // Loading state
  error,                   // Error message
  signInWithGoogle,        // Sign in method
  signOut,                 // Sign out method
  getIdToken,              // Get ID token
  clearError               // Clear error
} = useFirebaseAuth();
```

## 📚 **Tài liệu tham khảo**

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)
- [Google Sign-in Guide](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Error Codes](https://firebase.google.com/docs/auth/admin/errors)
