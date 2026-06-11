import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "advocate" | "user";
  is_verified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from localStorage on app mount
  useEffect(() => {
    const token      = localStorage.getItem("access_token");
    const savedUser  = localStorage.getItem("user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Call Django login API
    const response = await axios.post(
      `${API_BASE}/auth/login/`,
      { email: email.trim().toLowerCase(), password },
      { headers: { "Content-Type": "application/json" } }
    );

    const { success, data, message } = response.data;

    if (!success) {
      throw new Error(message || "Login failed");
    }

    // Save tokens and user to localStorage
    localStorage.setItem("access_token",  data.access);
    localStorage.setItem("refresh_token", data.refresh);
    localStorage.setItem("user",          JSON.stringify(data.user));

    // Update React state
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Re-reads the user from localStorage so that profile updates are
  // immediately reflected in the UI without a full page reload.
  const refreshUser = () => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { /* ignore corrupt data */ }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
