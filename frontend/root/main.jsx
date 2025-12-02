import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import './global.css';
import NavbarNew from '../components/layout/NavbarNew';
import Dashboard from '../pages/Dashboard';
import TransmissionLineForm from '../pages/TransmissionLineForm';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { ToastSystemProvider } from '../components/ui/toaster';

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNavbar = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';

  useEffect(() => {
    // Prevent back navigation to login after authentication
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (isAuthenticated && (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup')) {
      navigate('/prediction', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen">
      {!hideNavbar && <NavbarNew />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/prediction" element={
          <ProtectedRoute>
            <TransmissionLineForm />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <ToastSystemProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </ToastSystemProvider>
  </React.StrictMode>
);
