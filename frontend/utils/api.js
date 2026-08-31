// Dynamic API URL detection - works on localhost, network, and EC2
const getBackendUrl = () => {
  const hostname = window.location.hostname;
  const port = 5000;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}/api`;
  } else {
    return `http://${hostname}:${port}/api`;
  }
};

const API_URL = getBackendUrl();

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json();
}

export async function predictRisk(form) {
  const response = await fetch(`${API_URL}/prediction/predict`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(form),
  });

  return handleResponse(response);
}

export async function sendChatMessage(message) {
  const token = localStorage.getItem('token');
  
  // Prepare headers
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}/chatbot/message`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  });

  return handleResponse(response);
}

export async function getChatHistory() {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const response = await fetch(`${API_URL}/chatbot/history`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${token}`
    },
  });

  return handleResponse(response);
}

export async function getChatbotCapabilities() {
  const response = await fetch(`${API_URL}/chatbot/capabilities`);
  return handleResponse(response);
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);
  return handleResponse(response);
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  return handleResponse(response);
}

export async function signupUser(name, email, password) {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  return handleResponse(response);
}

export async function verifyToken(token) {
  const response = await fetch(`${API_URL}/auth/verify-token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });

  return handleResponse(response);
}

export async function logoutUser() {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
  });

  return handleResponse(response);
}

// Prediction API calls
export async function getPredictionHistory(limit = 50) {
  const response = await fetch(`${API_URL}/prediction/history?limit=${limit}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
  });

  return handleResponse(response);
}

export async function getPredictionById(predictionId) {
  const response = await fetch(`${API_URL}/prediction/history/${predictionId}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
  });

  return handleResponse(response);
}

// Simulation API calls
export async function simulateScenarios(baseParameters) {
  const response = await fetch(`${API_URL}/simulation/scenarios`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(baseParameters),
  });

  return handleResponse(response);
}

export async function getRecommendations(predictionData) {
  const response = await fetch(`${API_URL}/simulation/recommendations`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(predictionData),
  });

  return handleResponse(response);
}

export async function compareProjects(projects) {
  const response = await fetch(`${API_URL}/simulation/compare`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ projects }),
  });

  return handleResponse(response);
}

// Document API calls
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/document/upload`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: formData,
  });

  return handleResponse(response);
}

export async function getDocumentStatus(fileId) {
  const response = await fetch(`${API_URL}/document/status/${fileId}`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
  });

  return handleResponse(response);
}

export async function getSupportedDocumentFormats() {
  const response = await fetch(`${API_URL}/document/supported-formats`, {
    method: 'GET',
  });

  return handleResponse(response);
}

// System/Health API calls
export async function getCurrentUser() {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: { 
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
  });

  return handleResponse(response);
}

export async function getSystemInfo() {
  const response = await fetch(`${API_URL}/info`, {
    method: 'GET',
  });

  return handleResponse(response);
}

