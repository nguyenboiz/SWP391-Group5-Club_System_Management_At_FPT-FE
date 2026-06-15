import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, ShieldAlert, GraduationCap, RefreshCw, AlertTriangle } from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

export default function UserManagement({ triggerNotification }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [activeView, setActiveView] = useState('staff'); // 'staff' or 'student'

  // Load users from mockDb as robust fallback
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: thay bằng API thực khi BE bổ sung GET /api/users
      // const data = await apiClient.get('/api/users');
      // setUsers(Array.isArray(data.data) ? data.data : []);
      
      const db = mockDb.getData();
      setUsers(db.users || []);
    } catch (err) {
      console.error('[UserManagement] Lỗi tải users:', err);
      triggerNotification('Không tải được danh sách người dùng!', 'error');
      const db = mockDb.getData();
      setUsers(db.users || []);
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleToggleStatus = (userId) => {
    const db = mockDb.getData();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const currentStatus = db.users[idx].status;
      const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
      db.users[idx].status = newStatus;
      
      // Save directly back to mockDb storage
      localStorage.setItem('fpt_club_system_db_v4', JSON.stringify(db));
      window.dispatchEvent(new CustomEvent('mockDbUpdate'));
      
      triggerNotification(`Đã ${newStatus === 'Active' ? 'mở khóa' : 'khóa'} tài khoản ${userId} thành công!`, 'success');
      loadUsers();
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.id || user.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (activeView === 'student') {
      return matchesSearch && (user.role === 'MEMBER' || user.systemRole === 'MEMBER');
    }

    // activeView === 'staff'
    const role = (user.role || user.systemRole || '').toUpperCase();
    if (role === 'MEMBER') return false;
    let matchesRole = true;
    if (roleFilter === 'ALL') {
      matchesRole = role === 'ADMIN' || role === 'MANAGER';
    } else {
      matchesRole = role === roleFilter;
    }
    return matchesSearch && matchesRole;
  });

  return (
    <div className="user-management-container">
      <div className="glass-card">
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="glass-card-title">
            {activeView === 'staff' ? <ShieldAlert size={18} /> : <GraduationCap size={18} />}
            {activeView === 'staff' ? 'Ban chủ nhiệm & Quản trị' : 'Bảng Danh sách Sinh viên'}
          </h3>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="role-switcher-container" style={{ margin: 0 }}>
              <button
                className={`role-switch-btn ${activeView === 'staff' ? 'active' : ''}`}
                onClick={() => { setActiveView('staff'); setRoleFilter('ALL'); }}
                type="button"
              >
                Cán bộ & Trưởng CLB
              </button>
              <button
                className={`role-switch-btn ${activeView === 'student' ? 'active' : ''}`}
                onClick={() => setActiveView('student')}
                type="button"
              >
                Sinh viên (Student)
              </button>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadUsers} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        <div style={{ marginTop: '12px', padding: '12px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
          <AlertTriangle size={12} style={{ marginRight: '4px', color: 'var(--warning)', display: 'inline' }} />
          Danh sách và thao tác Khóa/Mở khóa đang hoạt động thông qua Local Storage của Mock DB để chuẩn bị tích hợp khi BE bổ sung API.
        </div>

        {/* Search and filters row */}
        <div className="search-filter-row" style={{ marginTop: '16px' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="input-field"
              placeholder={activeView === 'staff' ? 'Tìm kiếm cán bộ, leader...' : 'Tìm kiếm MSSV, tên, email sinh viên...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {activeView === 'staff' && (
            <div>
              <select className="select-field" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: '180px' }}>
                <option value="ALL">Admin + Manager</option>
                <option value="ADMIN">ADMIN (IC-PDP)</option>
                <option value="MANAGER">MANAGER (Leader)</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="login-spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Đang tải danh sách người dùng...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state-view">
            <ShieldAlert className="empty-state-icon" />
            <p>Không tìm thấy người dùng phù hợp.</p>
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: '12px' }}>
            <table className="custom-table">
              <thead>
                {activeView === 'staff' ? (
                  <tr>
                    <th>Mã số / Mã</th>
                    <th>Họ &amp; Tên</th>
                    <th>Quyền hệ thống</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                ) : (
                  <tr>
                    <th>MSSV</th>
                    <th>Họ &amp; Tên</th>
                    <th>Email học đường</th>
                    <th>Khóa</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const userId = user.id || user.studentId;
                  const role = (user.role || user.systemRole || '').toUpperCase();
                  const isBlocked = user.status === 'Blocked';
                  return (
                    <tr key={userId}>
                      {activeView === 'staff' ? (
                        <>
                          <td><strong>{userId}</strong></td>
                          <td>{user.fullName}</td>
                          <td>
                            <span className={`badge ${role === 'ADMIN' ? 'badge-admin' : 'badge-manager'}`}>{role}</span>
                          </td>
                          <td>
                            <span className={`badge ${!isBlocked ? 'badge-active' : 'badge-blocked'}`}>
                              {!isBlocked ? 'Hoạt động' : 'Bị Khóa'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className={`btn btn-sm ${!isBlocked ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => handleToggleStatus(userId)}
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {!isBlocked ? <UserX size={12} /> : <UserCheck size={12} />}
                              {!isBlocked ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td><strong>{userId}</strong></td>
                          <td>{user.fullName}</td>
                          <td>{user.email || 'N/A'}</td>
                          <td>{user.cohort || 'N/A'}</td>
                          <td>
                            <span className={`badge ${!isBlocked ? 'badge-active' : 'badge-blocked'}`}>
                              {!isBlocked ? 'Hoạt động' : 'Bị Khóa'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className={`btn btn-sm ${!isBlocked ? 'btn-danger' : 'btn-success'}`}
                              onClick={() => handleToggleStatus(userId)}
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {!isBlocked ? <UserX size={12} /> : <UserCheck size={12} />}
                              {!isBlocked ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
