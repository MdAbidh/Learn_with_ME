import axios from 'axios';

// On Vercel: REACT_APP_API_URL="/api", REACT_APP_API_BASE_URL=""  (set in vercel.json env)
// Locally:   falls back to http://localhost:5000/api and http://localhost:5000
const API_URL      = process.env.REACT_APP_API_URL      || 'http://localhost:5000/api';
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL !== undefined
  ? process.env.REACT_APP_API_BASE_URL
  : 'http://localhost:5000';

if (process.env.NODE_ENV === 'development') {
  console.log('🔧 API:', API_URL, '| Base:', API_BASE_URL);
}

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📤', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📥', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    const status  = error.response?.status;
    console.error('❌ API Error:', { status, message, url: error.config?.url });
    if (status === 404)              console.error('⚠️  Not Found');
    if (status === 500)              console.error('⚠️  Server Error');
    if (error.code === 'ECONNABORTED') console.error('⚠️  Timeout');
    if (error.message === 'Network Error') console.error('⚠️  Network Error — check REACT_APP_API_URL');
    return Promise.reject(new Error(message));
  }
);

export default api;
