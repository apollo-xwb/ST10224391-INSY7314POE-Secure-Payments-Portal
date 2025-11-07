import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired) - but not for auth/me endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/me')) {
      originalRequest._retry = true;

      // Show user-friendly session timeout message
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
        icon: '🔒'
      });

      // Clear tokens and redirect to login
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      
      // Small delay to show the message before redirect
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
      return Promise.reject(error);
    }

    // Handle session timeout errors with specific messages
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || 'Session expired';
      if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('token')) {
        toast.error('Your session has expired. Please log in again.', {
          duration: 5000,
          icon: '🔒'
        });
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return Promise.reject(error);
      }
    }

    // Handle other errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('An unexpected error occurred');
    }

    return Promise.reject(error);
  }
);

export default api;