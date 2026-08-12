import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Interests from './pages/Interests';
import ProfileView from './pages/ProfileView';
import Matches from './pages/Matches';
import Membership from './pages/Membership';
import ComingSoon from './pages/ComingSoon';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';
import GlobalModal from './components/GlobalModal';
import BottomNav from './components/BottomNav';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

function App() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerPromise;
    try {
      listenerPromise = CapApp.addListener('backButton', (data) => {
        // If there is history to go back to (internal route states or our custom state steps)
        if (data.canGoBack || (window.history.state && window.history.state.registrationOpen)) {
          window.history.back();
        } else {
          CapApp.exitApp();
        }
      });
    } catch (e) {
      console.error("Capacitor App listener failed to attach:", e);
    }

    return () => {
      if (listenerPromise) {
        listenerPromise.then(listener => {
          if (listener && typeof listener.remove === 'function') {
            listener.remove();
          }
        }).catch(err => console.error("Error removing backButton listener:", err));
      }
    };
  }, []);
  return (
    <Router>
      <ScrollToTop />
      <div className="App">
        <GlobalModal />
        <BottomNav />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Register />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
          <Route path="/membership" element={<Membership />} />

          {/* Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:uniqueId" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/interests" element={<ProtectedRoute><Interests /></ProtectedRoute>} />
          <Route path="/profile-view" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />

          <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/settings/:section" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chat/:uniqueId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminPanel />} />

          <Route path="*" element={<ComingSoon title="Page Not Found" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
