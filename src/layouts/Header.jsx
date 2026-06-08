import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function Header({ 
  currentRole, 
  selectedClubId, 
  setSelectedClubId,
  dbData, 
  pageTitle,
  triggerNotification
}) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    triggerNotification('Đã đăng xuất khỏi hệ thống.', 'info');
    navigate('/login');
  };

  return (
    <header className="top-header">
      <div className="page-title-section">
        <h2>{pageTitle}</h2>
      </div>

      <div className="header-actions">
        {/* Manager: select which club to manage */}
        {currentRole === 'MANAGER' && setSelectedClubId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CLB đang quản lý:</span>
            <select 
              className="select-field" 
              value={selectedClubId}
              onChange={e => {
                setSelectedClubId(e.target.value);
                const name = dbData.clubs.find(c => c.id === e.target.value)?.name.split(' - ')[0];
                triggerNotification(`Đang xem CLB: ${name}`, 'info');
              }}
              style={{ width: '140px', padding: '4px 8px', fontSize: '12px' }}
            >
              {dbData.clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name.split(' - ')[0]}</option>
              ))}
            </select>
          </div>
        )}

        {/* Current user info + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                {currentUser.fullName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <span className={`badge ${currentRole === 'ADMIN' ? 'badge-admin' : currentRole === 'MANAGER' ? 'badge-manager' : 'badge-member'}`}
                  style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {currentRole}
                </span>
                {' '}{currentUser.id}
              </div>
            </div>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
            title="Đăng xuất"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </div>
    </header>
  );
}
