import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEventsByClub, submitEvidence } from '../../services/eventService';
import { updateProfile, getUserActivityHistory, getUserDetail, getMyProfile, changePassword } from '../../services/userService';
import { User, Image as ImageIcon, Send, Clock, Activity, Upload, Phone, Calendar, Users, Key } from 'lucide-react';
import { validatePhone, validateNoSpecialChars, parseDateVN, toLocalISOString } from '../../utils/validator';

export default function MemberWorkspace({ currentUserId, triggerNotification, selectedClubId, mode = 'profile' }) {
  const { currentUser, updateUserAvatar } = useAuth();
  const user = currentUser;
  const userId = user?.id || user?.userId || currentUserId;

  // Active tab
  const [activeTab, setActiveTab] = useState(mode === 'evidence' ? 'evidence' : 'profile');

  // Profile state
  const [phone, setPhone] = useState(() => {
    return currentUser?.phone || currentUser?.phoneNumber || currentUser?.Phone || currentUser?.PhoneNumber || '';
  });
  const [gender, setGender] = useState(() => {
    const g = String(currentUser?.gender || currentUser?.Gender || '').toLowerCase();
    if (g === 'nam' || g === 'male') return 'Male';
    if (g === 'nữ' || g === 'nu' || g === 'female') return 'Female';
    return 'Other';
  });
  const [dateOfBirth, setDateOfBirth] = useState(() => {
    const dob = currentUser?.dateOfBirth || currentUser?.DateOfBirth || currentUser?.dob || currentUser?.Dob || currentUser?.birthday || currentUser?.Birthday || currentUser?.birthDate || currentUser?.BirthDate || currentUser?.dateOfbirth || currentUser?.dateofbirth;
    return dob ? dob.substring(0, 10) : '';
  });
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

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Fetch full user details on mount to get phone, gender, dob
  useEffect(() => {
    // 1. First, set default values from currentUser if they exist
    if (currentUser) {
      setPhone(currentUser.phone || currentUser.phoneNumber || currentUser.Phone || currentUser.PhoneNumber || '');
      const cg = String(currentUser.gender || currentUser.Gender || '').toLowerCase();
      if (cg === 'nam' || cg === 'male') setGender('Male');
      else if (cg === 'nữ' || cg === 'nu' || cg === 'female') setGender('Female');
      else setGender('Other');
      
      const cdob = currentUser.dateOfBirth || currentUser.DateOfBirth || currentUser.dob || currentUser.Dob || currentUser.birthday || currentUser.Birthday || currentUser.birthDate || currentUser.BirthDate;
      if (cdob) setDateOfBirth(cdob.substring(0, 10));
    }

    if (!userId) return;

    // Helper to process user object and set states
    const updateUserStates = (u) => {
      if (u) {
        if (u.phone || u.phoneNumber || u.Phone || u.PhoneNumber) {
          setPhone(u.phone || u.phoneNumber || u.Phone || u.PhoneNumber);
        }
        
        const g = String(u.gender || u.Gender || '').toLowerCase();
        if (g === 'nam' || g === 'male') setGender('Male');
        else if (g === 'nữ' || g === 'nu' || g === 'female') setGender('Female');
        else if (g) setGender('Other');
        
        const dob = u.dateOfBirth || u.DateOfBirth || u.dob || u.Dob || u.birthday || u.Birthday || u.birthDate || u.BirthDate || u.dateOfbirth || u.dateofbirth;
        if (dob) {
          setDateOfBirth(dob.substring(0, 10));
          return true; // Date of birth found
        }
      }
      return false;
    };

    // Helper to fetch from membership fallback
    const tryMembershipFallback = async () => {
      // Find active clubId
      let activeClubId = selectedClubId || currentUser?.clubId;
      if (!activeClubId) {
        const savedClubsStr = sessionStorage.getItem('fpt_available_clubs');
        if (savedClubsStr) {
          try {
            const clubs = JSON.parse(savedClubsStr);
            if (Array.isArray(clubs) && clubs.length > 0) {
              activeClubId = clubs[0].clubId || clubs[0].id;
            }
          } catch (e) {}
        }
      }

      if (activeClubId) {
        try {
          const { getClubMembers, getMemberDetail } = await import('../../services/membershipService');
          const members = await getClubMembers(activeClubId);
          const list = Array.isArray(members) ? members : (members?.data ?? []);
          const selfMember = list.find(m => 
            String(m.studentId).toLowerCase() === String(currentUser?.studentId || '').toLowerCase() || 
            String(m.username).toLowerCase() === String(currentUser?.username || '').toLowerCase() ||
            String(m.userId) === String(userId)
          );
          if (selfMember) {
            const membershipId = selfMember.membershipId || selfMember.id;
            if (membershipId) {
              const detail = await getMemberDetail(membershipId);
              const uDetail = detail?.data ?? detail;
              const dob = uDetail?.dateOfBirth || uDetail?.DateOfBirth || uDetail?.dob;
              if (dob) {
                setDateOfBirth(dob.substring(0, 10));
              }
            }
          }
        } catch (fallbackErr) {
          console.warn('[MemberWorkspace] Lỗi lấy ngày sinh từ membership fallback:', fallbackErr);
        }
      }
    };

    // 2. Try calling getUserDetail(userId) first
    getUserDetail(userId)
      .then(res => {
        const u = res?.data ?? res;
        const foundDob = updateUserStates(u);
        if (!foundDob) {
          tryMembershipFallback();
        }
      })
      .catch(err => {
        console.warn('[MemberWorkspace] Lỗi gọi getUserDetail, thử gọi getMyProfile:', err);
        // 3. Fallback to getMyProfile()
        getMyProfile()
          .then(res => {
            const u = res?.data ?? res;
            const foundDob = updateUserStates(u);
            if (!foundDob) {
              tryMembershipFallback();
            }
          })
          .catch(err2 => {
            console.warn('[MemberWorkspace] Lỗi gọi getMyProfile:', err2);
            tryMembershipFallback();
          });
      });
  }, [userId, currentUser, selectedClubId]);

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
      const res = await getUserActivityHistory(userId);
      const rawData = res?.data ?? res;
      
      const list = [];
      if (rawData) {
        // 1. Process club history
        if (Array.isArray(rawData.clubHistory)) {
          rawData.clubHistory.forEach(club => {
            if (club.joinDate) {
              list.push({
                id: `club-join-${club.clubId}`,
                action: `Tham gia CLB: ${club.clubName} (${club.clubCode || ''})`,
                detail: `Trạng thái: ${club.status || 'Đang sinh hoạt'} · Mục tiêu: ${club.personalGoal || 'Phát triển kỹ năng'}`,
                date: club.joinDate
              });
            }
            if (Array.isArray(club.positions)) {
              club.positions.forEach((pos, idx) => {
                list.push({
                  id: `club-pos-${club.clubId}-${idx}`,
                  action: `Bổ nhiệm chức vụ: ${pos.position} tại ${club.clubName}`,
                  detail: `Nhiệm kỳ: ${pos.boardName || 'N/A'} · Điểm KPI: ${pos.kpiScore || '0'}`,
                  date: pos.appointedAt
                });
              });
            }
          });
        }

        // 2. Process event history
        if (Array.isArray(rawData.eventHistory)) {
          const ids = rawData.eventHistory.map(ev => ev.eventId).filter(Boolean);
          if (ids.length > 0) {
            setRegisteredIds(prev => {
              const next = new Set(prev);
              ids.forEach(id => {
                next.add(Number(id));
                next.add(String(id));
              });
              return next;
            });
          }

          rawData.eventHistory.forEach(ev => {
            list.push({
              id: `event-${ev.eventId}-${ev.startTime}`,
              action: `Tham gia sự kiện: ${ev.eventName}`,
              detail: `CLB tổ chức: ${ev.clubName} · Vai trò: ${ev.roleInEvent || 'Thành viên'} · Điểm danh: ${ev.attendanceStatus || 'Vắng mặt'}`,
              date: ev.startTime
            });
          });
        }
      }

      // Sort by date descending safely
      list.sort((a, b) => {
        const dA = a.date ? new Date(a.date).getTime() : 0;
        const dB = b.date ? new Date(b.date).getTime() : 0;
        return dB - dA;
      });

      setActivityHistory(list);
    } catch (err) {
      console.error('[MemberWorkspace] Lỗi tải lịch sử hoạt động:', err);
      setActivityHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadActivityHistory();
    }
  }, [userId, loadActivityHistory]);

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
      if (dateOfBirth) formData.append('DateOfBirth', toLocalISOString(dateOfBirth));
      if (avatarFile) formData.append('AvatarFile', avatarFile);

      const res = await updateProfile(formData);
      triggerNotification('✅ Cập nhật hồ sơ thành công!', 'success');
      
      const updatedUser = res?.data ?? res;
      const newAvatarUrl = updatedUser?.avatar || updatedUser?.data?.avatar;
      if (newAvatarUrl && updateUserAvatar) {
        updateUserAvatar(newAvatarUrl);
      }
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
      const errMsg = err?.response?.data?.message || err?.response?.data?.inner || '';
      if (errMsg.includes('ck_evidence_isverified') || errMsg.includes('entity changes') || errMsg.includes('23514')) {
        triggerNotification('❌ Lỗi Back-End DB: Trạng thái mặc định bị vi phạm Check Constraint (ck_evidence_isverified) trên PostgreSQL máy chủ!', 'error');
      } else {
        triggerNotification(errMsg || 'Nộp chứng nhận thất bại!', 'error');
      }
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!oldPassword) {
      newErrors.oldPassword = 'Vui lòng nhập mật khẩu hiện tại!';
    }
    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới!';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có tối thiểu 6 ký tự!';
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp!';
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    setPasswordErrors({});
    setIsChangingPassword(true);

    try {
      await changePassword({ oldPassword, newPassword });
      triggerNotification('✅ Đổi mật khẩu thành công!', 'success');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('[MemberWorkspace] Lỗi đổi mật khẩu:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Đổi mật khẩu thất bại!';
      triggerNotification(`❌ ${errMsg}`, 'error');
    } finally {
      setIsChangingPassword(false);
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
    { key: 'change-password', label: 'Đổi mật khẩu', icon: <Key size={15} /> },
  ];

  // Filter events: must be registered AND must be ended
  const eligibleEvents = clubEvents.filter(ev => {
    const evId = ev.id || ev.eventId;
    // 1. Must be registered by this user
    const isRegistered = registeredIds.has(Number(evId)) || registeredIds.has(String(evId));

    // 2. Must be ended (endTime is in the past OR status is 'Đã kết thúc')
    const isEnded = ev.endTime
      ? new Date(ev.endTime).getTime() <= Date.now()
      : (ev.status === 'Đã kết thúc' || ev.status === 'Ended');

    return isRegistered && isEnded;
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
                  <input type="text" className="input-field" value={user?.fullName || 'Chưa cập nhật'} disabled style={{ opacity: 0.6 }} />
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

          {/* Events list (Only show when selectedClubId is active for member/leader) */}
          {selectedClubId && (
            <div className="glass-card" style={{ height: 'fit-content' }}>
              <div className="glass-card-header">
                <h3 className="glass-card-title"><Clock size={18} /> Sự kiện CLB của tôi</h3>
              </div>
              {clubEvents.length === 0 ? (
                <div className="empty-state-view" style={{ minHeight: '120px' }}>
                  <p>Chưa có sự kiện nào trong CLB này.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto', paddingRight: '6px' }} className="custom-scrollbar">
                  {clubEvents.map(ev => {
                    const eName = ev.eventName || ev.name;
                    const eTime = ev.startTime || ev.dateTime;
                    const eStatus = ev.status || ev.approvalStatus;
                    return (
                      <div key={ev.id || ev.eventId} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '13px' }}>{eName}</div>
                        {eTime && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{parseDateVN(eTime).toLocaleString('vi-VN')}</div>}
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
          )}
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
                {eligibleEvents.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--warning, #f59e0b)', background: 'rgba(245,158,11,0.08)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)', marginTop: '4px' }}>
                    ⚠️ Chỉ có thể nộp minh chứng cho những sự kiện bạn <strong>đã đăng ký tham gia và đã kết thúc</strong>. Hiện tại chưa có sự kiện phù hợp.
                  </div>
                ) : (
                  <select
                    className="select-field"
                    value={selectedEventId}
                    onChange={e => {
                      setSelectedEventId(e.target.value);
                      if (evidenceErrors.selectedEventId) setEvidenceErrors(prev => ({ ...prev, selectedEventId: null }));
                    }}
                  >
                    <option value="">-- Chọn sự kiện đã kết thúc --</option>
                    {eligibleEvents.map(ev => (
                      <option key={ev.id || ev.eventId} value={ev.id || ev.eventId}>
                        {ev.eventName || ev.name} (Đã kết thúc)
                      </option>
                    ))}
                  </select>
                )}
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
                          {parseDateVN(ts).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
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

      {/* ── Tab: Đổi mật khẩu ─────────────────────────────────────── */}
      {activeTab === 'change-password' && (
        <div className="glass-card" style={{ maxWidth: '520px', marginTop: '16px' }}>
          <div className="glass-card-header" style={{ marginBottom: '16px' }}>
            <h3 className="glass-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Key size={18} /> Đổi mật khẩu tài khoản</h3>
          </div>
          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Mật khẩu hiện tại *</label>
              <input
                type="password"
                className="input-field"
                value={oldPassword}
                onChange={e => {
                  setOldPassword(e.target.value);
                  if (passwordErrors.oldPassword) setPasswordErrors(prev => ({ ...prev, oldPassword: null }));
                }}
                placeholder="Nhập mật khẩu hiện tại..."
                required
              />
              {passwordErrors.oldPassword && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{passwordErrors.oldPassword}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Mật khẩu mới * (tối thiểu 6 ký tự)</label>
              <input
                type="password"
                className="input-field"
                value={newPassword}
                onChange={e => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: null }));
                }}
                placeholder="Nhập mật khẩu mới..."
                required
              />
              {passwordErrors.newPassword && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{passwordErrors.newPassword}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Xác nhận mật khẩu mới *</label>
              <input
                type="password"
                className="input-field"
                value={confirmPassword}
                onChange={e => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) setPasswordErrors(prev => ({ ...prev, confirmPassword: null }));
                }}
                placeholder="Xác nhận mật khẩu mới..."
                required
              />
              {passwordErrors.confirmPassword && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{passwordErrors.confirmPassword}</span>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={isChangingPassword}>
              {isChangingPassword ? 'Đang thực hiện đổi...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
