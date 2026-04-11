import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const cachedUser = localStorage.getItem('user');
    
    if (!token) {
      setLoading(false);
      return;
    }

    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)); } catch (e) {}
    }
    // Instantly stop loading so ProtectedRoute renders dashboard instead of waiting for /auth/me/
    setLoading(false);

    authAPI.me()
      .then((res) => {
        const userData = res.data?.data || res.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      })
      .catch(() => {
        localStorage.clear();
        setUser(null);
        window.location.href = '/login';
      });
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authAPI.login(credentials);
      const body = res.data;

      // If backend explicitly returns success: false (HTTP 200 with error body)
      if (!body.success) {
        return { success: false, message: body.message || 'Login failed.' };
      }

      const data = body.data;
      localStorage.setItem('access_token', data.access || data.access_token);
      localStorage.setItem('refresh_token', data.refresh || data.refresh_token);

      const userData = data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (err) {
      // HTTP 4xx/5xx errors
      const msg = err.response?.data?.message || 'Incorrect email or password.';
      return { success: false, message: msg };
    }
  };


  const signup = async (data) => {
    try {
      const res = await authAPI.signup(data);
      return res.data;
    } catch (error) {
      if (error.response && error.response.data) return error.response.data;
      throw error;
    }
  };

  const googleLogin = async (token) => {
    const res = await authAPI.google({ token });
    const data = res.data?.data || res.data;
    
    localStorage.setItem('access_token', data.access_token || data.access);
    localStorage.setItem('refresh_token', data.refresh_token || data.refresh);
    
    const userData = data.user;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, googleLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
