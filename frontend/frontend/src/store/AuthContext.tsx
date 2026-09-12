import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/client';

export interface AuthUser {
  userId: string;
  customerId?: string;
  email: string;
  name: string;
  avatar: string;
  role: 'user' | 'admin';
  country?: string;
  city?: string;
  climate?: string;
  preferredStyles?: string[];
  themePreference?: 'light' | 'dark' | 'system';
}

export interface DemoPersona {
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  country: string;
  styles: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    country?: string;
    city?: string;
    preferredStyles?: string[];
    themePreference?: 'light' | 'dark' | 'system';
  }) => Promise<void>;
  loginAsDemoPersona: (persona: DemoPersona) => Promise<void>;
  logout: () => void;
  demoPersonas: DemoPersona[];
  loadingPersonas: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('wardrobeiq_user');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wardrobeiq_token');
    }
    return null;
  });

  const [demoPersonas, setDemoPersonas] = useState<DemoPersona[]>([]);
  const [loadingPersonas, setLoadingPersonas] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        setLoadingPersonas(true);
        const personas = await apiClient.auth.getDemoPersonas();
        setDemoPersonas(personas);
      } catch (err) {
        console.warn('Could not load demo personas:', err);
      } finally {
        setLoadingPersonas(false);
      }
    };
    fetchPersonas();
  }, []);

  const saveAuthSession = (userData: AuthUser, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('wardrobeiq_user', JSON.stringify(userData));
    localStorage.setItem('wardrobeiq_token', authToken);
    if (userData.customerId) {
      localStorage.setItem('wardrobeiq_customer_id', userData.customerId);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await apiClient.auth.login({ email, password: pass });
    saveAuthSession(res.user, res.token);
    setIsAuthModalOpen(false);
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    country?: string;
    city?: string;
    preferredStyles?: string[];
    themePreference?: 'light' | 'dark' | 'system';
  }) => {
    const res = await apiClient.auth.register(data);
    saveAuthSession(res.user, res.token);
    setIsAuthModalOpen(false);
  };

  const loginAsDemoPersona = async (persona: DemoPersona) => {
    // Demo accounts have standard demo password
    const pass = persona.role === 'admin' ? 'admin123' : 'password123';
    try {
      await login(persona.email, pass);
    } catch {
      // Direct session fallback for instantaneous demo switching
      const mockUser: AuthUser = {
        userId: persona.userId,
        customerId: persona.userId,
        email: persona.email,
        name: persona.name,
        avatar: persona.avatar,
        role: persona.role as 'user' | 'admin',
        country: persona.country,
        preferredStyles: persona.styles,
      };
      saveAuthSession(mockUser, `demo_token_${persona.userId}`);
      setIsAuthModalOpen(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('wardrobeiq_user');
    localStorage.removeItem('wardrobeiq_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        loginAsDemoPersona,
        logout,
        demoPersonas,
        loadingPersonas,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
