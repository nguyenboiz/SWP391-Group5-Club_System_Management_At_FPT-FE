import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute: Bảo vệ route theo role.
 * - Nếu chưa login → redirect /login
 * - ADMIN chỉ vào được /admin
 * - MANAGER và MEMBER đều có thể vào /manager hoặc /member
 *   (vì một người có thể là Leader ở CLB A nhưng Member ở CLB B)
 * - Nếu là MEMBER cố vào /admin → redirect /select-club
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, isLoading } = useAuth();

  // Đang restore session
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        height: '100vh', background: 'var(--bg-main)' 
      }}>
        <div className="login-spinner" style={{ width: '32px', height: '32px' }} />
      </div>
    );
  }

  // Chưa login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // ADMIN chỉ vào /admin
  if (requiredRole === 'ADMIN' && currentUser.role !== 'ADMIN') {
    return <Navigate to="/select-club" replace />;
  }

  // ADMIN cố vào /member hoặc /manager → redirect /admin
  if (requiredRole !== 'ADMIN' && currentUser.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  // MEMBER thuần (không phải MANAGER) cố vào /manager → redirect /member
  if (requiredRole === 'MANAGER' && currentUser.role === 'MEMBER') {
    return <Navigate to="/member" replace />;
  }

  // Các trường hợp còn lại: MANAGER vào /member OK, MEMBER vào /member OK, MANAGER vào /manager OK
  return children;
}
