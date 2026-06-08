import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { Search, ShieldAlert, ShieldCheck, UserCheck, UserX, UserPlus, UserMinus, Landmark } from 'lucide-react';

export default function UserManagement({ dbData, triggerNotification }) {
  const { users, clubs, memberships } = dbData;
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('EVERYONE'); // Default: show everyone

  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');

  const getClubManager = (clubId) => {
    const leaderMembership = memberships.find(
      m => m.clubId === clubId && m.role === 'Leader' && m.status === 'Active'
    );
    if (leaderMembership) {
      const u = users.find(user => user.id === leaderMembership.userId);
      return u ? `${u.fullName} (${u.id})` : leaderMembership.userId;
    }
    return 'Chưa có';
  };

  const handleAssignClubManager = (e) => {
    e.preventDefault();
    if (!selectedClubId || !selectedManagerId) {
      triggerNotification('Vui lòng chọn đầy đủ CLB và người dùng!', 'warning');
      return;
    }
    
    mockDb.assignManager(selectedClubId, selectedManagerId);
    
    const club = clubs.find(c => c.id === selectedClubId);
    const user = users.find(u => u.id === selectedManagerId);
    triggerNotification(`Đã gán ${user?.fullName} làm Manager cho CLB ${club?.name.split(' - ')[0]}!`, 'success');
    
    setSelectedClubId('');
    setSelectedManagerId('');
  };

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
      
    let matchesRole = true;
    if (roleFilter === 'ALL') {
      matchesRole = user.role === 'ADMIN' || user.role === 'MANAGER';
    } else if (roleFilter === 'EVERYONE') {
      matchesRole = true;
    } else {
      matchesRole = user.role === roleFilter;
    }
    
    return matchesSearch && matchesRole;
  });

  const eligibleUsers = users.filter(u => u.status === 'Active' && u.role !== 'ADMIN');

  return (
    <div className="user-management-container">
      {/* Stats row */}
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

      {/* Main Grid */}
      <div className="dashboard-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left side: User List */}
        <div className="glass-card" style={{ marginBottom: 0 }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title"><UserCheck size={18} /> Quản lý Người dùng</h3>
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
                <option value="EVERYONE">Tất cả người dùng</option>
                <option value="ALL">Admin + Manager</option>
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
                  <th>MSSV / Mã</th>
                  <th>Họ & Tên</th>
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

                        {/* Upgrade / Downgrade role */}
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleRoleToggle(user)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title={user.role === 'MEMBER' ? 'Cấp quyền Manager' : 'Bỏ quyền Manager'}
                          >
                            {user.role === 'MEMBER' ? <UserPlus size={12} /> : <UserMinus size={12} />}
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

        {/* Right side: Assign Manager Form */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Landmark size={18} /> Gán Manager cho CLB</h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
            Nâng cấp người dùng thành MANAGER và chỉ định họ làm Leader quản lý câu lạc bộ được chọn.
          </p>
          <form onSubmit={handleAssignClubManager}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Chọn Câu lạc bộ</label>
              <select 
                className="select-field"
                value={selectedClubId}
                onChange={e => setSelectedClubId(e.target.value)}
                required
              >
                <option value="">-- Chọn CLB --</option>
                {clubs.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name.split(' - ')[0]}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Chọn Người dùng (Sinh viên/Manager)</label>
              <select 
                className="select-field"
                value={selectedManagerId}
                onChange={e => setSelectedManagerId(e.target.value)}
                required
              >
                <option value="">-- Chọn người dùng --</option>
                {eligibleUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.id}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <UserPlus size={14} /> Gán Quyền & Chỉ Định Leader
            </button>
          </form>

          {/* Quick list of current club managers */}
          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '13px', color: 'var(--text-heading)', marginBottom: '10px', fontWeight: 700 }}>Danh sách Manager hiện tại:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {clubs.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '8px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name.split(' - ')[0]}</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{getClubManager(c.id)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
