// Admin authentication utility
import React from 'react';

const ADMIN_EMAILS = ['abroesly@powergrid.com', 'kesavamoorthi@powergrid.com'];

/**
 * Check if the current user is an admin
 * @returns {boolean} true if user is admin, false otherwise
 */
export const isAdmin = () => {
  try {
    const userDataStr = localStorage.getItem('user');
    if (!userDataStr) return false;
    
    const userData = JSON.parse(userDataStr);
    return ADMIN_EMAILS.includes(userData.email);
  } catch (error) {
    console.warn('Unable to check admin status', error);
    return false;
  }
};

/**
 * React hook to check admin status with reactivity
 * @returns {boolean} true if user is admin
 */
export const useIsAdmin = () => {
  const [adminStatus, setAdminStatus] = React.useState(false);

  React.useEffect(() => {
    setAdminStatus(isAdmin());
    
    // Listen for user changes (login/logout)
    const handleStorageChange = () => {
      setAdminStatus(isAdmin());
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
    };
  }, []);

  return adminStatus;
};
