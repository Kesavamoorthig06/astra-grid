const API_URL = 'http://127.0.0.1:5000/api';

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
