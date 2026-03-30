import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../utils/api'; 

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  user: any;
  setUser: (user: any) => void; 
  // ✅ FIX: Added userData as an optional parameter
  login: (token: string, role: string, userData?: any) => void;
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
      
      // ⚡ SPEED FIX: If we already have the user (passed from login), skip fetching!
      if (user) {
        setLoading(false);
        return;
      }
      
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
  }, [token, user]); // Added user to dependency array

  // ⚡ SPEED FIX: Accept userData immediately during login
  const login = (newToken: string, role: string, userData?: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (userData) {
        setUser(userData); // Instantly set user profile
    }
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