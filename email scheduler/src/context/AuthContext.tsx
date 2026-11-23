import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (customUser?: Partial<User>) => void;
  logout: () => void;
}

const DEFAULT_USER: User = {
  id: 'usr_google_1092',
  name: 'Oliver Brown',
  email: 'oliver.brown@domain.io',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  provider: 'google',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('reachinbox_auth_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(null);
      }
    } else {
      // Unauthenticated by default so the user lands on the exact Figma Login page
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const loginWithGoogle = (customUser?: Partial<User>) => {
    const loggedUser: User = {
      ...DEFAULT_USER,
      ...customUser,
      provider: 'google',
    };
    setUser(loggedUser);
    localStorage.setItem('reachinbox_auth_user', JSON.stringify(loggedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('reachinbox_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
