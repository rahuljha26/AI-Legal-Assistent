import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({ baseURL: BASE_URL });

// ── Request interceptor: attach Bearer token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: auto-refresh on 401 ────────────────────────────────
let refreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      }
      if (refreshing) {
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      refreshing = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken });
        const newAccess = data.access;
        localStorage.setItem('access_token', newAccess);
        queue.forEach((cb) => cb(newAccess));
        queue = [];
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  },
);

export default api;

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data: { full_name: string; email: string; password: string; confirm_password: string; role: string }) =>
    api.post('/auth/signup/', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login/', data),
  logout: (refresh_token: string) =>
    api.post('/auth/logout/', { refresh_token }),
  me: () => api.get('/auth/me/'),
  updateProfile: (data: { full_name?: string }) => api.patch('/auth/me/', data),
  changePassword: (data: { current_password: string; new_password: string; confirm_new_password: string }) =>
    api.post('/auth/change-password/', data),
};

// ── Advice API ────────────────────────────────────────────────────────────────
export const adviceAPI = {
  ask: (query: string) => api.post('/advice/ask/', { query }),
  history: (page = 1) => api.get(`/advice/history/?page=${page}`),
  getOne: (id: number) => api.get(`/advice/${id}/`),
  delete: (id: number) => api.delete(`/advice/${id}/`),
};

// ── Document API ──────────────────────────────────────────────────────────────
export const documentAPI = {
  generate: (document_type: string, details: Record<string, string>) =>
    api.post('/documents/generate/', { document_type, details }),
  list: () => api.get('/documents/'),
  getOne: (id: number) => api.get(`/documents/${id}/`),
  delete: (id: number) => api.delete(`/documents/${id}/`),
  downloadPdf: (id: number) => api.get(`/documents/${id}/pdf/`, { responseType: 'blob' }),
};

// ── Case API ──────────────────────────────────────────────────────────────────
export const caseAPI = {
  list: () => api.get('/cases/'),
  create: (data: Record<string, unknown>) => api.post('/cases/', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/cases/${id}/`, data),
  delete: (id: number) => api.delete(`/cases/${id}/`),
};

// ── Email API ─────────────────────────────────────────────────────────────────
export const emailAPI = {
  send: (data: any) => {
    if (data.attachment) {
      const fd = new FormData();
      Object.keys(data).forEach(k => {
        if (k === 'content') fd.append(k, JSON.stringify(data[k]));
        else fd.append(k, data[k]);
      });
      return api.post('/email/send/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/email/send/', data);
  },
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  users: (page = 1, role?: string) =>
    api.get(`/admin/users/?page=${page}${role ? `&role=${role}` : ''}`),
  verifyUser: (id: number) => api.patch(`/admin/users/${id}/verify/`),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}/`),
  stats: () => api.get('/admin/stats/'),
};
