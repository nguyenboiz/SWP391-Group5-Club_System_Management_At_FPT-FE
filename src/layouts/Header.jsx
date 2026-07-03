import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ArrowLeftRight } from 'lucide-react';

export default function Header({ 
  currentRole, 
  isLeader = false,
  selectedClubId,
  dbData, 
  pageTitle,
  triggerNotification,
  onSwitchClub
}) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem('fpt_selected_club');
    logout();
    triggerNotification('Đã đăng xuất khỏi hệ thống.', 'info');
    navigate('/login');
  };

  // Get current club name for display
  const selectedClub = dbData?.clubs?.find(c => c.id === selectedClubId);

  return (
    <header className="top-header">
      <div className="page-title-section">
        <h2>{pageTitle}</h2>
        {/* Show current club chip for MEMBER only */}
        {currentRole === 'MEMBER' && selectedClub && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <img
              src={selectedClub.logo}
              alt={selectedClub.name}
              style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {selectedClub.name.split(' - ')[0]}
            </span>
          </div>
        )}
      </div>

      <div className="header-actions">
        {/* Switch club button for MEMBER only */}
        {currentRole === 'MEMBER' && onSwitchClub && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onSwitchClub}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', fontSize: '12px' }}
            title="Đổi câu lạc bộ"
          >
            <ArrowLeftRight size={13} /> Đổi CLB
          </button>
        )}


        {/* Current user info + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentUser && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-heading)' }}>
                {currentUser.fullName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                <span className={`badge ${currentRole === 'ADMIN' ? 'badge-admin' : currentRole === 'MANAGER' ? 'badge-manager' : isLeader ? 'badge-leader' : 'badge-member'}`}
                  style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {isLeader && currentRole === 'MEMBER' ? 'LEADER' : currentRole}
                </span>
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
