<<<<<<< HEAD
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import App from "./App";
import SearchPage from "./pages/SearchPage";
import PropertyList from "./pages/PropertyList";
import PropertyDetail from "./pages/PropertyDetail";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Favorites from "./pages/Favorites";
import MyProperties from "./pages/MyProperties";
import MapTest from "./components/MapTest";
import PostProperty from "./pages/PostProperty";
import PricePrediction from "./pages/PricePrediction";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Messages from "./pages/Messages";
=======
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatProvider } from './contexts/ChatContext';
import App from './App';
import SearchPage from './pages/SearchPage';
import PropertyList from './pages/PropertyList';
import PropertyDetail from './pages/PropertyDetail';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Favorites from './pages/Favorites';
import MyProperties from './pages/MyProperties';
import MapTest from './components/MapTest';
import PostProperty from './pages/PostProperty';
import PricePrediction from './pages/PricePrediction';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import ChatMessage from './pages/ChatMessage';
>>>>>>> 78aad41f83a70eff0773d5075892e47d4c596343

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <NotificationProvider>
<<<<<<< HEAD
      <Router>
        <Routes>
          <Route path="/" element={<App />} />

          <Route path="/search" element={<SearchPage />} />

          <Route path="/property-list" element={<PropertyList />} />

          <Route path="/property/:id" element={<PropertyDetail />} />

          <Route path="/map-test" element={<MapTest />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />

          <Route
            path="/post-property"
            element={
              <ProtectedRoute>
                <PostProperty />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-properties"
            element={
              <ProtectedRoute>
                <MyProperties />
              </ProtectedRoute>
            }
          />

          <Route
            path="/price-prediction"
=======
      <ChatProvider>
        <Router>
      <Routes>
        {/* Trang chủ */}
        <Route path='/' element={<App />} />
        
        {/* Trang tìm kiếm */}
        <Route path='/search' element={<SearchPage />} />
        
        {/* Trang danh sách bất động sản */}
        <Route path='/property-list' element={<PropertyList />} />
        
                 {/* Trang chi tiết bất động sản */}
         <Route path='/property/:id' element={<PropertyDetail />} />
         
         {/* Test bản đồ */}
         <Route path='/map-test' element={<MapTest />} />
         
         {/* Các trang yêu cầu đăng nhập */}
        <Route 
          path='/profile' 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path='/favorites' 
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path='/messages' 
          element={
            <ProtectedRoute>
              <ChatMessage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path='/post-property' 
          element={
            <ProtectedRoute>
              <PostProperty />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path='/my-properties' 
          element={
            <ProtectedRoute>
              <MyProperties />
            </ProtectedRoute>
          } 
        />
        
                  <Route 
            path='/price-prediction' 
>>>>>>> 78aad41f83a70eff0773d5075892e47d4c596343
            element={
              <ProtectedRoute>
                <PricePrediction />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
        </Routes>
<<<<<<< HEAD
      </Router>
=======
    </Router>
      </ChatProvider>
>>>>>>> 78aad41f83a70eff0773d5075892e47d4c596343
    </NotificationProvider>
  </AuthProvider>
);
