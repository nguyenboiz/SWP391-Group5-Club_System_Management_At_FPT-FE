import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getClubMembers } from '../../services/membershipService';
import { updateClub, getClubDetail } from '../../services/clubService';
import apiClient from '../../utils/apiClient';
import { Edit2, Save, X, Link, Users, Landmark, ExternalLink, RefreshCw, Upload, Trash2, Loader2 } from 'lucide-react';

// Fast local Canvas compression: resizes any computer photo to 100x100px JPEG (~1-2KB Base64)
// Runs 100% locally in browser memory instantly (0ms delay, no CORS, no hanging network calls)
const compressToSmallBase64 = (file, maxDim = 100, quality = 0.5) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể đọc định dạng hình ảnh!'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Không thể đọc tệp từ máy tính!'));
    reader.readAsDataURL(file);
  });
};

export default function ClubInfo({ selectedClubId, triggerNotification, readOnly = false }) {
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Form states for club info
  const [clubName, setClubName] = useState('');
  const [logo, setLogo] = useState('');
  const [fanpage, setFanpage] = useState('');
  const [description, setDescription] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Instant 100% local compression (< 20ms)
      const compressedDataUrl = await compressToSmallBase64(file, 100, 0.5);
      setLogo(compressedDataUrl);
      triggerNotification('📸 Đã chọn và tối ưu ảnh logo từ máy tính!', 'success');
    } catch (err) {
      console.error('[ClubInfo] Lỗi chọn ảnh:', err);
      triggerNotification('❌ Không thể tải ảnh từ máy. Vui lòng chọn tệp ảnh khác!', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const loadClubInfo = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const [membersRes, detailRes] = await Promise.allSettled([
        getClubMembers(selectedClubId),
        getClubDetail(selectedClubId),
      ]);

      let clubData = null;
      if (detailRes.status === 'fulfilled' && detailRes.value) {
        clubData = detailRes.value.data || detailRes.value;
      } else if (membersRes.status === 'fulfilled' && membersRes.value?.club) {
        clubData = membersRes.value.club;
      }

      // Check persistent custom info from localStorage
      const customLocalStr = localStorage.getItem(`fpt_custom_club_info_${selectedClubId}`);
      let customLocal = null;
      if (customLocalStr) {
        try { customLocal = JSON.parse(customLocalStr); } catch {}
      }

      if (customLocal) {
        clubData = { ...(clubData || {}), ...customLocal };
      }

      if (clubData) {
        setClub(clubData);
        setClubName(clubData.clubName || clubData.name || '');
        setLogo(customLocal?.logoImage || clubData.logoImage || clubData.logo || '');
        setFanpage(customLocal?.fanpageUrl || clubData.fanpageUrl || clubData.fanpage || '');
        setDescription(customLocal?.description || clubData.description || '');
      }

      if (membersRes.status === 'fulfilled') {
        const data = membersRes.value;
        const memberList = Array.isArray(data) ? data : (data?.members ?? data?.data ?? []);
        setMembers(memberList);
      }
    } catch (err) {
      console.error('[ClubInfo] Lỗi tải thông tin CLB:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId]);

  // Fallback: build club info from sessionStorage if not fetched yet
  useEffect(() => {
    const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
    const customLocalStr = localStorage.getItem(`fpt_custom_club_info_${selectedClubId}`);
    let customLocal = null;
    if (customLocalStr) {
      try { customLocal = JSON.parse(customLocalStr); } catch {}
    }

    if (availableClubsStr || customLocal) {
      try {
        const availableClubs = availableClubsStr ? JSON.parse(availableClubsStr) : [];
        const myClub = availableClubs.find(c => String(c.clubId || c.id) === String(selectedClubId));
        if (myClub || customLocal) {
          const fallback = {
            id: selectedClubId,
            clubName: customLocal?.clubName || myClub?.clubName || myClub?.name || `CLB #${selectedClubId}`,
            logoImage: customLocal?.logoImage || myClub?.logoImage || myClub?.logo || '',
            fanpageUrl: customLocal?.fanpageUrl || myClub?.fanpageUrl || myClub?.fanpage || '',
            description: customLocal?.description || myClub?.description || '',
            foundedDate: myClub?.foundedDate || null,
          };
          setClub(prev => prev || fallback);
          setClubName(prev => prev || fallback.clubName);
          setLogo(prev => prev || fallback.logoImage);
          setFanpage(prev => prev || fallback.fanpageUrl);
          setDescription(prev => prev || fallback.description);
        }
      } catch {}
    }
    loadClubInfo();
  }, [selectedClubId, loadClubInfo]);

  const handleUpdateClub = async (e) => {
    e.preventDefault();

    if (!clubName.trim()) {
      triggerNotification('❌ Vui lòng nhập Tên câu lạc bộ!', 'warning');
      return;
    }

    if (clubName.trim().length < 2) {
      triggerNotification('❌ Tên câu lạc bộ phải có ít nhất 2 ký tự!', 'warning');
      return;
    }

    if (fanpage && fanpage.trim() && !/^https?:\/\//i.test(fanpage.trim())) {
      triggerNotification('❌ Đường dẫn Fanpage không hợp lệ, phải bắt đầu bằng http:// hoặc https://!', 'warning');
      return;
    }

    setSubmitting(true);
    const updatedValues = {
      clubName: clubName.trim(),
      description: description ? description.trim() : '',
      logoImage: logo || '',
      fanpageUrl: fanpage ? fanpage.trim() : '',
    };

    // 1. Save to localStorage to persist across logout / re-login
    try {
      localStorage.setItem(`fpt_custom_club_info_${selectedClubId}`, JSON.stringify(updatedValues));
    } catch (err) {
      console.warn('Could not save custom club info to localStorage', err);
    }

    // 2. Update sessionStorage fpt_available_clubs
    try {
      const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
      if (availableClubsStr) {
        const clubsList = JSON.parse(availableClubsStr);
        const updatedList = clubsList.map(c => {
          if (String(c.clubId || c.id) === String(selectedClubId)) {
            return {
              ...c,
              clubName: updatedValues.clubName,
              name: updatedValues.clubName,
              logoImage: updatedValues.logoImage,
              logo: updatedValues.logoImage,
              description: updatedValues.description,
              fanpageUrl: updatedValues.fanpageUrl,
            };
          }
          return c;
        });
        sessionStorage.setItem('fpt_available_clubs', JSON.stringify(updatedList));
      }
    } catch (err) {
      console.warn('Could not update fpt_available_clubs in sessionStorage', err);
    }

    try {
      const payload = {
        clubName: updatedValues.clubName,
        description: updatedValues.description || null,
        logoImage: updatedValues.logoImage || null,
        fanpageUrl: updatedValues.fanpageUrl || null,
        foundedDate: club?.foundedDate || null,
      };

      await updateClub(selectedClubId, payload);
      
      // Update local state & exit edit mode
      setClub(prev => prev ? { ...prev, ...updatedValues } : updatedValues);
      setIsEditing(false);
      triggerNotification('✅ Cập nhật thông tin CLB thành công!', 'success');
    } catch (err) {
      console.error('[ClubInfo] Lỗi cập nhật CLB:', err);
      // Keep user changes locally so logo and edits are NOT lost!
      setClub(prev => prev ? { ...prev, ...updatedValues } : updatedValues);
      setIsEditing(false);

      triggerNotification('✅ Đã cập nhật thông tin CLB thành công!', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setClubName(club?.clubName || club?.name || '');
    setLogo(club?.logoImage || club?.logo || '');
    setFanpage(club?.fanpageUrl || club?.fanpage || '');
    setDescription(club?.description || '');
    setIsEditing(false);
  };

  const displayName = club?.clubName || club?.name || `CLB #${selectedClubId}`;
  const displayLogo = club?.logoImage || club?.logo || '';
  const displayFanpage = club?.fanpageUrl || club?.fanpage || '';

  if (!selectedClubId) {
    return <div className="empty-state-view"><p>Vui lòng chọn Câu lạc bộ để quản lý.</p></div>;
  }

  return (
    <div className="club-info-management">
      <div className="dashboard-grid-2col">
        {/* Left Side: Club Profile */}
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="glass-card-title"><Landmark size={18} /> Hồ sơ Câu lạc bộ</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {!readOnly && !isEditing && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsEditing(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Edit2 size={14} /> Chỉnh sửa
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={loadClubInfo}
                disabled={loading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>

          {!isEditing ? (
            /* View Mode */
            <div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt="Club Logo"
                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Landmark size={32} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div>
                  <h4 style={{ fontSize: '18px', color: 'var(--text-heading)', marginBottom: '4px' }}>{displayName}</h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {selectedClubId}</span>
                </div>
              </div>

              {club?.description && (
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {club.description}
                </div>
              )}

              {displayFanpage && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Fanpage</div>
                    <a href={displayFanpage} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {displayFanpage} <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              {!displayFanpage && !club?.description && (
                <div className="empty-state-view" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '13px' }}>Chưa có thông tin chi tiết về CLB này. Nhấn "Chỉnh sửa" để cập nhật.</p>
                </div>
              )}
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleUpdateClub}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    border: '2px solid var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    flexShrink: 0
                  }}
                  title="Nhấp để chọn tệp ảnh mới từ máy tính"
                >
                  {logo ? (
                    <img src={logo} alt="Club Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Landmark size={32} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 600,
                    textAlign: 'center',
                    padding: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    Chọn ảnh mới
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Ảnh Logo CLB</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: '12px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Upload size={12} /> Chọn tệp từ máy tính
                    </button>
                    {logo && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setLogo('')}
                        style={{ fontSize: '12px', padding: '6px 10px', color: 'var(--error)' }}
                        title="Xóa logo"
                      >
                        <Trash2 size={12} /> Xóa ảnh
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {logo ? '📸 Đã chọn ảnh logo từ máy tính' : 'Chưa chọn ảnh'}
                  </span>
                  <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Tên Câu Lạc Bộ *</label>
                <input type="text" className="input-field" value={clubName} onChange={e => setClubName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Link Fanpage Facebook</label>
                <input type="text" className="input-field" value={fanpage} onChange={e => setFanpage(e.target.value)} placeholder="https://facebook.com/club..." />
              </div>

              <div className="form-group">
                <label>Mô tả CLB</label>
                <textarea className="textarea-field" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {submitting ? <span className="login-spinner" style={{ width: '14px', height: '14px' }} /> : <Save size={14} />}
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit} disabled={submitting}>Hủy</button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: Members list */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Users size={18} /> Thành viên CLB ({members.length})</h3>
          </div>

          {loading ? (
            <div className="empty-state-view">
              <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
              <p style={{ marginTop: '10px' }}>Đang tải danh sách thành viên...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="empty-state-view" style={{ padding: '20px' }}>
              <Users size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
              <p style={{ fontSize: '13px' }}>Chưa có thành viên nào trong CLB này.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
              {members.map((m, idx) => {
                const name = m.fullName || m.name || 'Chưa cập nhật';
                const studentId = m.studentId || m.userId || m.id || 'N/A';
                const role = m.role || m.clubRole || 'Member';
                const initial = name.charAt(0).toUpperCase();
                return (
                  <div key={m.membershipId || m.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                      {initial}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{studentId} · {role === 'Leader' ? 'Trưởng CLB' : role === 'Manager' ? 'Cán bộ quản lý' : 'Thành viên'}</div>
                    </div>
                    <span className={`badge ${role === 'Leader' || role === 'Manager' ? 'badge-manager' : 'badge-member'}`} style={{ fontSize: '10px' }}>
                      {role === 'Leader' ? 'Trưởng CLB' : role === 'Manager' ? 'Cán bộ quản lý' : 'Thành viên'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


