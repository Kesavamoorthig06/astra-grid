// API Configuration with Environment Variables
// For production, set these in .env file

const getApiUrls = () => {
  // Use environment variables if available
  if (import.meta.env.VITE_API_URL) {
    return {
      API_BASE_URL: import.meta.env.VITE_API_URL,
    };
  }

  // Try to detect if we're accessing from network
  const hostname = window.location.hostname;
  
  // If accessing from network IP (not localhost)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return {
      API_BASE_URL: `http://${hostname}:5000`,
    };
  }
  
  // Default to localhost
  return {
    API_BASE_URL: 'http://localhost:5000',
  };
};

const config = getApiUrls();

export const API_BASE_URL = config.API_BASE_URL;

// Helper function to build API endpoint
export const apiUrl = (path = '') => `${API_BASE_URL}${path}`;


