// API service to interact with the Python backend

const API_URL = 'http://localhost:5000';

export const predictModel = async (features) => {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ features }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Prediction error:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
};
