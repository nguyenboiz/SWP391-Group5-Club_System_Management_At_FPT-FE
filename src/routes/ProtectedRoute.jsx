import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ProtectedRoute: Bảo vệ route theo role.
 * - Nếu chưa login → redirect /login
 * - Nếu sai role → redirect dashboard đúng role
 * - Nếu đúng → render children
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

  // Sai role → redirect về đúng dashboard
  if (requiredRole && currentUser.role !== requiredRole) {
    if (currentUser.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (currentUser.role === 'MANAGER') return <Navigate to="/manager" replace />;
    return <Navigate to="/member" replace />;
  }

  return children;
}
