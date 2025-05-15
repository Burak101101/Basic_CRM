import axios from 'axios';

// API'nin temel URL'sini tanımla
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Ana axios örneğini oluştur
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});// İstek interceptor'ü
apiClient.interceptors.request.use(
  (config) => {
    // Token varsa ekle
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cevap interceptor'ü
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },  (error) => {
    // 401 Unauthorized hatalarında oturumu sonlandır
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
