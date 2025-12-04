import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import NavigationMenuDemo from '../navigation-menu/default';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useTranslation } from 'react-i18next';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();
  const [userName, setUserName] = useState('Project Admin');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Officer');

  useEffect(() => {
    try {
      // Get user data from localStorage
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        setUserName(userData.name || 'Project Admin');
        setUserEmail(userData.email || '');
        
        // Determine role based on email domain or other criteria
        if (userData.email) {
          if (userData.email.includes('@gov.in') || userData.email.includes('@nic.in')) {
            setUserRole('Government Officer');
          } else if (userData.email.includes('@admin')) {
            setUserRole('Administrator');
          } else {
            setUserRole('Officer');
          }
        }
      } else {
        // Fallback to old userName storage
        const storedName = localStorage.getItem('userName') || localStorage.getItem('username');
        if (storedName) {
          setUserName(storedName);
        }
      }
    } catch (error) {
      console.warn('Unable to read stored user info', error);
    }
  }, []);

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
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm dark:shadow-slate-900/50">
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
              <h1 className="text-xl font-semibold text-black dark:text-white">ASTRA GRID</h1>
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
              <TabsList className="bg-white dark:bg-slate-800/80 p-1 h-auto rounded-md shadow-inner shadow-black/5 dark:shadow-slate-900/30">
                <TabsTrigger
                  value="/dashboard"
                  asChild
                  className="px-4 py-2 text-sm font-semibold text-gray-600 transition-colors rounded-md hover:bg-black/5 data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  <Link to="/dashboard">{t('nav.dashboard')}</Link>
                </TabsTrigger>
                <TabsTrigger
                  value="/prediction"
                  asChild
                  className="px-4 py-2 text-sm font-semibold text-gray-600 transition-colors rounded-md hover:bg-black/5 data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  <Link to="/prediction">{t('nav.prediction')}</Link>
                </TabsTrigger>
                <TabsTrigger
                  value="/simulation"
                  asChild
                  className="px-4 py-2 text-sm font-semibold text-gray-600 transition-colors rounded-md hover:bg-black/5 data-[state=active]:bg-black data-[state=active]:text-white"
                >
                  <Link to="/simulation">{t('nav.simulation')}</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="size-10">
              <AvatarImage 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}&eyes=happy&mouth=smile&skinColor=light`} 
                alt={userName} 
              />
              <AvatarFallback className="bg-black text-white text-sm font-semibold">
                {userName.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('') || 'PA'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-500">{userRole}</p>
              <p className="text-sm font-semibold text-black dark:text-white">{userName}</p>
              {userEmail && (
                <p className="text-[0.65rem] text-gray-500 dark:text-gray-400">{userEmail}</p>
              )}
            </div>
            <NavigationMenuDemo onLogout={handleLogout} />
          </div>
        </div>
      </div>
    </nav>
  );
}
