import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import RootLayout from './layouts/RootLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AvaraLoadingExperience from './components/common/AvaraLoadingExperience';

import HomePage from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProfilePage from './pages/ProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route
            path="/listings/new"
            element={
              <ProtectedRoute>
                <CreateListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/listings/:id/edit"
            element={
              <ProtectedRoute>
                <EditListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/users/:username" element={<PublicProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [showLoading, setShowLoading] = useState(() => {
    return !sessionStorage.getItem('avara_loaded');
  });

  const handleLoadingComplete = () => {
    sessionStorage.setItem('avara_loaded', '1');
    setShowLoading(false);
  };

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AnimatePresence mode="wait">
            {showLoading && (
              <AvaraLoadingExperience
                key="avara-loading"
                onComplete={handleLoadingComplete}
                duration={1400}
              />
            )}
          </AnimatePresence>
          {!showLoading && <AnimatedRoutes />}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
