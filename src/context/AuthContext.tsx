
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  companyId?: string;
  companyName?: string;
  token?: string;
  isPaid?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento da sessão
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulação de login - em um sistema real, seria uma chamada para API
    if (email === 'admin@admin.com' && password === 'admin') {
      const adminUser: User = {
        id: '1',
        name: 'Administrador',
        email: 'admin@admin.com',
        role: 'admin',
        isPaid: true
      };
      setUser(adminUser);
      localStorage.setItem('user', JSON.stringify(adminUser));
      return true;
    } else if (email === 'medico@medico.com' && password === 'medico') {
      const medicUser: User = {
        id: '2',
        name: 'Dr. João Silva',
        email: 'medico@medico.com',
        role: 'user',
        companyId: '1',
        companyName: 'Clínica São Paulo',
        token: 'TOKEN123',
        isPaid: true
      };
      setUser(medicUser);
      localStorage.setItem('user', JSON.stringify(medicUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
