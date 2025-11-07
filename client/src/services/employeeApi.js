import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Create separate axios instance for employee API
const employeeApiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add employee auth token
employeeApiInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('employeeAccessToken');
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
employeeApiInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/me')) {
      originalRequest._retry = true;

      // Show user-friendly session timeout message
      toast.error('Your session has expired. Please log in again.', {
        duration: 5000,
        icon: '🔒'
      });

      // Clear tokens and redirect to employee login
      Cookies.remove('employeeAccessToken');
      Cookies.remove('employeeRefreshToken');
      Cookies.remove('employee');
      
      // Small delay to show the message before redirect
      setTimeout(() => {
        window.location.href = '/employee/login';
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
        Cookies.remove('employeeAccessToken');
        Cookies.remove('employeeRefreshToken');
        Cookies.remove('employee');
        setTimeout(() => {
          window.location.href = '/employee/login';
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

const employeeApi = {
  // Authentication
  login: async (email, password) => {
    const response = await employeeApiInstance.post('/employee/auth/login', {
      email,
      password
    });
    return response.data;
  },

  logout: async () => {
    const response = await employeeApiInstance.post('/employee/auth/logout');
    return response.data;
  },

  getCurrentEmployee: async () => {
    const response = await employeeApiInstance.get('/employee/auth/me');
    return response.data;
  },

  // Payments
  getAllPayments: async (params = {}) => {
    const response = await employeeApiInstance.get('/employee/payments', { params });
    return response.data;
  },

  getPaymentById: async (id) => {
    const response = await employeeApiInstance.get(`/employee/payments/${id}`);
    return response.data;
  },

  updatePaymentStatus: async (id, status, notes = '') => {
    const response = await employeeApiInstance.put(`/employee/payments/${id}/status`, {
      status,
      notes: notes || '' // Ensure notes is always a string
    });
    return response.data;
  },

  getPaymentStats: async () => {
    const response = await employeeApiInstance.get('/employee/payments/stats');
    return response.data;
  },

  // Customers
  getAllCustomers: async (params = {}) => {
    const response = await employeeApiInstance.get('/employee/customers', { params });
    return response.data;
  }
};

export default employeeApi;


