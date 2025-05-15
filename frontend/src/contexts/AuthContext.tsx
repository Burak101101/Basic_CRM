'use client'
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { 
  AuthUser,
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  getAuthToken,
  isAuthenticated,
  getStoredUser
} from '@/services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuth: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuth: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  error: null,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        if (isAuthenticated()) {
          // Either get user from localStorage or from API
          const userData = getStoredUser();
          if (userData) {
            setUser(userData);
            setIsAuth(true);
          } else {
            try {
              const freshUserData = await getCurrentUser();
              setUser(freshUserData);
              setIsAuth(true);
            } catch (error) {
              // Token might be invalid, clear auth state
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
            }
          }
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const response = await loginUser({ username, password });
      setUser(response.user);
      setIsAuth(true);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Giriş yaparken bir hata oluştu');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setError(null);
      setLoading(true);
      const response = await registerUser(userData);
      setUser(response.user);
      setIsAuth(true);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Kayıt olurken bir hata oluştu');
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
      setIsAuth(false);
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuth, login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
