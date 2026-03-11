import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../utils/api'; 

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: any;
  setUser: (user: any) => void; 
  login: (token: string, role: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      // ✅ FIX: Ensure loading is true while we fetch the user data after login
      setLoading(true);
      
      try {
        const res = await api.get('/auth');
        setUser(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Auth Error", err);
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [token]); // This triggers every time the token changes (like on login)

  const login = (newToken: string, role: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('streakShown');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, loading, user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};