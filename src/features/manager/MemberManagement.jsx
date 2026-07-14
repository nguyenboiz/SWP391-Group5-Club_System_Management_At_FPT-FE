import React, { useState, useEffect, useCallback } from 'react';
import * as membershipService from '../../services/membershipService';
import { UserPlus, UserCheck, ToggleLeft, ToggleRight, Search, Eye, X } from 'lucide-react';

export default function MemberManagement({ selectedClubId, triggerNotification }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Member detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [memberDetail, setMemberDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const backendClubId = selectedClubId;

  // Load members from API
  const loadMembers = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await membershipService.getClubMembers(backendClubId);
      setMembers(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err) {
      console.error('[MemberManagement] Lỗi tải thành viên:', err);
      triggerNotification('Không tải được danh sách thành viên của câu lạc bộ!', 'error');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [backendClubId, triggerNotification]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newUserId.trim()) {
      triggerNotification('❌ Vui lòng nhập Mã số sinh viên cần thêm!', 'warning');
      return;
    }

    const formattedId = newUserId.trim().toUpperCase();
    setIsSubmitting(true);
    try {
      await membershipService.addClubMember({
        clubId: backendClubId,
        studentId: formattedId,
        joinReason: 'Thêm trực tiếp bởi Ban chủ nhiệm CLB.',
        personalGoal: 'Tham gia sinh hoạt CLB.'
      });
      triggerNotification(`✅ Đã thêm thành viên (${formattedId}) thành công!`, 'success');
      setNewUserId('');
      await loadMembers();
    } catch (err) {
      console.error('[MemberManagement] Lỗi thêm thành viên:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.title;
      if (status === 404) triggerNotification(`❌ Không tìm thấy sinh viên có mã “${formattedId}” trong hệ thống!`, 'error');
      else if (status === 409) triggerNotification(`❌ Sinh viên ${formattedId} đã là thành viên của CLB này rồi!`, 'error');
      else if (status === 403) triggerNotification('❌ Bạn không có quyền thêm thành viên!', 'error');
      else triggerNotification(`❌ Không thể thêm thành viên: ${serverMsg || 'Lỗi máy chủ, vui lòng thử lại!'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (m) => {
    const membershipId = m.id || m.membershipId;
    if (!membershipId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn cho thành viên ${m.fullName} (${m.userId}) rút lui khỏi câu lạc bộ không?`)) {
      return;
    }

    try {
      await membershipService.removeClubMember(membershipId);
      triggerNotification(`✅ Đã cho thành viên ${m.fullName} rút lui thành công!`, 'success');
      await loadMembers();
    } catch (err) {
      console.error('[MemberManagement] Lỗi gỡ thành viên:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.title;
      if (status === 403) triggerNotification('❌ Bạn không có quyền xóa thành viên!', 'error');
      else if (status === 404) triggerNotification('❌ Không tìm thấy thông tin thành viên này!', 'error');
      else triggerNotification(`❌ Gỡ thành viên thất bại: ${serverMsg || 'Vui lòng thử lại!'}`, 'error');
    }
  };

  const handleViewDetail = async (m) => {
    const membershipId = m.id || m.membershipId;
    if (!membershipId) return;
    setShowDetailModal(true);
    setLoadingDetail(true);
    setMemberDetail(null);
    try {
      const data = await membershipService.getMemberDetail(membershipId);
      setMemberDetail(data?.data ?? data);
    } catch (err) {
      console.error('[MemberManagement] Lỗi tải chi tiết thành viên:', err);
      setMemberDetail(m);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Map and filter memberships safely
  const mappedMembers = members.map(m => {
    const studentId = m.studentId || m.userId || m.id || 'N/A';
    return {
      id: m.membershipId || m.id,
      userId: studentId,
      fullName: m.fullName || m.name || 'Chưa cập nhật',
      email: m.email || 'N/A',
      cohort: m.cohort || 'N/A',
      role: m.role || 'Member',
      status: m.status || 'Active'
    };
  }).filter(m => 
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = mappedMembers.filter(m => m.status === 'Active' || m.status === 'Open').length;
  const resignedCount = mappedMembers.filter(m => m.status === 'Resigned' || m.status === 'Closed' || m.status === 'Removed').length;

  return (
    <div className="member-management-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><UserCheck size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Thành viên sinh hoạt</span>
            <span className="stats-value">
              {loading ? '...' : `${activeCount} thành viên`}
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--text-muted)' }}><ToggleRight size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Thành viên rút lui / đã gỡ</span>
            <span className="stats-value">
              {loading ? '...' : `${resignedCount} thành viên`}
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* Left Side: Membership List */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><UserCheck size={18} /> Danh sách Thành viên</h3>
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

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px' }}>
              <div className="login-spinner" style={{ margin: '0 auto' }}></div>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>MSSV</th>
                    <th>Họ &amp; Tên</th>
                    <th>Vai trò CLB</th>
                    <th>Khóa</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
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
                        <span className={`badge ${m.status === 'Active' || m.status === 'Open' ? 'badge-active' : 'badge-blocked'}`}>
                          {m.status === 'Active' || m.status === 'Open' ? 'Đang sinh hoạt' : 'Đã rút lui'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleViewDetail(m)}
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                          >
                            <Eye size={11} /> Chi tiết
                          </button>
                          {(m.status === 'Active' || m.status === 'Open') ? (
                            <button
                              onClick={() => handleRemoveMember(m)}
                              className="btn btn-sm btn-danger"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
                            >
                              <ToggleLeft size={12} /> Rút lui
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-secondary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', cursor: 'default' }}
                              disabled
                            >
                              Đã rút lui
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {mappedMembers.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có thành viên nào trong danh sách.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Add new Member Form */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title"><UserPlus size={18} /> Thêm thành viên mới</h3>
          </div>

          <form onSubmit={handleAddMember}>
            <div className="form-group">
              <label>Mã số sinh viên (MSSV) *</label>
              <input 
                type="text" 
                className="input-field" 
                value={newUserId}
                onChange={e => setNewUserId(e.target.value)}
                placeholder="VD: SE180001"
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Hệ thống sẽ thêm tài khoản này trực tiếp vào danh sách CLB.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
              <UserPlus size={16} /> {isSubmitting ? 'Đang thêm...' : 'Thêm vào danh sách CLB'}
            </button>
          </form>
        </div>
      </div>

      {/* MODAL: CHI TIẾT THÀNH VIÊN */}
      {showDetailModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><UserCheck size={16} style={{ marginRight: '6px' }} /> Chi tiết Thành viên</h3>
              <button className="modal-close" onClick={() => { setShowDetailModal(false); setMemberDetail(null); }}><X size={18} /></button>
            </div>
            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div className="login-spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : memberDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {[
                  ['MSSV', memberDetail.studentId || memberDetail.userId || 'N/A'],
                  ['Họ &amp; Tên', memberDetail.fullName || memberDetail.name || 'N/A'],
                  ['Email', memberDetail.email || 'N/A'],
                  ['Khóa', memberDetail.cohort || 'N/A'],
                  ['Vai trò trong CLB', memberDetail.role || 'Member'],
                  ['Trạng thái', memberDetail.status || 'N/A'],
                  ['Lý do tham gia', memberDetail.joinReason || 'N/A'],
                  ['Mục tiêu cá nhân', memberDetail.personalGoal || 'N/A'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ minWidth: '140px', fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-main)', wordBreak: 'break-all' }} dangerouslySetInnerHTML={{ __html: String(value) }} />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>Không tải được thông tin thành viên.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
