import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL2 || 'https://kichu-kotha.onrender.com';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) => {
    return api.post('/auth/login', { username, password });
  },

  register: (username, password) => {
    return api.post('/auth/register', { username, password });
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  verifyToken: async (token) => {
    const response = await api.get('/users/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  }
};

// User API
export const userAPI = {
  searchUsers: (username) => {
    return api.get(`/users/search?username=${username}`);
  },

  getUser: (userId) => {
    return api.get(`/users/${userId}`);
  },

  getContacts: () => {
    return api.get('/users/contacts');
  },

  addContact: (userId) => {
    return api.post('/users/contacts', { userId });
  },

  uploadProfilePic: (formData) => {
    return api.post('/users/profile-pic', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Message API
export const messageAPI = {
  getMessages: async (userId, limit = 20, before = null) => {
    let url = `/messages/${userId}?limit=${limit}`;
    if (before) {
      url += `&before=${encodeURIComponent(before)}`;
    }
    const response = await api.get(url);
    return response;
  },

  getOlderMessages: async (userId, beforeTimestamp, limit = 20) => {
    const response = await api.get(
      `/messages/${userId}/older?before=${encodeURIComponent(beforeTimestamp)}&limit=${limit}`
    );
    return response;
  },

  markAsRead: (messageId) => {
    return api.patch(`/messages/${messageId}/read`);
  },

  uploadFile: (formData) => {
    return api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },

    });
  }
//   uploadFile: (formData) => {
//   return api.post('/messages/upload', formData);
// }

};

export default api;