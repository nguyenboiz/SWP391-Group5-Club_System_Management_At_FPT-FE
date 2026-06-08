import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { Search, UserCheck, UserX, UserPlus, UserMinus } from 'lucide-react';

export default function UserManagement({ dbData, triggerNotification }) {
  const { users } = dbData;
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // Default: chỉ show Admin + Manager



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
    // Luôn loại MEMBER khỏi danh sách hiển thị
    if (user.role === 'MEMBER') return false;

    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesRole = true;
    if (roleFilter === 'ALL') {
      matchesRole = user.role === 'ADMIN' || user.role === 'MANAGER';
    } else {
      matchesRole = user.role === roleFilter;
    }

    return matchesSearch && matchesRole;
  });

  return (
    <div className="user-management-container">

      {/* User List */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h3 className="glass-card-title"><UserCheck size={18} /> Quản lý Admin & Manager</h3>
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
          <div>
            <select
              className="select-field"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">Admin + Manager</option>
              <option value="ADMIN">ADMIN (IC-PDP)</option>
              <option value="MANAGER">MANAGER (Leader)</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>MSSV / Mã</th>
                <th>Họ &amp; Tên</th>
                <th>Quyền</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td><strong>{user.id}</strong></td>
                  <td>{user.fullName}</td>
                  <td>
                    <span className={`badge ${
                      user.role === 'ADMIN' ? 'badge-admin' : 'badge-manager'
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
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {/* Lock / Unlock */}
                      <button
                        onClick={() => handleToggleLock(user)}
                        className={`btn btn-sm ${user.status === 'Active' ? 'btn-danger' : 'btn-success'}`}
                        style={{ padding: '6px 8px', fontSize: '11px' }}
                        title={user.status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {user.status === 'Active' ? <UserX size={12} /> : <UserCheck size={12} />}
                      </button>

                      {/* Downgrade Manager → Member */}
                      {user.role === 'MANAGER' && (
                        <button
                          onClick={() => handleRoleToggle(user)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Bỏ quyền Manager"
                        >
                          <UserMinus size={12} />
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
