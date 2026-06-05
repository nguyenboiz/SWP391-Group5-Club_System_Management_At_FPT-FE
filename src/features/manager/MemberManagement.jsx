import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { UserPlus, UserCheck, ToggleLeft, ToggleRight, Search, CheckCircle } from 'lucide-react';

export default function MemberManagement({ dbData, selectedClubId, triggerNotification }) {
  const { memberships, users } = dbData;
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('Member');
  const [searchQuery, setSearchQuery] = useState('');

  // Get active members of this club
  const clubMemberships = memberships.filter(m => m.clubId === selectedClubId);

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      triggerNotification('Vui lòng điền mã số sinh viên!', 'warning');
      return;
    }

    const formattedId = newUserId.trim().toUpperCase();
    
    // Check if user exists in the system database
    const user = users.find(u => u.id === formattedId);
    if (!user) {
      triggerNotification(`Không tìm thấy sinh viên mã số ${formattedId} trong cơ sở dữ liệu trường!`, 'error');
      return;
    }

    // Try adding member
    const success = mockDb.addClubMember(selectedClubId, formattedId, newRole);
    if (success) {
      triggerNotification(`Đã thêm thành viên ${user.fullName} (${formattedId}) thành công!`, 'success');
      setNewUserId('');
    } else {
      triggerNotification('Sinh viên này hiện đã là thành viên hoạt động trong câu lạc bộ!', 'warning');
    }
  };

  const handleToggleStatus = (m) => {
    const nextStatus = m.status === 'Active' ? 'Resigned' : 'Active';
    mockDb.setMemberStatus(m.id, nextStatus);
    const u = users.find(user => user.id === m.userId);
    triggerNotification(
      `Đã chuyển trạng thái ${u?.fullName} thành: ${nextStatus === 'Active' ? 'Đang sinh hoạt' : 'Đã rút lui'}`,
      'success'
    );
  };

  // Map user profiles to memberships
  const mappedMembers = clubMemberships.map(m => {
    const u = users.find(user => user.id === m.userId);
    return {
      ...m,
      fullName: u ? u.fullName : 'Chưa cập nhật',
      email: u ? u.email : 'N/A',
      cohort: u ? u.cohort : 'N/A',
      userStatus: u ? u.status : 'Active'
    };
  }).filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="member-management-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><UserCheck size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Thành viên sinh hoạt</span>
            <span className="stats-value">
              {clubMemberships.filter(m => m.status === 'Active').length} thành viên
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--text-muted)' }}><ToggleRight size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Thành viên rút lui</span>
            <span className="stats-value">
              {clubMemberships.filter(m => m.status === 'Resigned').length} thành viên
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* Left Side: Membership List */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><UserCheck size={18} /> Danh sách Thành viên trong Kỳ</h3>
          </div>

          <div className="search-filter-row">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Tìm kiếm thành viên theo tên hoặc MSSV..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>MSSV</th>
                  <th>Họ & Tên</th>
                  <th>Vai trò CLB</th>
                  <th>Khóa</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {mappedMembers.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.userId}</strong></td>
                    <td>{m.fullName}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                        {m.role}
                      </span>
                    </td>
                    <td>{m.cohort}</td>
                    <td>
                      <span className={`badge ${m.status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>
                        {m.status === 'Active' ? 'Đang sinh hoạt' : 'Đã rút lui'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleStatus(m)}
                        className={`btn btn-sm ${m.status === 'Active' ? 'btn-danger' : 'btn-success'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: '130px' }}
                      >
                        {m.status === 'Active' ? (
                          <>
                            <ToggleLeft size={12} /> Cho rút lui
                          </>
                        ) : (
                          <>
                            <ToggleRight size={12} /> Cho đi học lại
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Add new Member Form */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title"><UserPlus size={18} /> Thêm thành viên mới</h3>
          </div>

          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label>Mã số sinh viên (MSSV)</label>
              <input 
                type="text" 
                className="input-field" 
                value={newUserId}
                onChange={e => setNewUserId(e.target.value)}
                placeholder="SE180001"
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Hệ thống chỉ chấp nhận MSSV đã được đăng ký tài khoản trên hệ thống trường.
              </span>
            </div>

            <div className="form-group">
              <label>Chức vụ trong câu lạc bộ</label>
              <select 
                className="select-field" 
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
              >
                <option value="Member">Thành viên (Member)</option>
                <option value="Vice Leader">Phó Chủ nhiệm (Vice Leader)</option>
                <option value="Treasurer">Thủ quỹ (Treasurer)</option>
                <option value="Content Lead">Trưởng ban truyền thông</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <UserPlus size={16} /> Thêm vào danh sách CLB
            </button>
          </form>

          {/* Quick list of mock system users for ease of demoing */}
          <div style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
            <h5 style={{ color: 'var(--text-muted)', marginBottom: '8px', fontSize: '12px', textTransform: 'uppercase' }}>
              Mã SV mẫu của trường để thử nghiệm:
            </h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {users.filter(u => u.role === 'MEMBER' && !u.isAlumni).map(u => (
                <button 
                  key={u.id}
                  type="button"
                  className="club-pill-btn"
                  onClick={() => setNewUserId(u.id)}
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                >
                  {u.id} ({u.fullName.split(' ').pop()})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
