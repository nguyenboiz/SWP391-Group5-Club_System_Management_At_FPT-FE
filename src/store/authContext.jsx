import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockDb } from '../utils/mockDb';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbData, setDbData] = useState(mockDb.getData());

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    try {
      const storedId = localStorage.getItem('fpt_auth_userId');
      if (storedId) {
        const fresh = mockDb.getData();
        const user = fresh.users.find(u => u.id === storedId);
        if (user) setCurrentUser(user);
        const storedClub = localStorage.getItem('fpt_auth_clubId');
        if (storedClub) setSelectedClubId(storedClub);
      }
    } catch (e) {
      console.warn('Session restore failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync DB updates and keep current user profile fresh
  useEffect(() => {
    const handleUpdate = () => {
      const fresh = mockDb.getData();
      setDbData(fresh);
      if (currentUser) {
        const refreshed = fresh.users.find(u => u.id === currentUser.id);
        if (refreshed) setCurrentUser(refreshed);
      }
    };
    window.addEventListener('mockDbUpdate', handleUpdate);
    return () => window.removeEventListener('mockDbUpdate', handleUpdate);
  }, [currentUser]);

  /**
   * Login: accepts MSSV and password (all mock accounts use "123456")
   * Returns { success: bool, user?, error? }
   */
  const login = (userId, password) => {
    if (password !== '123456') {
      return { success: false, error: 'Mật khẩu không đúng! (Hint: 123456)' };
    }
    const db = mockDb.getData();
    const user = db.users.find(u => u.id.toLowerCase() === userId.trim().toLowerCase());
    if (!user) {
      return { success: false, error: `Không tìm thấy tài khoản với MSSV/Mã cán bộ: "${userId.trim()}"` };
    }

    setCurrentUser(user);
    localStorage.setItem('fpt_auth_userId', user.id);

    // Auto-assign club for MANAGER accounts
    if (user.role === 'MANAGER') {
      const membership = db.memberships.find(
        m => m.userId === user.id && m.status === 'Active' && m.role === 'Leader'
      );
      const clubId = membership?.clubId ?? db.clubs[0]?.id ?? 'js';
      setSelectedClubId(clubId);
      localStorage.setItem('fpt_auth_clubId', clubId);
    }

    return { success: true, user };
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedClubId(null);
    localStorage.removeItem('fpt_auth_userId');
    localStorage.removeItem('fpt_auth_clubId');
  };

  const switchClub = (clubId) => {
    setSelectedClubId(clubId);
    localStorage.setItem('fpt_auth_clubId', clubId);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      selectedClubId,
      switchClub,
      dbData,
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
