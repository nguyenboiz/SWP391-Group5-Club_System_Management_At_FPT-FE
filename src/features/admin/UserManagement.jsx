import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShieldAlert, GraduationCap, RefreshCw, AlertTriangle, Info, Plus, UserPlus, Lock, Unlock, Key, Edit, Trash2, X } from 'lucide-react';
import apiClient from '../../utils/apiClient';

export default function UserManagement({ triggerNotification }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('staff');
  const [hasApi, setHasApi] = useState(null); // null=loading, true=có API, false=chưa có

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showResetPwdModal, setShowResetPwdModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms state
  const [createForm, setCreateForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'MEMBER'
  });
  const [newRole, setNewRole] = useState('MEMBER');

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/users');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setUsers(data);
      setHasApi(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        setHasApi(false);
        // Tải từ localStorage
        let localUsers = localStorage.getItem('mock_users');
        if (!localUsers) {
          const defaultMockUsers = [
            { id: 'admin01', username: 'admin01', fullName: 'Quản trị viên 01', email: 'admin01@fpt.edu.vn', role: 'ADMIN', status: 'Active' },
            { id: 'manager01', username: 'manager01', fullName: 'Quản lý 01', email: 'manager01@fpt.edu.vn', role: 'MANAGER', status: 'Active' },
            { id: 'se180001', username: 'se180001', fullName: 'Nguyễn Đình Khoa', email: 'se180001@fpt.edu.vn', role: 'MEMBER', status: 'Active' },
            { id: 'se180002', username: 'se180002', fullName: 'Đường Đình Khôi', email: 'se180002@fpt.edu.vn', role: 'MEMBER', status: 'Active' },
            { id: 'se200001', username: 'se200001', fullName: 'Vũ Ngọc An', email: 'se200001@fpt.edu.vn', role: 'MEMBER', status: 'Active' },
          ];
          localStorage.setItem('mock_users', JSON.stringify(defaultMockUsers));
          localUsers = JSON.stringify(defaultMockUsers);
        }
        setUsers(JSON.parse(localUsers));
      } else {
        console.error('[UserManagement] Lỗi tải users:', err);
        triggerNotification('Không tải được danh sách người dùng!', 'error');
        setHasApi(false);
      }
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Save changes to localStorage if using mock
  const syncLocalUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    localStorage.setItem('mock_users', JSON.stringify(updatedUsers));
  };

  // 1. Tạo user mới
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!createForm.username || !createForm.fullName || !createForm.email || !createForm.password) {
      triggerNotification('Vui lòng điền đầy đủ các thông tin!', 'warning');
      return;
    }

    if (hasApi) {
      try {
        await apiClient.post('/api/users', createForm);
        triggerNotification(`Đã tạo thành công người dùng: ${createForm.fullName}`, 'success');
        setShowCreateModal(false);
        setCreateForm({ username: '', fullName: '', email: '', password: '', role: 'MEMBER' });
        loadUsers();
      } catch (err) {
        triggerNotification(err?.response?.data?.message || 'Tạo người dùng thất bại trên Backend!', 'error');
      }
    } else {
      // Mock logic
      const newUser = {
        id: createForm.username,
        username: createForm.username,
        fullName: createForm.fullName,
        email: createForm.email,
        role: createForm.role,
        status: 'Active'
      };
      
      if (users.some(u => u.username === createForm.username)) {
        triggerNotification('Tên đăng nhập (Username) đã tồn tại!', 'error');
        return;
      }

      const updated = [...users, newUser];
      syncLocalUsers(updated);
      triggerNotification(`Tạo người dùng "${createForm.fullName}" thành công! (Mock)`, 'success');
      setShowCreateModal(false);
      setCreateForm({ username: '', fullName: '', email: '', password: '', role: 'MEMBER' });
    }
  };

  // 2. Khóa / Mở khóa user
  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'Active' ? 'Blocked' : 'Active';
    if (hasApi) {
      try {
        await apiClient.put(`/api/users/${user.id}/status`, { status: nextStatus });
        triggerNotification(`Đã cập nhật trạng thái người dùng sang: ${nextStatus === 'Active' ? 'Hoạt động' : 'Bị khóa'}`, 'success');
        loadUsers();
      } catch (err) {
        triggerNotification('Cập nhật trạng thái thất bại!', 'error');
      }
    } else {
      // Mock logic
      const updated = users.map(u => u.id === user.id ? { ...u, status: nextStatus } : u);
      syncLocalUsers(updated);
      triggerNotification(`Đã ${nextStatus === 'Active' ? 'mở khóa' : 'khóa'} tài khoản ${user.username}! (Mock)`, 'success');
    }
  };

  // 3. Thay đổi vai trò (Role)
  const handleEditRole = async () => {
    if (hasApi) {
      try {
        await apiClient.put(`/api/users/${selectedUser.id}/role`, { role: newRole });
        triggerNotification(`Đã đổi vai trò tài khoản ${selectedUser.username} sang ${newRole}`, 'success');
        setShowEditRoleModal(false);
        loadUsers();
      } catch (err) {
        triggerNotification('Thay đổi vai trò thất bại!', 'error');
      }
    } else {
      // Mock logic
      const updated = users.map(u => u.id === selectedUser.id ? { ...u, role: newRole } : u);
      syncLocalUsers(updated);
      triggerNotification(`Đã đổi vai trò tài khoản ${selectedUser.username} thành ${newRole}! (Mock)`, 'success');
      setShowEditRoleModal(false);
    }
  };

  // 4. Reset Password
  const handleResetPassword = async () => {
    if (hasApi) {
      try {
        await apiClient.post(`/api/users/${selectedUser.id}/reset-password`);
        triggerNotification(`Đã đặt lại mật khẩu cho tài khoản ${selectedUser.username} về mặc định.`, 'success');
        setShowResetPwdModal(false);
      } catch (err) {
        triggerNotification('Đặt lại mật khẩu thất bại!', 'error');
      }
    } else {
      // Mock
      triggerNotification(`Đã đặt lại mật khẩu cho tài khoản ${selectedUser.username} về mặc định (123456) thành công! (Mock)`, 'success');
      setShowResetPwdModal(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.id || user.studentId || user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());

    const role = (user.role || user.systemRole || '').toUpperCase();
    if (activeView === 'student') {
      return matchesSearch && (role === 'MEMBER');
    }
    return matchesSearch && (role === 'ADMIN' || role === 'MANAGER');
  });

  return (
    <div className="user-management-container">
      <div className="glass-card">
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="glass-card-title">
            {activeView === 'staff' ? <ShieldAlert size={18} /> : <GraduationCap size={18} />}
            Quản lý Người dùng
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <UserPlus size={14} /> Thêm tài khoản
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadUsers}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
            </button>
          </div>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <button
            className={`role-switch-btn ${activeView === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveView('staff')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
          >
            <ShieldAlert size={14} /> Cán bộ (Admin/Manager)
          </button>
          <button
            className={`role-switch-btn ${activeView === 'student' ? 'active' : ''}`}
            onClick={() => setActiveView('student')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
          >
            <GraduationCap size={14} /> Sinh viên (Member)
          </button>
        </div>

        {/* Search Input always visible now */}
        <div style={{ marginBottom: '16px', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
          <input
            type="text"
            className="input-field"
            placeholder="Tìm kiếm theo tên, ID/Username, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        {/* No API Notice */}
        {hasApi === false && (
          <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Info size={15} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }} />
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              <strong style={{ color: '#3b82f6' }}>Đang sử dụng dữ liệu mô phỏng LocalStorage.</strong><br />
              Server BE chưa có API: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>GET/POST/PUT /api/users</code>. Các thay đổi bên dưới sẽ được lưu cục bộ để demo.
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state-view">
            <GraduationCap className="empty-state-icon" />
            <p>Không tìm thấy người dùng nào.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Username / MSSV</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => {
                  const uid = user.id || user.userId || user.studentId || user.username;
                  const role = (user.role || user.systemRole || '').toUpperCase();
                  const status = user.status || 'Active';
                  return (
                    <tr key={uid}>
                      <td><strong>{uid}</strong></td>
                      <td>{user.fullName || user.username || '—'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email || '—'}</td>
                      <td>
                        <span className={`badge ${role === 'ADMIN' ? 'badge-admin' : role === 'MANAGER' ? 'badge-manager' : 'badge-member'}`}>
                          {role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>
                          {status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Khóa/Mở khóa"
                            onClick={() => handleToggleStatus(user)}
                            style={{ padding: '6px' }}
                          >
                            {status === 'Active' ? <Lock size={12} style={{ color: 'var(--error)' }} /> : <Unlock size={12} style={{ color: 'var(--success)' }} />}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Đổi vai trò"
                            onClick={() => { setSelectedUser(user); setNewRole(role); setShowEditRoleModal(true); }}
                            style={{ padding: '6px' }}
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Reset mật khẩu"
                            onClick={() => { setSelectedUser(user); setShowResetPwdModal(true); }}
                            style={{ padding: '6px' }}
                          >
                            <Key size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: TẠO TÀI KHOẢN MỚI */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><UserPlus size={18} style={{ marginRight: '6px' }} /> Thêm Tài khoản Mới</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div className="form-group">
                <label>Username / MSSV *</label>
                <input
                  type="text"
                  className="input-field"
                  value={createForm.username}
                  onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="Ví dụ: se180003 hoặc admin02"
                  required
                />
              </div>
              <div className="form-group">
                <label>Họ và tên *</label>
                <input
                  type="text"
                  className="input-field"
                  value={createForm.fullName}
                  onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  className="input-field"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="anv@fpt.edu.vn"
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu khởi tạo *</label>
                <input
                  type="password"
                  className="input-field"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Nhập mật khẩu..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Vai trò hệ thống</label>
                <select
                  className="select-field"
                  value={createForm.role}
                  onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                >
                  <option value="MEMBER">MEMBER (Sinh viên)</option>
                  <option value="MANAGER">MANAGER (Quản lý cấp trường)</option>
                  <option value="ADMIN">ADMIN (Quản trị hệ thống)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Tạo tài khoản</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐỔI VAI TRÒ */}
      {showEditRoleModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit size={18} style={{ marginRight: '6px' }} /> Đổi Vai trò Tài khoản</h3>
              <button className="modal-close" onClick={() => setShowEditRoleModal(false)}><X size={18} /></button>
            </div>
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Thay đổi vai trò hệ thống của tài khoản <strong>{selectedUser.fullName}</strong> ({selectedUser.username}).
              </p>
              <div className="form-group">
                <label>Chọn vai trò mới:</label>
                <select
                  className="select-field"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="MEMBER">MEMBER (Sinh viên)</option>
                  <option value="MANAGER">MANAGER (Quản lý cấp trường)</option>
                  <option value="ADMIN">ADMIN (Quản trị hệ thống)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handleEditRole}>Xác nhận đổi</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditRoleModal(false)}>Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD */}
      {showResetPwdModal && selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header text-warning">
              <h3 className="modal-title"><Key size={18} style={{ marginRight: '6px' }} /> Đặt lại Mật khẩu</h3>
              <button className="modal-close" onClick={() => setShowResetPwdModal(false)}><X size={18} /></button>
            </div>
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '13px', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản <strong>{selectedUser.fullName}</strong> ({selectedUser.username})?<br />
                Sau khi xác nhận, mật khẩu sẽ được khôi phục về giá trị mặc định là <strong style={{ color: 'var(--primary)' }}>123456</strong>.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={handleResetPassword}>Đồng ý đặt lại</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetPwdModal(false)}>Hủy</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
