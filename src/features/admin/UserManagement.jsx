import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { Search, ShieldAlert, ShieldCheck, UserCheck, UserX, UserPlus, UserMinus } from 'lucide-react';

export default function UserManagement({ dbData, triggerNotification }) {
  const { users } = dbData;
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const handleToggleLock = (user) => {
    const nextStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    mockDb.setUserStatus(user.id, nextStatus);
    triggerNotification(
      `Đã ${nextStatus === 'Active' ? 'mở khóa' : 'khóa'} tài khoản ${user.fullName}`,
      nextStatus === 'Active' ? 'success' : 'error'
    );
  };

  const handleRoleToggle = (user) => {
    if (user.role === 'ADMIN') return;
    
    if (user.role === 'MEMBER') {
      mockDb.upgradeToManager(user.id);
      triggerNotification(`Đã phân quyền nâng cấp ${user.fullName} lên MANAGER`, 'success');
    } else {
      mockDb.downgradeToMember(user.id);
      triggerNotification(`Đã hạ quyền ${user.fullName} xuống MEMBER`, 'info');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="user-management-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><UserCheck size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tổng Tài khoản</span>
            <span className="stats-value">{users.length} tài khoản</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><ShieldCheck size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tài khoản Active</span>
            <span className="stats-value">{users.filter(u => u.status === 'Active').length} active</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--error)' }}><ShieldAlert size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tài khoản Bị Khóa</span>
            <span className="stats-value">{users.filter(u => u.status === 'Blocked').length} khóa</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <h3 className="glass-card-title"><UserCheck size={18} /> Quản lý Người dùng toàn hệ thống</h3>
        </div>

        {/* Search and filters row */}
        <div className="search-filter-row">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Tìm kiếm theo tên, MSSV, hoặc email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              className="select-field" 
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ width: '150px' }}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ADMIN">ADMIN (IC-PDP)</option>
              <option value="MANAGER">MANAGER (Leader)</option>
              <option value="MEMBER">MEMBER (Sinh viên)</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>MSSV / Mã cán bộ</th>
                <th>Họ & Tên</th>
                <th>Email liên hệ</th>
                <th>Khóa / Phân loại</th>
                <th>Quyền hệ thống</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Hành động nhanh</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.id}</strong></td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.isAlumni ? (
                      <span className="alumni-cohort-badge">Cựu SV ({user.cohort})</span>
                    ) : (
                      <span>{user.cohort}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      user.role === 'ADMIN' ? 'badge-admin' : user.role === 'MANAGER' ? 'badge-manager' : 'badge-member'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>
                      {user.status === 'Active' ? 'Hoạt động' : 'Bị Khóa'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      {/* Lock / Unlock button */}
                      <button
                        onClick={() => handleToggleLock(user)}
                        className={`btn btn-sm ${user.status === 'Active' ? 'btn-danger' : 'btn-success'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: '95px' }}
                      >
                        {user.status === 'Active' ? (
                          <>
                            <UserX size={12} /> Khóa
                          </>
                        ) : (
                          <>
                            <UserCheck size={12} /> Mở khóa
                          </>
                        )}
                      </button>

                      {/* Upgrade / Downgrade role */}
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleRoleToggle(user)}
                          className="btn btn-secondary btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: '125px' }}
                          title={user.role === 'MEMBER' ? 'Nâng lên Manager' : 'Hạ xuống Member'}
                        >
                          {user.role === 'MEMBER' ? (
                            <>
                              <UserPlus size={12} /> Cấp quyền Manager
                            </>
                          ) : (
                            <>
                              <UserMinus size={12} /> Bỏ quyền Manager
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
