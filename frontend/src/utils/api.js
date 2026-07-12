import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
  (config) => {
    // We only access localStorage in the browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if it's invalid/expired, but avoid redirect loops
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Only redirect if we are not already on the login or signup page
        if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
            window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
