// Network detection utility
export const getBackendUrl = () => {
  const hostname = window.location.hostname;
  
  // If accessing from network IP (not localhost/127.0.0.1), use that IP
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}`;
  }
  
  // Otherwise use localhost
  return 'http://localhost';
};

export const AUTH_API_URL = `${getBackendUrl()}:5001`;
export const PREDICTION_API_URL = `${getBackendUrl()}:5000`;
export const SIMULATION_API_URL = `${getBackendUrl()}:5002`;
export const CHATBOT_API_URL = `${getBackendUrl()}:5003`;
export const DOCUMENT_EXTRACTOR_API_URL = `${getBackendUrl()}:5004`;

// Helper functions for endpoints
export const authUrl = (path = '') => `${AUTH_API_URL}${path}`;
export const predictionUrl = (path = '') => `${PREDICTION_API_URL}${path}`;
export const simulationUrl = (path = '') => `${SIMULATION_API_URL}${path}`;
export const chatbotUrl = (path = '') => `${CHATBOT_API_URL}${path}`;
export const documentExtractorUrl = (path = '') => `${DOCUMENT_EXTRACTOR_API_URL}${path}`;
