import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

function getFriendlyName(username, meName) {
  // If the name looks like a student ID (e.g. se180001, pe123456), it's not a real name
  const looksLikeStudentId = (s) => /^[a-z]{2}\d{5,8}$/i.test(String(s || '').trim());

  // Use real name from API if it's different from username and not a student ID format
  if (meName && !looksLikeStudentId(meName) && meName.trim() !== String(username || '').trim()) {
    return meName.trim();
  }
  // If no real name available (backend hasn't set fullName yet), return empty so UI shows placeholder
  return '';
}


export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('fpt_token') || localStorage.getItem('fpt_token');

      if (token) {
        try {
          const requireClubSelection = sessionStorage.getItem('fpt_require_club_selection') === 'true';
          const savedUser = sessionStorage.getItem('fpt_current_user');
          
          if (requireClubSelection && savedUser) {
            // Đang trong quá trình chọn CLB (chỉ có tempToken), không gọi getMe()
            setCurrentUser(JSON.parse(savedUser));
            setIsLoading(false);
            return;
          }

          // Lấy thông tin mới nhất từ BE
          const me = await authService.getMe();
          const rawRole = me?.systemRole || me?.role || me?.roleName || 'MEMBER';
          const normalizedRole = String(rawRole).toUpperCase();
          const userWithToken = {
            ...me,
            id: me?.id || me?.studentId || me?.userId,
            fullName: getFriendlyName(me?.username || me?.studentId || me?.userId, me?.fullName || me?.name || me?.studentName || me?.username),
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
          sessionStorage.removeItem('fpt_available_clubs');
          sessionStorage.removeItem('fpt_require_club_selection');
          sessionStorage.removeItem('fpt_temp_token');
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

  // Login: chỉ gọi API thật
  const login = async (userId, password) => {
    try {
      const result = await authService.login(userId, password);
      const token = result?.accessToken || result?.token || result?.tempToken || result?.jwt || (typeof result === 'string' ? result : null);

      if (token) {
        sessionStorage.setItem('fpt_token', token);
        
        let me = null;
        if (result?.requireClubSelection) {
          // Nếu yêu cầu chọn CLB, không gọi /api/auth/me vì tempToken không có quyền gọi endpoint này
          console.log('[Auth] requireClubSelection is true, skipping getMe() call');
        } else {
          try {
            me = await authService.getMe();
          } catch (meErr) {
            console.warn('[Auth] Lỗi gọi getMe(), dùng thông tin từ login result:', meErr);
          }
        }
        
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
        const rawRole = me?.systemRole || result?.userInfo?.systemRole || result?.systemRole || me?.role || result?.userInfo?.role || result?.role || me?.roleName || result?.roleName || 'MEMBER';
        const normalizedRole = String(rawRole).toUpperCase();
        
        const userWithToken = {
          ...me,
          id: me?.id || me?.studentId || me?.userId || result?.userInfo?.userId || result?.userInfo?.id || result?.id || userId,
          fullName: getFriendlyName(
            me?.username || result?.userInfo?.username || userId,
            me?.fullName || me?.name || me?.studentName || me?.username || result?.userInfo?.fullName || result?.userInfo?.username || result?.fullName
          ),
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
        setCurrentUser(prev => {
          const userWithToken = {
            ...me,
            avatar: me.avatar || prev?.avatar,
            id: me.id || me.studentId || me.userId || prev?.id,
            fullName: getFriendlyName(me.username || prev?.username, me.fullName || me.name || me.studentName || me.username || prev?.fullName),
            role: normalizedRole,
            token
          };
          sessionStorage.setItem('fpt_current_user', JSON.stringify(userWithToken));
          return userWithToken;
        });
      } catch (err) {
        console.warn('[Auth] Lỗi refresh thông tin user từ Backend:', err);
      }
    }
  };

  // Cập nhật nhanh ảnh đại diện sau khi upload thành công
  const updateUserAvatar = (avatarUrl) => {
    setCurrentUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, avatar: avatarUrl };
      sessionStorage.setItem('fpt_current_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading, refreshUser, updateUserAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


