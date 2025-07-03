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
        console.log('=== AUTH INIT ===');
        console.log('isAuthenticated():', isAuthenticated());
        console.log('authToken:', localStorage.getItem('authToken'));
        console.log('user:', localStorage.getItem('user'));

        if (isAuthenticated()) {
          // Either get user from localStorage or from API
          const userData = getStoredUser();
          console.log('Stored user data:', userData);
          if (userData) {
            setUser(userData);
            setIsAuth(true);
            console.log('User set from localStorage');
          } else {
            try {
              console.log('Fetching user from API...');
              const freshUserData = await getCurrentUser();
              setUser(freshUserData);
              setIsAuth(true);
              console.log('User set from API:', freshUserData);
            } catch (error) {
              // Token might be invalid, clear auth state
              console.log('API call failed, clearing auth');
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
            }
          }
        } else {
          console.log('User not authenticated');
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
      } finally {
        setLoading(false);
        console.log('Auth init completed');
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Username:', username);

      const response = await loginUser({ username, password });
      console.log('Login response:', response);
      console.log('Token received:', response.token);

      setUser(response.user);
      setIsAuth(true);

      console.log('Auth state updated, redirecting to dashboard');
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
