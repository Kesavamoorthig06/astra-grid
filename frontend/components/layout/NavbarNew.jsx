import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5001/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Failed to clear auth cookie', error);
    } finally {
      localStorage.clear();
      window.history.pushState(null, '', '/');
      navigate('/', { replace: true });
      // Prevent going back after logout
      window.onpopstate = function() {
        window.history.pushState(null, '', '/');
      };
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <img
              src="/ministry-of-power-logo.svg"
              alt="Government of India emblem"
              className="h-12 w-auto object-contain"
              loading="lazy"
            />
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-black">ASTRA GRID</h1>
              <img
                src="/azadi-ka-amrit-mahotsav-official.png"
                alt="Azadi Ka Amrit Mahotsav official emblem"
                className="h-16 w-auto object-contain"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <Tabs value={currentPath} className="w-auto">
              <TabsList className="bg-white p-1 h-auto rounded-md shadow-inner shadow-black/5">
                <TabsTrigger
                  value="/"
                  disabled
                  className="opacity-40 cursor-not-allowed px-4 py-2 text-sm font-semibold text-gray-400"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger
                  value="/prediction"
                  asChild
                  className="px-4 py-2 text-sm font-semibold text-gray-600 transition-colors rounded-md hover:bg-black/5 data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  <Link to="/prediction">Prediction</Link>
                </TabsTrigger>
                <TabsTrigger
                  value="/simulation"
                  disabled
                  className="opacity-40 cursor-not-allowed px-4 py-2 text-sm font-semibold text-gray-400"
                >
                  Simulation
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-semibold text-black border border-black/20 rounded hover:bg-black hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
