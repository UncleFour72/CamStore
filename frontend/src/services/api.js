import axios from 'axios';

export const TOKEN_KEY = 'camstore_access_token';
export const REFRESH_TOKEN_KEY = 'camstore_refresh_token';
export const USER_KEY = 'camstore_user';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

const MESSAGE_MAP = {
  'Invalid email or password': 'Email hoac mat khau khong dung.',
  'User account is disabled': 'Tai khoan da bi khoa. Vui long lien he CamStore.',
  'Email is already registered': 'Email nay da duoc dang ky.',
  'Password must contain at least 6 characters': 'Mat khau phai co it nhat 6 ky tu.',
  'Current password is incorrect': 'Mat khau hien tai khong dung.',
  'Authentication token is required': 'Vui long dang nhap de tiep tuc.',
  'Invalid or expired token': 'Phien dang nhap da het han. Vui long dang nhap lai.',
};

const normalizeErrorMessage = (error) => {
  if (error.code === 'ECONNABORTED') {
    error.message = 'Ket noi toi may chu qua lau. Vui long thu lai.';
  } else if (!error.response) {
    error.message = 'Khong ket noi duoc toi API Gateway. Hay kiem tra backend dang chay.';
  }

  const message = error.response?.data?.message;

  if (message && MESSAGE_MAP[message]) {
    error.response.data.message = MESSAGE_MAP[message];
  }

  return error;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    normalizeErrorMessage(error);

    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    return Promise.reject(error);
  }
);

export const unwrapData = (response) => response.data;

export default api;
