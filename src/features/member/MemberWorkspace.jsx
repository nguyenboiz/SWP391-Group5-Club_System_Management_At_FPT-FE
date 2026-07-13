import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEventsByClub, submitEvidence } from '../../services/eventService';
import { updateProfile } from '../../services/userService';
import { User, Image as ImageIcon, Send, Clock, AlertTriangle, Upload } from 'lucide-react';

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
  const [feedbackText, setFeedbackText] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState(null);
  
  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      formData.append('PhoneNumber', phone);
      // We can append gender and date of birth if user object has them, or defaults
      formData.append('Gender', 'Other');
      
      await updateProfile(formData);
      triggerNotification('Cập nhật số điện thoại thành công!', 'success');
    } catch (err) {
      console.error('[MemberWorkspace] Lỗi cập nhật hồ sơ:', err);
      triggerNotification(err?.response?.data?.message || 'Cập nhật hồ sơ thất bại!', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      triggerNotification('Vui lòng chọn sự kiện để nộp chứng nhận!', 'warning');
      return;
    }
    if (!evidenceFiles || evidenceFiles.length === 0) {
      triggerNotification('Vui lòng chọn tệp chứng nhận để tải lên!', 'warning');
      return;
    }

    setIsSubmittingEvidence(true);
    try {
      const formData = new FormData();
      Array.from(evidenceFiles).forEach(file => {
        formData.append('EvidenceFiles', file);
      });
      formData.append('Feedback', feedbackText || 'Nộp chứng nhận tham gia sự kiện');

      await submitEvidence(selectedEventId, formData);
      triggerNotification('Nộp chứng nhận sự kiện thành công! Chờ PDP phê duyệt.', 'success');
      
      // Reset form
      setFeedbackText('');
      setEvidenceFiles(null);
      const fileInput = document.getElementById('evidence-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('[MemberWorkspace] Lỗi nộp chứng nhận:', err);
      triggerNotification(err?.response?.data?.message || 'Nộp chứng nhận thất bại!', 'error');
    } finally {
      setIsSubmittingEvidence(false);
    }
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

              <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span>✓ Đã liên kết API cập nhật số điện thoại (<code>PUT /api/users/profile</code>).</span>
              </div>

              <button type="submit" className="btn btn-primary" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Đang lưu...' : 'Cập nhật số điện thoại'}
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
            <h3 className="glass-card-title"><ImageIcon size={18} /> Nộp chứng nhận (Certification)</h3>
          </div>

          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>✓ Đã liên kết API nộp chứng nhận sự kiện thật (<code>POST /api/events/{"{eventId}"}/evidence</code>).</span>
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
                <option value="">-- Chọn sự kiện bắt buộc --</option>
                {clubEvents.map(ev => {
                  const eName = ev.eventName || ev.name;
                  return (
                    <option key={ev.id || ev.eventId} value={ev.id || ev.eventId}>{eName}</option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label>Ghi chú / Nhận xét phản hồi</label>
              <textarea
                className="textarea-field"
                rows={2}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Nhập ghi chú phản hồi..."
              />
            </div>

            <div className="form-group">
              <label>Chọn tệp chứng nhận (Ảnh/Tài liệu) *</label>
              <input
                id="evidence-file-input"
                type="file"
                className="input-field"
                multiple
                onChange={e => setEvidenceFiles(e.target.files)}
                style={{ padding: '8px' }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmittingEvidence}>
              <Send size={16} /> {isSubmittingEvidence ? 'Đang tải lên...' : 'Gửi chứng nhận lên hệ thống'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
