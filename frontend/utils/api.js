const API_URL = 'http://127.0.0.1:5000';
const CHATBOT_URL = 'http://127.0.0.1:5003';

async function handleResponse(response) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }
  return response.json();
}

export async function predictRisk(form) {
  const response = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ form }),
  });

  return handleResponse(response);
}

export async function sendChatMessage(message) {
  const response = await fetch(`${CHATBOT_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  return handleResponse(response);
}

export async function checkBackendHealth() {
  const response = await fetch(`${API_URL}/health`);
  return handleResponse(response);
}
