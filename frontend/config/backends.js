// Network detection utility
export const getBackendUrl = () => {
  const hostname = window.location.hostname;
  const port = 5000;
  
  // If accessing from network IP (not localhost/127.0.0.1), use that IP
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:${port}`;
  }
  
  // Otherwise use localhost
  return `http://localhost:${port}`;
};

// Unified Backend - All services on port 5000
export const BACKEND_BASE_URL = getBackendUrl();
export const AUTH_API_URL = `${BACKEND_BASE_URL}/api`;
export const PREDICTION_API_URL = `${BACKEND_BASE_URL}/api`;
export const SIMULATION_API_URL = `${BACKEND_BASE_URL}/api`;
export const CHATBOT_API_URL = `${BACKEND_BASE_URL}/api`;
export const DOCUMENT_EXTRACTOR_API_URL = `${BACKEND_BASE_URL}/api`;

// Helper functions for endpoints
export const authUrl = (path = '') => `${AUTH_API_URL}${path}`;
export const predictionUrl = (path = '') => `${PREDICTION_API_URL}${path}`;
export const simulationUrl = (path = '') => `${SIMULATION_API_URL}${path}`;
export const chatbotUrl = (path = '') => `${CHATBOT_API_URL}${path}`;
export const documentExtractorUrl = (path = '') => `${DOCUMENT_EXTRACTOR_API_URL}${path}`;
