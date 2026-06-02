import axios from 'axios';

// Debug API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Log API configuration (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:');
  console.log('   API URL:', API_URL);
  console.log('   Environment:', process.env.NODE_ENV);
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    const status = error.response?.status;
    
    console.error('❌ API Error:', {
      status,
      message,
      url: error.config?.url,
      method: error.config?.method,
    });
    
    // Handle specific errors
    if (status === 404) {
      console.error('⚠️  Not Found - Check if API server is running');
    }
    if (status === 500) {
      console.error('⚠️  Server Error - Backend may be down');
    }
    if (error.code === 'ECONNABORTED') {
      console.error('⚠️  Request Timeout - API server may be unresponsive');
    }
    if (error.message === 'Network Error') {
      console.error('⚠️  Network Error - Cannot reach API. Check REACT_APP_API_URL');
    }
    
    return Promise.reject(new Error(message));
  }
);

export default api;
