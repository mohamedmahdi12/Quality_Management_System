"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { AcademicYearProvider } from '../src/contexts/AcademicYearContext';

// Create Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTokens = localStorage.getItem('tokens');
      return savedTokens ? JSON.parse(savedTokens) : null;
    }
    return null;
  });

  const login = async (email, password) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Invalid credentials');
      }
      
      const data = await response.json();
      setTokens(data);
      localStorage.setItem('tokens', JSON.stringify(data));
      
      await fetchUserData(data.access);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('tokens');
  };

  const refreshToken = async () => {
    if (!tokens?.refresh) return null;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });
      
      if (!response.ok) {
        logout();
        return null;
      }
      
      const newTokens = await response.json();
      const updatedTokens = { ...tokens, access: newTokens.access };
      setTokens(updatedTokens);
      localStorage.setItem('tokens', JSON.stringify(updatedTokens));
      return updatedTokens.access;
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return null;
    }
  };

  const fetchUserData = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // API client with automatic token refresh
  const apiClient = async (endpoint, options = {}) => {
    if (!tokens?.access) {
      throw new Error('No access token available');
    }

    // Prepare headers with authentication
    let headers = {
      'Authorization': `Bearer ${tokens.access}`,
      ...options.headers,
    };

    // Only add Content-Type if NOT sending FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      // First attempt with current access token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // If unauthorized, try to refresh token and retry
      if (response.status === 401) {
        const newToken = await refreshToken();
        if (!newToken) throw new Error('Session expired');
        // Retry with new token
        return fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      }
      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  };

  // Initialize: Check if user is logged in
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (tokens?.access) {
          // First try with existing token
          const userData = await fetchUserData(tokens.access);
          
          // If that fails, try refreshing the token
          if (!userData && tokens.refresh) {
            const newToken = await refreshToken();
            if (newToken) {
              await fetchUserData(newToken);
            }
          }
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const authValue = {
    user,
    tokens,
    loading,
    login,
    logout,
    apiClient,
    isAuthenticated: !!tokens?.access,
  };

  return (
    <AuthContext.Provider value={authValue}>
      <AcademicYearProvider>
        {children}
        <Toaster position="top-right" />
      </AcademicYearProvider>
    </AuthContext.Provider>
  );
}