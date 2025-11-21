import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
// import { suppressChromeExtensionErrors } from '../utils/chromeExtensionHandler';

// Firebase Configuration
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDING_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase with error handling
let app;
let auth;
let analytics;



try {
 
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Authentication with error handling
  auth = getAuth(app);
  
  // Suppress Chrome extension errors
  // suppressChromeExtensionErrors();
  
  // Initialize Analytics (only works on https or localhost)
  analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Fallback initialization
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  if (!auth) {
    auth = getAuth(app);
  }
}

export { app, auth, analytics };

// Validate Firebase config
export const validateFirebaseConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.warn('⚠️ Firebase configuration missing:', missingFields);
    return false;
  }
  
  return true;
};
