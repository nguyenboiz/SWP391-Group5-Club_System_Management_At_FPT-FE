import axios from 'axios';

// ============================================================
// Base URL: đổi thành URL backend thực tế của bạn
// Có thể dùng biến môi trường: import.meta.env.VITE_API_BASE_URL
// ============================================================
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: đính kèm Bearer token nếu có
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('fpt_token') ||
      sessionStorage.getItem('fpt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: xử lý lỗi chung
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn → có thể redirect về login nếu cần
      console.warn('[API] Unauthorized – token có thể đã hết hạn.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
