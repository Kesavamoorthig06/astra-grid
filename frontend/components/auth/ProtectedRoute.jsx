import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  useEffect(() => {
    const validateToken = async () => {
      if (!isAuthenticated) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5001/api/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        const data = await response.json();

        if (data.success) {
          setIsValid(true);
          
          // Prevent back navigation after authentication
          window.history.pushState(null, '', window.location.href);
          
          const handlePopState = () => {
            if (localStorage.getItem('isAuthenticated')) {
              window.history.pushState(null, '', window.location.href);
            } else {
              navigate('/', { replace: true });
            }
          };
          
          window.addEventListener('popstate', handlePopState);
          
          return () => {
            window.removeEventListener('popstate', handlePopState);
          };
        } else {
          // Invalid token - clear storage
          localStorage.clear();
          setIsValid(false);
        }
      } catch (err) {
        console.error('Token validation failed:', err);
        localStorage.clear();
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [isAuthenticated, navigate]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-gray-600">Validating session...</div>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return children;
}
