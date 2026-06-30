import React, { useState, useEffect, useCallback } from 'react';
import { getClubMembers } from '../../services/membershipService';
import { updateClub } from '../../services/clubService';
import apiClient from '../../utils/apiClient';
import { Edit2, Save, X, Link, Users, Landmark, ExternalLink, RefreshCw } from 'lucide-react';

export default function ClubInfo({ selectedClubId, triggerNotification, readOnly = false }) {
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Form states for club info
  const [clubName, setClubName] = useState('');
  const [logo, setLogo] = useState('');
  const [fanpage, setFanpage] = useState('');
  const [description, setDescription] = useState('');

  const loadClubInfo = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      // Try load club info – BE may return it embedded in members list header
      // or from a future /api/clubs/{clubId} endpoint
      const data = await getClubMembers(selectedClubId);
      // Some BEs return { club: {...}, members: [...] }
      if (data?.club) {
        setClub(data.club);
        setClubName(data.club.clubName || data.club.name || '');
        setLogo(data.club.logoImage || data.club.logo || '');
        setFanpage(data.club.fanpageUrl || data.club.fanpage || '');
        setDescription(data.club.description || '');
      }
      const memberList = Array.isArray(data) ? data : (data?.members ?? data?.data ?? []);
      setMembers(memberList);
    } catch (err) {
      console.error('[ClubInfo] Lỗi tải thông tin CLB:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId]);

  // Fallback: build club info from sessionStorage
  useEffect(() => {
    const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
    if (availableClubsStr) {
      try {
        const availableClubs = JSON.parse(availableClubsStr);
        const myClub = availableClubs.find(c => String(c.clubId || c.id) === String(selectedClubId));
        if (myClub) {
          const fallback = {
            id: selectedClubId,
            clubName: myClub.clubName || myClub.name || `CLB #${selectedClubId}`,
            logoImage: myClub.logoImage || myClub.logo || '',
            fanpageUrl: myClub.fanpageUrl || myClub.fanpage || '',
            description: myClub.description || '',
          };
          setClub(fallback);
          setClubName(fallback.clubName);
          setLogo(fallback.logoImage);
          setFanpage(fallback.fanpageUrl);
          setDescription(fallback.description);
        }
      } catch {}
    }
    loadClubInfo();
  }, [selectedClubId, loadClubInfo]);

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    try {
      await updateClub(selectedClubId, {
        clubName: clubName,
        description: description || null,
        logoImage: logo || null,
        fanpageUrl: fanpage || null,
        foundedDate: null,
      });
      triggerNotification('Cập nhật thông tin CLB thành công!', 'success');
      setIsEditing(false);
      // Update local state
      setClub(prev => prev ? { ...prev, clubName, logoImage: logo, fanpageUrl: fanpage, description } : prev);
    } catch (err) {
      console.error('[ClubInfo] Lỗi cập nhật CLB:', err);
      triggerNotification(
        err?.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!',
        'error'
      );
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
                {logo ? (
                  <img src={logo} alt="Club Logo" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Landmark size={32} style={{ color: 'var(--text-muted)' }} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>URL Ảnh Logo CLB</label>
                  <input type="text" className="input-field" value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
              </div>

              <div className="form-group">
                <label>Tên Câu Lạc Bộ</label>
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
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={14} /> Lưu thay đổi
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Hủy</button>
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
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{studentId} · {role}</div>
                    </div>
                    <span className={`badge ${role === 'Leader' || role === 'Manager' ? 'badge-manager' : 'badge-member'}`} style={{ fontSize: '10px' }}>
                      {role}
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
