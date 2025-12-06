/**
 * Authentication Context
 * Manages admin authentication state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/api';

interface Admin {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await apiClient.getCurrentAdmin();
      if (response.success) {
        setAdmin(response.admin);
      } else {
        apiClient.setToken(null);
      }
    } catch (error: any) {
      // Silently handle auth errors - user might not be logged in yet
      // 401 is expected when not authenticated, so don't log it
      if (error?.message && error.message !== 'Unauthorized' && !error.message.includes('401')) {
        console.error('Auth check failed:', error);
      }
      apiClient.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      if (response.success && response.admin) {
        setAdmin(response.admin);
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
    }
  };

  const refreshAdmin = async () => {
    try {
      const response = await apiClient.getCurrentAdmin();
      if (response.success) {
        setAdmin(response.admin);
      }
    } catch (error) {
      console.error('Failed to refresh admin:', error);
      setAdmin(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        isAuthenticated: !!admin,
        login,
        logout,
        refreshAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

