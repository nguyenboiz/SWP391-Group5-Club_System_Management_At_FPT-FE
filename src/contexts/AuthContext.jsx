import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockDb } from '../utils/mockDb';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('fpt_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Re-verify user still exists in DB
        const dbUser = mockDb.getData().users.find(u => u.id === parsed.id);
        if (dbUser) setCurrentUser(dbUser);
        else sessionStorage.removeItem('fpt_current_user');
      } catch {
        sessionStorage.removeItem('fpt_current_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login: find user by id, password is always '123456' for mock
  const login = (userId, password) => {
    if (password !== '123456') {
      return { success: false, error: 'Mật khẩu không đúng. (Mật khẩu demo: 123456)' };
    }
    const user = mockDb.getData().users.find(u => u.id === userId);
    if (!user) {
      return { success: false, error: 'Không tìm thấy tài khoản với MSSV/Mã cán bộ này.' };
    }
    if (user.status === 'Blocked') {
      return { success: false, error: 'Tài khoản này đã bị khóa. Liên hệ phòng IC-PDP.' };
    }
    setCurrentUser(user);
    sessionStorage.setItem('fpt_current_user', JSON.stringify(user));
    return { success: true, role: user.role };
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('fpt_current_user');
  };

  // Refresh user data from DB (after updates)
  const refreshUser = () => {
    if (currentUser) {
      const updated = mockDb.getData().users.find(u => u.id === currentUser.id);
      if (updated) {
        setCurrentUser(updated);
        sessionStorage.setItem('fpt_current_user', JSON.stringify(updated));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
