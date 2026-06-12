import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('fpt_token') || localStorage.getItem('fpt_token');

      if (token) {
        try {
          // Lấy thông tin mới nhất từ BE
          const me = await authService.getMe();
          const rawRole = me?.systemRole || me?.role || me?.roleName || 'MEMBER';
          const normalizedRole = String(rawRole).toUpperCase();
          const userWithToken = {
            ...me,
            id: me?.id || me?.studentId || me?.userId,
            fullName: me?.fullName || me?.name || me?.username,
            role: normalizedRole,
            token
          };
          setCurrentUser(userWithToken);
          sessionStorage.setItem('fpt_current_user', JSON.stringify(userWithToken));
        } catch (err) {
          console.warn('[Auth] Lỗi khôi phục session từ Backend:', err);
          // Hết hạn hoặc lỗi token -> xóa session
          setCurrentUser(null);
          sessionStorage.removeItem('fpt_current_user');
          sessionStorage.removeItem('fpt_token');
          sessionStorage.removeItem('fpt_selected_club');
          localStorage.removeItem('fpt_token');
        }
      } else {
        setCurrentUser(null);
        sessionStorage.removeItem('fpt_current_user');
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Login: chỉ gọi API thật, không dùng mockDb
  const login = async (userId, password) => {
    try {
      const result = await authService.login(userId, password);
      const token = result?.accessToken || result?.token || result?.tempToken || result?.jwt || (typeof result === 'string' ? result : null);

      if (token) {
        sessionStorage.setItem('fpt_token', token);
        
        // Gọi API me để lấy thông tin chi tiết
        const me = await authService.getMe();
        console.log('[Auth] login result:', result);
        console.log('[Auth] getMe response:', me);
        
        // Lưu availableClubs và requireClubSelection vào sessionStorage
        if (result?.availableClubs) {
          sessionStorage.setItem('fpt_available_clubs', JSON.stringify(result.availableClubs));
        } else {
          sessionStorage.removeItem('fpt_available_clubs');
        }
        sessionStorage.setItem('fpt_require_club_selection', result?.requireClubSelection ? 'true' : 'false');
        if (result?.tempToken) {
          sessionStorage.setItem('fpt_temp_token', result.tempToken);
        } else {
          sessionStorage.removeItem('fpt_temp_token');
        }
        
        // Lấy role từ me.systemRole hoặc me.role hoặc result.systemRole
        const rawRole = me?.systemRole || result?.systemRole || me?.role || result?.role || me?.roleName || result?.roleName || 'MEMBER';
        const normalizedRole = String(rawRole).toUpperCase();
        
        const userWithToken = {
          ...me,
          id: me?.id || me?.studentId || me?.userId || result?.id || userId,
          fullName: me?.fullName || me?.name || me?.username || result?.fullName || userId,
          role: normalizedRole,
          token
        };

        setCurrentUser(userWithToken);
        sessionStorage.setItem('fpt_current_user', JSON.stringify(userWithToken));
        return { success: true, role: normalizedRole, token };
      }
      return { success: false, error: 'Không nhận được token xác thực hợp lệ từ Backend.' };
    } catch (err) {
      console.error('[Auth] Đăng nhập API thất bại:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Đăng nhập thất bại.';
      return { success: false, error: errMsg };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[Auth] Lỗi gọi API logout:', err);
    }
    setCurrentUser(null);
    sessionStorage.removeItem('fpt_current_user');
    sessionStorage.removeItem('fpt_token');
    sessionStorage.removeItem('fpt_selected_club');
    sessionStorage.removeItem('fpt_available_clubs');
    sessionStorage.removeItem('fpt_require_club_selection');
    sessionStorage.removeItem('fpt_temp_token');
    localStorage.removeItem('fpt_token');
  };

  // Refresh thông tin user
  const refreshUser = async () => {
    const token = sessionStorage.getItem('fpt_token') || localStorage.getItem('fpt_token');
    if (token) {
      try {
        const me = await authService.getMe();
        const normalizedRole = (me.systemRole || me.role || 'MEMBER').toUpperCase();
        const userWithToken = {
          ...me,
          id: me.id || me.studentId || me.userId || currentUser?.id,
          fullName: me.fullName || me.name || me.username || currentUser?.fullName,
          role: normalizedRole,
          token
        };
        setCurrentUser(userWithToken);
        sessionStorage.setItem('fpt_current_user', JSON.stringify(userWithToken));
      } catch (err) {
        console.warn('[Auth] Lỗi refresh thông tin user từ Backend:', err);
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


