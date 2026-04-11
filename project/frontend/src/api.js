import axios from 'axios';

const BASE = 'http://localhost:8000/api/v1';

const API = axios.create({ baseURL: BASE });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          // Backend URL: /auth/token/refresh/
          const res = await axios.post(`${BASE}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', res.data.access);
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return axios(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) => API.post('/auth/signup/', data),
  login:  (data) => API.post('/auth/login/', data),
  google: (data) => API.post('/auth/google/', data),
  passwordReset: (data) => API.post('/auth/password-reset/', data),
  passwordResetConfirm: (data) => API.post('/auth/password-reset-confirm/', data),
  // Backend returns: { success: true, data: {...user fields} }
  me: () => API.get('/auth/me/'),
};

export const adviceAPI = {
  // Backend returns: { success, message, data: { id, query, ai_response, ... } }
  ask:     (data) => API.post('/advice/ask/', data),
  history: ()     => API.get('/advice/history/'),
};

export const documentAPI = {
  // Backend returns: { success, message, data: { id, generated_text, ... } }
  generate: (data) => API.post('/documents/generate/', data),
  list:     ()     => API.get('/documents/'),
  pdf:      (id)   => API.get(`/documents/${id}/pdf/`, { responseType: 'blob' }),
};

export default API;
