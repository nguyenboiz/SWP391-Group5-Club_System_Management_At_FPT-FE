import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEventsByClub, submitEvidence } from '../../services/eventService';
import { updateProfile, getUserActivityHistory } from '../../services/userService';
import { User, Image as ImageIcon, Send, Clock, Activity, Upload, Phone, Calendar, Users } from 'lucide-react';
import { validatePhone, validateNoSpecialChars } from '../../utils/validator';

export default function MemberWorkspace({ currentUserId, triggerNotification, selectedClubId, mode = 'profile' }) {
  const { currentUser } = useAuth();
  const user = currentUser;
  const userId = user?.id || user?.userId || currentUserId;

  // Active tab
  const [activeTab, setActiveTab] = useState(mode === 'evidence' ? 'evidence' : 'profile');

  // Profile state
  const [phone, setPhone] = useState(user?.phone || user?.phoneNumber || '');
  const [gender, setGender] = useState(user?.gender || 'Other');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Events + evidence state
  const [clubEvents, setClubEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [selectedEventId, setSelectedEventId] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState(null);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);

  // Activity history state
  const [activityHistory, setActivityHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Validation errors
  const [profileErrors, setProfileErrors] = useState({});
  const [evidenceErrors, setEvidenceErrors] = useState({});

  useEffect(() => {
    if (user) {
      setPhone(user.phone || user.phoneNumber || '');
      setGender(user.gender || 'Other');
      setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '');
    }
  }, [user]);

  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`fpt_registered_events_${userId}`);
      if (saved) {
        try {
          setRegisteredIds(new Set(JSON.parse(saved)));
        } catch (e) {
          console.error('[MemberWorkspace] Error parsing registered events:', e);
        }
      }
    }
  }, [userId]);

  const loadClubEvents = useCallback(async () => {
    if (!selectedClubId) return;
    try {
      const data = await getEventsByClub(selectedClubId);
      const raw = Array.isArray(data) ? data : (data?.data || []);
      setClubEvents(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error('[MemberWorkspace] Lỗi tải sự kiện:', err);
      setClubEvents([]);
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadClubEvents();
  }, [loadClubEvents]);

  const loadActivityHistory = useCallback(async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const data = await getUserActivityHistory(userId);
      const rawList = Array.isArray(data) ? data : (data?.data || []);
      const list = Array.isArray(rawList) ? rawList : [];
      setActivityHistory(list);
    } catch (err) {
      console.error('[MemberWorkspace] Lỗi tải lịch sử hoạt động:', err);
      setActivityHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivityHistory();
    }
  }, [activeTab, loadActivityHistory]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (phone && !validatePhone(phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0, gồm 10 chữ số)!';
    }

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const now = new Date();
      if (dob > now) {
        newErrors.dateOfBirth = 'Ngày sinh không được ở tương lai!';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setProfileErrors(newErrors);
      triggerNotification('❌ Vui lòng sửa các lỗi nhập liệu bên dưới!', 'warning');
      return;
    }

    setProfileErrors({});
    setIsUpdatingProfile(true);
    try {
      const formData = new FormData();
      if (phone) formData.append('PhoneNumber', phone);
      if (gender) formData.append('Gender', gender);
      if (dateOfBirth) formData.append('DateOfBirth', new Date(dateOfBirth).toISOString());
      if (avatarFile) formData.append('AvatarFile', avatarFile);

      await updateProfile(formData);
      triggerNotification('✅ Cập nhật hồ sơ thành công!', 'success');
    } catch (err) {
      console.error('[MemberWorkspace] Lỗi cập nhật hồ sơ:', err);
      triggerNotification(err?.response?.data?.message || 'Cập nhật hồ sơ thất bại!', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!selectedEventId) {
      newErrors.selectedEventId = 'Vui lòng chọn sự kiện để nộp chứng nhận!';
    }
    if (!evidenceFiles || evidenceFiles.length === 0) {
      newErrors.evidenceFiles = 'Vui lòng chọn tệp chứng nhận để tải lên!';
    }
    if (feedbackText && !validateNoSpecialChars(feedbackText)) {
      newErrors.feedbackText = 'Ghi chú không được chứa ký tự lạ!';
    }

    if (Object.keys(newErrors).length > 0) {
      setEvidenceErrors(newErrors);
      triggerNotification('❌ Vui lòng sửa các lỗi nhập liệu bên dưới!', 'warning');
      return;
    }

    setEvidenceErrors({});
    setIsSubmittingEvidence(true);
    try {
      const formData = new FormData();
      Array.from(evidenceFiles).forEach(file => {
        formData.append('EvidenceFiles', file);
      });
      formData.append('Feedback', feedbackText || 'Nộp chứng nhận tham gia sự kiện');

      await submitEvidence(selectedEventId, formData);
      triggerNotification('Nộp chứng nhận sự kiện thành công! Chờ Leader phê duyệt.', 'success');
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

  const TABS = [
    { key: 'profile', label: 'Hồ sơ Cá nhân', icon: <User size={15} /> },
    { key: 'activity', label: 'Lịch sử Hoạt động', icon: <Activity size={15} /> },
  ];

  // Filter events: must be registered and must have ended
  const eligibleEvents = clubEvents.filter(ev => {
    const evId = ev.id || ev.eventId;
    // 1. Must be registered by this user
    const isRegistered = registeredIds.has(evId);
    
    // 2. Must have ended
    const eTime = ev.startTime || ev.dateTime;
    const eEndTime = ev.endTime;
    const start = new Date(eTime);
    const end = eEndTime ? new Date(eEndTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration fallback
    const now = new Date();
    const hasEnded = now > end;
    
    return isRegistered && hasEnded;
  });

  return (
    <div className="member-workspace-container">

      {/* Tab Nav */}
      {mode === 'profile' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: activeTab === tab.key ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                fontWeight: activeTab === tab.key ? 700 : 400,
                fontSize: '13px', transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Tab: Hồ sơ Cá nhân ─────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className={selectedClubId ? "dashboard-grid-2col" : ""} style={!selectedClubId ? { maxWidth: '640px' } : {}}>
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><User size={18} /> Hồ sơ Cá nhân</h3>
            </div>

            <form onSubmit={handleUpdateProfile} noValidate>
              {/* Read-only info */}
              <div className="form-row">
                <div className="form-group">
                  <label>Mã số sinh viên / Username</label>
                  <input type="text" className="input-field" value={user?.studentId || user?.username || userId || ''} disabled style={{ opacity: 0.6 }} />
                </div>
                <div className="form-group">
                  <label>Họ và Tên</label>
                  <input type="text" className="input-field" value={user?.fullName || user?.name || ''} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><Phone size={12} style={{ verticalAlign: 'middle' }} /> Số điện thoại</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      if (profileErrors.phone) setProfileErrors(prev => ({ ...prev, phone: null }));
                    }}
                    placeholder="0901234567"
                    disabled
                    style={{ opacity: 0.6 }}
                  />
                  {profileErrors.phone && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{profileErrors.phone}</span>}
                </div>
                <div className="form-group">
                  <label><Users size={12} style={{ verticalAlign: 'middle' }} /> Giới tính</label>
                  <select className="select-field" value={gender} onChange={e => setGender(e.target.value)} disabled style={{ opacity: 0.6 }}>
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label><Calendar size={12} style={{ verticalAlign: 'middle' }} /> Ngày sinh</label>
                <input
                  type="date"
                  className="input-field"
                  value={dateOfBirth}
                  onChange={e => {
                    setDateOfBirth(e.target.value);
                    if (profileErrors.dateOfBirth) setProfileErrors(prev => ({ ...prev, dateOfBirth: null }));
                  }}
                  disabled
                  style={{ opacity: 0.6 }}
                />
                {profileErrors.dateOfBirth && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{profileErrors.dateOfBirth}</span>}
              </div>

              <div className="form-group">
                <label><Upload size={12} style={{ verticalAlign: 'middle' }} /> Ảnh đại diện mới</label>
                <input
                  type="file"
                  className="input-field"
                  accept="image/*"
                  onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                  style={{ padding: '8px' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={isUpdatingProfile}>
                {isUpdatingProfile ? 'Đang lưu...' : 'Cập nhật hồ sơ'}
              </button>
            </form>
          </div>

          {/* Events list */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Clock size={18} /> Sự kiện CLB của tôi</h3>
            </div>
            {clubEvents.length === 0 ? (
              <div className="empty-state-view" style={{ minHeight: '120px' }}>
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
                        <span className={`badge ${eStatus === 'Approved' ? 'badge-active' : eStatus === 'Rejected' ? 'badge-blocked' : 'badge-member'}`} style={{ fontSize: '10px', marginTop: '6px', display: 'inline-block' }}>
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
      )}

      {/* ── Tab: Nộp Chứng nhận ────────────────────────────────── */}
      {activeTab === 'evidence' && (
        <div>
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><ImageIcon size={18} /> Nộp chứng nhận tham gia sự kiện</h3>
            </div>

            <form onSubmit={handleSubmitEvidence} noValidate>
              <div className="form-group">
                <label>Sự kiện đã tham gia *</label>
                <select
                  className="select-field"
                  value={selectedEventId}
                  onChange={e => {
                    setSelectedEventId(e.target.value);
                    if (evidenceErrors.selectedEventId) setEvidenceErrors(prev => ({ ...prev, selectedEventId: null }));
                  }}
                >
                  <option value="">-- Chọn sự kiện --</option>
                  {eligibleEvents.map(ev => (
                    <option key={ev.id || ev.eventId} value={ev.id || ev.eventId}>
                      {ev.eventName || ev.name}
                    </option>
                  ))}
                </select>
                {evidenceErrors.selectedEventId && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{evidenceErrors.selectedEventId}</span>}
              </div>

              <div className="form-group">
                <label>Ghi chú / Nhận xét phản hồi</label>
                <textarea
                  className="textarea-field"
                  rows={2}
                  value={feedbackText}
                  onChange={e => {
                    setFeedbackText(e.target.value);
                    if (evidenceErrors.feedbackText) setEvidenceErrors(prev => ({ ...prev, feedbackText: null }));
                  }}
                  placeholder="Nhập ghi chú phản hồi (tuỳ chọn)..."
                />
                {evidenceErrors.feedbackText && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{evidenceErrors.feedbackText}</span>}
              </div>

              <div className="form-group">
                <label>Chọn tệp chứng nhận (Ảnh/Tài liệu) *</label>
                <input
                  id="evidence-file-input"
                  type="file"
                  className="input-field"
                  multiple
                  onChange={e => {
                    setEvidenceFiles(e.target.files);
                    if (evidenceErrors.evidenceFiles) setEvidenceErrors(prev => ({ ...prev, evidenceFiles: null }));
                  }}
                  style={{ padding: '8px' }}
                />
                {evidenceErrors.evidenceFiles && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{evidenceErrors.evidenceFiles}</span>}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmittingEvidence}>
                <Send size={16} /> {isSubmittingEvidence ? 'Đang tải lên...' : 'Gửi chứng nhận lên hệ thống'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tab: Lịch sử Hoạt động ─────────────────────────────── */}
      {activeTab === 'activity' && (
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="glass-card-title"><Activity size={18} /> Lịch sử Hoạt động</h3>
            <button className="btn btn-secondary btn-sm" onClick={loadActivityHistory} disabled={loadingHistory} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Làm mới
            </button>
          </div>

          {loadingHistory ? (
            <div className="empty-state-view">
              <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
            </div>
          ) : activityHistory.length === 0 ? (
            <div className="empty-state-view">
              <Activity className="empty-state-icon" />
              <p>Chưa có lịch sử hoạt động nào được ghi nhận.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              {activityHistory.map((item, idx) => {
                const ts = item.createdAt || item.timestamp || item.date;
                return (
                  <div key={item.id || idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '5px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {item.action || item.activityType || item.description || 'Hoạt động'}
                      </div>
                      {item.detail && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.detail}</div>
                      )}
                      {ts && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', opacity: 0.7 }}>
                          {new Date(ts).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
