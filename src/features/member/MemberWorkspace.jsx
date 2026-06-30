import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEventsByClub } from '../../services/eventService';
import { User, Image as ImageIcon, Send, Clock, AlertTriangle } from 'lucide-react';

export default function MemberWorkspace({ currentUserId, triggerNotification, selectedClubId }) {
  const { currentUser } = useAuth();

  // Profile state (from currentUser)
  const user = currentUser;
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [cohort, setCohort] = useState(user?.cohort || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [facebook, setFacebook] = useState(user?.facebook || '');

  // Events list from club (for evidence form reference)
  const [clubEvents, setClubEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [evidenceType, setEvidenceType] = useState('Check-In Photo');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setCohort(user.cohort || '');
      setPhone(user.phone || '');
      setFacebook(user.facebook || '');
    }
  }, [currentUserId]);

  const loadClubEvents = useCallback(async () => {
    if (!selectedClubId) return;
    try {
      const data = await getEventsByClub(selectedClubId);
      setClubEvents(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err) {
      console.error('[MemberWorkspace] Lỗi tải sự kiện:', err);
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadClubEvents();
  }, [loadClubEvents]);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    triggerNotification('Chưa thể lưu hồ sơ: Backend chưa bổ sung API PUT /api/auth/profile.', 'warning');
  };

  const handleSubmitEvidence = (e) => {
    e.preventDefault();
    if (!fileUrl.trim()) {
      triggerNotification('Vui lòng cung cấp link hình ảnh hoặc tệp minh chứng!', 'warning');
      return;
    }
    triggerNotification('Chưa thể nộp minh chứng: Backend chưa bổ sung API POST /api/evidences.', 'warning');
    setFileUrl('');
    setSelectedEventId('');
  };

  if (!user) {
    return (
      <div className="empty-state-view">
        <User className="empty-state-icon" />
        <p>Không tìm thấy hồ sơ tài khoản sinh viên.</p>
      </div>
    );
  }

  const userId = user?.id || user?.studentId || currentUserId;

  return (
    <div className="member-workspace-container">

      {/* ⚠ BE MISSING API BANNER */}
      <div style={{
        marginBottom: '20px', padding: '16px 20px', borderRadius: '10px',
        background: 'rgba(234,179,8,0.08)',
        border: '1.5px solid rgba(234,179,8,0.4)',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <AlertTriangle size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#eab308', fontSize: '13px', marginBottom: '6px' }}>
            ⚠ [BE CẦN BỔ SUNG API] — Một số chức năng chưa hoạt động thật
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            Tải sự kiện CLB đã kết nối thật. Các chức năng sau cần BE bổ sung:
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
              <li><code>PUT  /api/auth/profile</code> — Cập nhật hồ sơ cá nhân <code>{'{ fullName, phone, facebook }'}</code></li>
              <li><code>POST /api/evidences</code> — Nộp minh chứng sự kiện <code>{'{ eventId, evidenceType, fileUrl }'}</code></li>
              <li><code>GET  /api/evidences?userId={'{userId}'}</code> — Lịch sử minh chứng đã nộp</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* Left Side: Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><User size={18} /> Hồ sơ Cá nhân</h3>
              <span className="badge badge-member">Sinh viên</span>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-row">
                <div className="form-group">
                  <label>Mã số sinh viên (MSSV)</label>
                  <input type="text" className="input-field" value={userId || ''} disabled style={{ cursor: 'not-allowed', opacity: 0.7 }} />
                </div>
                <div className="form-group">
                  <label>Khóa học</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cohort}
                    onChange={e => setCohort(e.target.value)}
                    placeholder="K18, K19..."
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

              <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
                <AlertTriangle size={12} style={{ marginRight: '4px', color: 'var(--warning)' }} />
                API cập nhật hồ sơ chưa có. Vui lòng yêu cầu BE bổ sung <code>PUT /api/auth/profile</code>.
              </div>

              <button type="submit" className="btn btn-primary">
                Cập nhật thông tin cá nhân
              </button>
            </form>
          </div>

          {/* Events list */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Clock size={18} /> Sự kiện CLB của tôi</h3>
            </div>

            {clubEvents.length === 0 ? (
              <div className="empty-state-view">
                <p>Chưa có sự kiện nào trong CLB này.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {clubEvents.map(ev => {
                  const eName = ev.eventName || ev.name;
                  const eTime = ev.startTime || ev.dateTime;
                  const eStatus = ev.status || ev.approvalStatus;
                  return (
                    <div key={ev.id || ev.eventId} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '13px' }}>{eName}</div>
                      {eTime && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(eTime).toLocaleString('vi-VN')}</div>}
                      {eStatus && (
                        <span className={`badge ${eStatus === 'Approved' ? 'badge-active' : eStatus === 'Rejected' ? 'badge-blocked' : 'badge-pending'}`} style={{ fontSize: '10px', marginTop: '6px', display: 'inline-block' }}>
                          {eStatus === 'Approved' ? 'Đã duyệt' : eStatus === 'Rejected' ? 'Bị từ chối' : eStatus === 'Pending' ? 'Chờ duyệt' : eStatus}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Evidence submission */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title"><ImageIcon size={18} /> Nộp minh chứng (Evidence)</h3>
          </div>

          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <AlertTriangle size={12} style={{ marginRight: '4px', color: 'var(--warning)' }} />
            API nộp minh chứng chưa có. Yêu cầu BE bổ sung <code>POST /api/evidences</code>.
          </div>

          <form onSubmit={handleSubmitEvidence}>
            <div className="form-group">
              <label>Sự kiện đã tham gia</label>
              <select
                className="select-field"
                value={selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
              >
                <option value="">-- Chọn sự kiện (tuỳ chọn) --</option>
                {clubEvents.map(ev => {
                  const eName = ev.eventName || ev.name;
                  return (
                    <option key={ev.id || ev.eventId} value={ev.id || ev.eventId}>{eName}</option>
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
                placeholder="Nhập link ảnh check-in hoặc PDF minh chứng..."
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Send size={16} /> Gửi minh chứng lên PDP duyệt
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
