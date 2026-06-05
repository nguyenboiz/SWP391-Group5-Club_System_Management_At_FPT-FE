import React from 'react';

export default function Header({ 
  currentRole, 
  selectedClubId, 
  setSelectedClubId, 
  currentUserId, 
  setCurrentUserId, 
  handleRoleSwitch, 
  dbData, 
  pageTitle,
  triggerNotification
}) {
  return (
    <header className="top-header">
      <div className="page-title-section">
        <h2>{pageTitle}</h2>
      </div>

      <div className="header-actions">
        {/* Emulators selectors to easily test different clubs and users */}
        {currentRole === 'MANAGER' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mô phỏng CLB:</span>
            <select 
              className="select-field" 
              value={selectedClubId}
              onChange={e => {
                setSelectedClubId(e.target.value);
                const name = dbData.clubs.find(c => c.id === e.target.value)?.name.split(' - ')[0];
                triggerNotification(`Đang mô phỏng đăng nhập CLB: ${name}`, 'info');
              }}
              style={{ width: '130px', padding: '4px 8px', fontSize: '12px' }}
            >
              {dbData.clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name.split(' - ')[0]}</option>
              ))}
            </select>
          </div>
        )}

        {currentRole === 'MEMBER' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Đăng nhập SV:</span>
            <select 
              className="select-field" 
              value={currentUserId}
              onChange={e => {
                setCurrentUserId(e.target.value);
                const name = dbData.users.find(u => u.id === e.target.value)?.fullName;
                triggerNotification(`Đang đăng nhập giả lập sinh viên: ${name}`, 'info');
              }}
              style={{ width: '150px', padding: '4px 8px', fontSize: '12px' }}
            >
              {dbData.users.filter(u => u.role !== 'ADMIN').map(u => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.id}) {u.isAlumni ? '[Alumni]' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Role Switches menu */}
        <div className="role-switcher-container">
          <button 
            className={`role-switch-btn ${currentRole === 'ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('ADMIN')}
          >
            ADMIN
          </button>
          <button 
            className={`role-switch-btn ${currentRole === 'MANAGER' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('MANAGER')}
          >
            MANAGER
          </button>
          <button 
            className={`role-switch-btn ${currentRole === 'MEMBER' ? 'active' : ''}`}
            onClick={() => handleRoleSwitch('MEMBER')}
          >
            MEMBER
          </button>
        </div>
      </div>
    </header>
  );
}
