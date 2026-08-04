import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const TOKEN_STORAGE_KEY = 'token';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json'
  }
});

export const getAuthToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    delete api.defaults.headers.common.Authorization;
  }
};

export const clearAuthToken = () => {
  setAuthToken(null);
};

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken();
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/clinic')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

const existingToken = getAuthToken();
if (existingToken) {
  setAuthToken(existingToken);
}

export default api;
