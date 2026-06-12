import React, { useState, useEffect } from 'react';
import { mockDb } from '../../utils/mockDb';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, Image as ImageIcon, Send, Clock, CheckCircle, HelpCircle } from 'lucide-react';

export default function MemberWorkspace({ dbData, currentUserId, triggerNotification }) {
  const { currentUser } = useAuth();
  const { users, participants, events, evidence, clubs } = dbData;
  const user = users.find(u => u.id === currentUserId) || (currentUserId ? {
    id: currentUserId,
    fullName: currentUser?.fullName || currentUserId,
    cohort: currentUser?.cohort || '',
    phone: currentUser?.phone || '',
    facebook: currentUser?.facebook || '',
    currentJob: currentUser?.currentJob || ''
  } : null);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [cohort, setCohort] = useState('');
  const [phone, setPhone] = useState('');
  const [facebook, setFacebook] = useState('');
  const [currentJob, setCurrentJob] = useState('');

  // Evidence Form States
  const [selectedEventId, setSelectedEventId] = useState('');
  const [evidenceType, setEvidenceType] = useState('Check-In Photo');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setCohort(user.cohort || '');
      setPhone(user.phone || '');
      setFacebook(user.facebook || '');
      setCurrentJob(user.currentJob || '');
    }
    // Chỉ khởi tạo form khi thay đổi ID user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  if (!currentUserId || !user) {
    return (
      <div className="empty-state-view">
        <User className="empty-state-icon" />
        <p>Không tìm thấy hồ sơ tài khoản sinh viên.</p>
        <p style={{ fontSize: '12px' }}>Hãy chọn tài khoản sinh viên ở thanh Header trên cùng.</p>
      </div>
    );
  }

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    mockDb.updateUserProfile(currentUserId, {
      fullName,
      cohort,
      phone,
      facebook,
      currentJob
    });
    triggerNotification('Cập nhật hồ sơ cá nhân thành công!', 'success');
  };

  const handleSubmitEvidence = (e) => {
    e.preventDefault();
    if (!fileUrl.trim()) {
      triggerNotification('Vui lòng cung cấp link hình ảnh hoặc tệp minh chứng!', 'warning');
      return;
    }

    // Try finding the club for the selected event to attach clubId automatically
    let eventClubId = 'js'; // default fallback
    if (selectedEventId) {
      const evt = events.find(e => e.id === selectedEventId);
      if (evt) eventClubId = evt.clubId;
    }

    mockDb.submitEvidence({
      userId: currentUserId,
      eventId: selectedEventId || null,
      clubId: eventClubId,
      type: evidenceType,
      fileUrl: fileUrl.trim()
    });

    triggerNotification('Đã nộp minh chứng thành công! PDP sẽ sớm phê duyệt.', 'success');
    setFileUrl('');
    setSelectedEventId('');
  };

  // Filter events registered by this student
  const registeredEvents = participants.filter(p => p.userId === currentUserId);

  const getEventDetails = (eventId) => {
    const e = events.find(evt => evt.id === eventId);
    return e ? e : { name: eventId, venue: 'N/A', dateTime: 'N/A' };
  };

  const getClubName = (clubId) => {
    const c = clubs.find(club => club.id === clubId);
    return c ? c.name : clubId;
  };

  // Filter evidence submitted by this student
  const myEvidence = evidence.filter(e => e.userId === currentUserId);

  // Pre-configured mock proof images for the user to select quickly in the UI
  const mockProofUrls = [
    { name: 'Ảnh Check-In Sự kiện mẫu 1', url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80' },
    { name: 'Ảnh Check-In Sự kiện mẫu 2', url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80' },
    { name: 'Bản chụp Chứng nhận PDF mẫu', url: 'https://images.unsplash.com/photo-1589330694653-ded6df53f7ec?auto=format&fit=crop&w=600&q=80' }
  ];

  return (
    <div className="member-workspace-container">
      <div className="dashboard-grid-2col">
        {/* Left Side: Profile Update & Attendance History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Profile Form */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><User size={18} /> Hồ sơ Cá nhân</h3>
              
              <span className={`badge ${user.isAlumni ? 'badge-manager' : 'badge-member'}`}>
                {user.isAlumni ? 'Cựu sinh viên (Alumni)' : 'Sinh viên hiện tại'}
              </span>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-row">
                <div className="form-group">
                  <label>Mã số sinh viên (MSSV)</label>
                  <input type="text" className="input-field" value={user.id} disabled style={{ cursor: 'not-allowed', opacity: 0.7 }} />
                </div>
                <div className="form-group">
                  <label>Khóa học</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={cohort} 
                    onChange={e => setCohort(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Họ và Tên</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Facebook cá nhân</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={facebook}
                    onChange={e => setFacebook(e.target.value)}
                  />
                </div>
              </div>

              {user.isAlumni && (
                <div className="form-group">
                  <label>Nơi làm việc hiện tại (Danh cho Cựu SV)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={currentJob}
                    onChange={e => setCurrentJob(e.target.value)}
                    placeholder="Ví dụ: Solutions Architect tại FPT Software"
                  />
                </div>
              )}

              <button type="submit" className="btn btn-primary">
                Cập nhật thông tin cá nhân
              </button>
            </form>
          </div>

          {/* Registered Events list ("Hoạt động của tôi") */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Clock size={18} /> Hoạt động của tôi</h3>
            </div>

            {registeredEvents.length === 0 ? (
              <div className="empty-state-view">
                <p>Bạn chưa đăng ký tham gia sự kiện nào.</p>
                <p style={{ fontSize: '11px' }}>Hãy chọn danh mục sự kiện ở trang lịch trình để đăng ký!</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tên sự kiện</th>
                      <th>Thời gian tổ chức</th>
                      <th>Điểm danh</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredEvents.map(p => {
                      const evt = getEventDetails(p.eventId);
                      return (
                        <tr key={p.id}>
                          <td>
                            <strong>{evt.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Địa điểm: {evt.venue}</div>
                          </td>
                          <td>{evt.dateTime !== 'N/A' ? new Date(evt.dateTime).toLocaleString('vi-VN') : 'N/A'}</td>
                          <td>
                            <span className={`badge ${
                              p.attendanceStatus === 'Present' ? 'badge-active' : p.attendanceStatus === 'Absent' ? 'badge-blocked' : 'badge-pending'
                            }`}>
                              {p.attendanceStatus === 'Present' ? 'Có mặt' : p.attendanceStatus === 'Absent' ? 'Vắng mặt' : 'Đã đăng ký'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Proof upload Form & Proof submission list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Submit Proof Form */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><ImageIcon size={18} /> Nộp minh chứng quyền lợi (Đổi điểm rèn luyện)</h3>
            </div>

            <form onSubmit={handleSubmitEvidence}>
              <div className="form-group">
                <label>Sự kiện đã tham gia</label>
                <select 
                  className="select-field"
                  value={selectedEventId}
                  onChange={e => setSelectedEventId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn sự kiện --</option>
                  {registeredEvents.map(p => {
                    const evt = getEventDetails(p.eventId);
                    return (
                      <option key={p.eventId} value={p.eventId}>{evt.name}</option>
                    );
                  })}
                  <option value="general">Khác / Hoạt động CLB chung</option>
                </select>
              </div>

              <div className="form-group">
                <label>Loại minh chứng nộp</label>
                <select 
                  className="select-field"
                  value={evidenceType}
                  onChange={e => setEvidenceType(e.target.value)}
                >
                  <option value="Check-In Photo">Ảnh chụp check-in tại sự kiện</option>
                  <option value="Certificate">Chứng nhận hoàn thành hoạt động (Certificate)</option>
                  <option value="Other">Khác (Other)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Đường dẫn Tệp minh chứng (Image/PDF Link)</label>
                <input 
                  type="url" 
                  className="input-field" 
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
                  placeholder="Nhập link ảnh check-in"
                  required
                />
              </div>

              {/* Demo Assist: Quick selection for mock photos */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Click chọn nhanh một link minh chứng mẫu để test:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {mockProofUrls.map((p, idx) => (
                    <button 
                      key={idx}
                      type="button"
                      className="club-pill-btn"
                      style={{ fontSize: '11px', padding: '6px 10px', textAlign: 'left', display: 'block', width: '100%' }}
                      onClick={() => setFileUrl(p.url)}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Send size={16} /> Gửi minh chứng lên PDP duyệt
              </button>
            </form>
          </div>

          {/* Submitted Proof list */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Shield size={18} /> Minh chứng đã gửi và Trạng thái</h3>
            </div>

            {myEvidence.length === 0 ? (
              <div className="empty-state-view">
                <p>Bạn chưa gửi minh chứng nào.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
                {myEvidence.map(e => (
                  <div 
                    key={e.id}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.01)', fontSize: '13px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong>{getEventDetails(e.eventId).name || 'Hoạt động CLB chung'}</strong>
                      <span className={`badge ${
                        e.status === 'Approved' ? 'badge-active' : e.status === 'Rejected' ? 'badge-blocked' : 'badge-pending'
                      }`}>
                        {e.status === 'Approved' ? 'Đã duyệt' : e.status === 'Rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Loại: {e.type}</span>
                      <span>Gửi: {new Date(e.submittedAt).toLocaleDateString('vi-VN')}</span>
                    </div>

                    {e.adminRemark && (
                      <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.03)', borderLeft: '3px solid var(--primary)', fontSize: '12px' }}>
                        <strong>Ý kiến PDP:</strong> {e.adminRemark}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
