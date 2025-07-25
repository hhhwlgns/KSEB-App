import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { setAuthToken, loginAPI } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password:string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStoredAuthData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          const storedUser = await AsyncStorage.getItem('user');
          const parsedUser = storedUser ? JSON.parse(storedUser) : null;
          
          setToken(storedToken);
          setUser(parsedUser);
          setAuthToken(storedToken); // API 클라이언트 헤더 설정
        }
      } catch (error) {
        console.error('Failed to load auth data from storage', error);
        // 이전 데이터 클리어
        await AsyncStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuthData();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { user: userData, token: authToken } = await loginAPI(email, password);
      
      await AsyncStorage.setItem('token', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);
      setAuthToken(authToken); // API 클라이언트 헤더 설정
    } catch (error) {
      console.error('Login failed:', error);
      // 에러를 다시 던져서 로그인 화면에서 처리할 수 있도록 함
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
      setAuthToken(null); // API 클라이언트 헤더에서 토큰 제거
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
