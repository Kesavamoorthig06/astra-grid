import axios from 'axios';

// Change this to match your backend URL
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatAPI = {
  sendMessage: async (message) => {
    const response = await api.post('/chat', { message });
    return response.data;
  },
};

export const projectsAPI = {
  getAll: async (limit = 50) => {
    const response = await api.get('/projects', { params: { limit } });
    return response.data;
  },
};

export const statsAPI = {
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
};

export const fileAPI = {
  uploadFile: async (formData) => {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
