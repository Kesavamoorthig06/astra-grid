import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './global.css';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../i18n/config';

import NavbarNew from '../components/layout/NavbarNew';
import NavbarSimple from '../components/layout/NavbarSimple';
import Dashboard from '../pages/Dashboard';
import TransmissionLineForm from '../pages/TransmissionLineForm';
import History from '../pages/History';
import AccountSettings from '../pages/AccountSettings';
import Magic from '../pages/Magic';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import SimulationPage from '../pages/SimulationPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { ToastSystemProvider } from '../components/ui/toaster';
import MetricDashboard from '../components/metrics/MetricDashboard';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [, forceUpdate] = useState();
  const hideNavbar = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';
  const useSimpleNavbar = location.pathname === '/history' || location.pathname === '/settings' || location.pathname === '/magic';

  useEffect(() => {
    // Prevent back navigation to login after authentication
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/prediction', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    // Force re-render when language changes
    const handleLanguageChange = () => {
      forceUpdate({});
    };

    window.addEventListener('languageChanged', handleLanguageChange);
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <div className="min-h-screen">
      {!hideNavbar && (useSimpleNavbar ? <NavbarSimple /> : <NavbarNew />)}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/prediction" element={
          <ProtectedRoute>
            <TransmissionLineForm />
          </ProtectedRoute>
        } />
        <Route path="/simulation" element={
          <ProtectedRoute>
            <SimulationPage />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AccountSettings />
          </ProtectedRoute>
        } />
        <Route path="/magic" element={
          <ProtectedRoute>
            <Magic />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/metrics" element={<MetricDashboard />} />
      </Routes>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <React.Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
      <ThemeProvider>
        <ToastSystemProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </ToastSystemProvider>
      </ThemeProvider>
    </React.Suspense>
  </React.StrictMode>
);
