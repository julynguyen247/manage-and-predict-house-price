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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <AuthProvider>
    <NotificationProvider>
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
      </Router>
    </NotificationProvider>
  </AuthProvider>
);
