import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService';
import * as clubService from '../services/clubService';
import { Landmark, LogOut, ChevronRight, Crown, Users } from 'lucide-react';

export default function ClubSelectorPage() {
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Map: clubId (string) -> clubStatus (string)
  const [clubStatusMap, setClubStatusMap] = useState({});
  // Notification for suspended/dissolved clubs
  const [blockedNotif, setBlockedNotif] = useState(null); // { type: 'suspended'|'dissolved', clubName: string }

  // Fetch all clubs from API to get their current statuses
  useEffect(() => {
    const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
    const availableClubs = availableClubsStr ? JSON.parse(availableClubsStr) : [];
    const clubIds = availableClubs.map(c => String(c.clubId || c.id || '')).filter(Boolean);

    clubService.getClubs().then((res) => {
      const list = Array.isArray(res?.data) ? res.data
        : Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res) ? res : [];
      const map = {};
      list.forEach((c) => {
        const id = String(c.clubId || c.id || '');
        if (id) map[id] = c.status || c.clubStatus || 'Đang hoạt động';
      });
      console.log('[ClubSelector] clubStatusMap from getClubs():', map);
      setClubStatusMap(map);

      // Fallback: for any club ID not in the map, fetch detail individually
      const missingIds = clubIds.filter(id => !map[id]);
      if (missingIds.length > 0) {
        console.log('[ClubSelector] Fetching individual status for:', missingIds);
        Promise.all(missingIds.map(id =>
          clubService.getClubDetail(id).then(detail => {
            const s = detail?.data?.status || detail?.status || detail?.data?.clubStatus || 'Đang hoạt động';
            return { id, status: s };
          }).catch(() => ({ id, status: 'Đang hoạt động' }))
        )).then(results => {
          setClubStatusMap(prev => {
            const updated = { ...prev };
            results.forEach(({ id, status }) => { updated[id] = status; });
            console.log('[ClubSelector] Updated clubStatusMap with details:', updated);
            return updated;
          });
        });
      }
    }).catch((err) => {
      console.warn('[ClubSelector] getClubs() failed:', err);
      // Fallback: try to get status for each club individually
      if (clubIds.length > 0) {
        Promise.all(clubIds.map(id =>
          clubService.getClubDetail(id).then(detail => {
            const s = detail?.data?.status || detail?.status || detail?.data?.clubStatus || 'Đang hoạt động';
            return { id, status: s };
          }).catch(() => ({ id, status: 'Đang hoạt động' }))
        )).then(results => {
          const map = {};
          results.forEach(({ id, status }) => { map[id] = status; });
          console.log('[ClubSelector] clubStatusMap from individual details:', map);
          setClubStatusMap(map);
        });
      }
    });
  }, []);

  console.log('[ClubSelectorPage] currentUser:', currentUser);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }
  if (currentUser.role === 'MANAGER') {
    return <Navigate to="/manager" replace />;
  }

  // Read availableClubs from sessionStorage (saved after login from BE)
  const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
  const availableClubs = availableClubsStr ? JSON.parse(availableClubsStr) : null;

  // Build membership list from availableClubs (BE data)
  let myMemberships = [];
  if (availableClubs && availableClubs.length > 0) {
    myMemberships = availableClubs.map((club, idx) => {
      const clubId = String(club.clubId || club.id || '');
      const rawRole = (club.role || club.clubRole || '').toUpperCase();
      const isLeader = rawRole === 'MANAGER' || rawRole === 'LEADER';
      // Priority: status from API call (clubStatusMap) > from login response > default
      const clubStatus = clubStatusMap[clubId] || club.clubStatus || club.status || 'Đang hoạt động';
      return {
        id: `be-${clubId}-${idx}`,
        userId: currentUser.id,
        clubId,
        role: isLeader ? 'Leader' : 'Member',
        clubStatus,
        joinedSemester: club.joinedSemester || '',
        // Preserve club info for display
        clubName: club.clubName || club.name || `CLB #${clubId}`,
        clubLogo: club.logoImage || club.logo || '',
      };
    });
  } else if (currentUser.clubId) {
    // Fallback: single club from user profile
    const clubId = String(currentUser.clubId);
    myMemberships = [{
      id: `be-${clubId}`,
      userId: currentUser.id,
      clubId,
      role: currentUser.role === 'MANAGER' ? 'Leader' : 'Member',
      clubStatus: clubStatusMap[clubId] || 'Đang hoạt động',
      joinedSemester: '',
      clubName: currentUser.clubName || `CLB #${clubId}`,
      clubLogo: currentUser.clubLogo || '',
    }];
  }

  // Separate leader (manager) and regular member clubs
  const leaderMemberships = myMemberships.filter(m => m.role === 'Leader');
  const memberMemberships = myMemberships.filter(m => m.role !== 'Leader');

  const getClubInfo = (m) => ({
    id: m.clubId,
    name: m.clubName || `Câu lạc bộ #${m.clubId}`,
    logo: m.clubLogo || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
  });

  // Helper: detect status
  const isSuspended = (s) => s === 'Tạm dừng' || s === 'Suspended' || s === 'suspended';
  const isDissolved = (s) => s === 'Đã giải thể' || s === 'Giải thể' || s === 'giải thể' || s === 'Dissolved' || s === 'dissolved';
  const isActive = (s) => !isSuspended(s) && !isDissolved(s);

  const handleSelectClub = async (clubId, asRole, membership) => {
    // Block entry for non-active clubs
    const status = membership?.clubStatus || 'Đang hoạt động';
    if (isDissolved(status)) {
      setBlockedNotif({ type: 'dissolved', clubName: membership?.clubName || 'CLB này' });
      return;
    }
    if (isSuspended(status)) {
      setBlockedNotif({ type: 'suspended', clubName: membership?.clubName || 'CLB này' });
      return;
    }

    const token = sessionStorage.getItem('fpt_token') || localStorage.getItem('fpt_token');

    if (!token) {
      alert('Không tìm thấy token phiên đăng nhập. Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }

    const requireClubSelection = sessionStorage.getItem('fpt_require_club_selection') === 'true';
    const tempToken = sessionStorage.getItem('fpt_temp_token');

    setIsSubmitting(true);
    try {
      if (requireClubSelection && tempToken) {
        // Gọi API select-club của BE nếu yêu cầu chọn CLB và có tempToken
        const result = await authService.selectClub(tempToken, Number(clubId) || clubId);
        const finalToken = result?.accessToken || result?.token || result || tempToken;

        if (finalToken && typeof finalToken === 'string') {
          sessionStorage.setItem('fpt_token', finalToken);
        }

        // Sau khi có token chính thức, xóa tempToken và requireClubSelection
        sessionStorage.removeItem('fpt_temp_token');
        sessionStorage.removeItem('fpt_require_club_selection');
      }

      // Làm mới dữ liệu user tương ứng với CLB vừa chọn
      await refreshUser();

      sessionStorage.setItem('fpt_selected_club', clubId);
      // Lưu role của CLB vừa chọn để các trang dùng
      const selectedMembership = myMemberships.find(m => String(m.clubId) === String(clubId));
      const clubRole = selectedMembership?.role === 'Leader' ? 'LEADER' : 'MEMBER';
      sessionStorage.setItem('fpt_club_role', clubRole);

      if (asRole === 'MANAGER') {
        navigate('/manager');
      } else {
        navigate('/member');
      }
    } catch (err) {
      console.error('[ClubSelector] Lỗi chọn CLB từ Backend:', err);
      alert(err?.response?.data?.message || 'Có lỗi xảy ra khi chọn câu lạc bộ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const totalClubs = myMemberships.length;

  // Status badge component
  const StatusBadge = ({ status }) => {
    if (isDissolved(status)) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '10px', fontWeight: 700, padding: '3px 8px',
          borderRadius: '20px', letterSpacing: '0.04em',
          background: 'rgba(239,68,68,0.15)', color: '#f87171',
          border: '1px solid rgba(239,68,68,0.35)'
        }}>
          ✕ Đã giải thể
        </span>
      );
    }
    if (isSuspended(status)) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontSize: '10px', fontWeight: 700, padding: '3px 8px',
          borderRadius: '20px', letterSpacing: '0.04em',
          background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
          border: '1px solid rgba(245,158,11,0.35)'
        }}>
          ⏸ Tạm dừng
        </span>
      );
    }
    return null;
  };

  // Card style helpers based on club status
  const getCardStyle = (status, isLeader) => {
    if (isDissolved(status)) {
      return {
        border: '1px solid rgba(239,68,68,0.25)',
        background: 'rgba(239,68,68,0.04)',
        opacity: 0.6,
        cursor: 'not-allowed',
      };
    }
    if (isSuspended(status)) {
      return {
        border: '1px solid rgba(245,158,11,0.25)',
        background: 'rgba(245,158,11,0.04)',
        opacity: 0.75,
        cursor: 'not-allowed',
      };
    }
    // Active
    if (isLeader) {
      return {
        border: '1px solid rgba(245, 158, 11, 0.35)',
        background: 'rgba(245, 158, 11, 0.06)',
        cursor: 'pointer',
      };
    }
    return {
      border: '1px solid var(--border)',
      background: '',
      cursor: 'pointer',
    };
  };

  return (
    <div className="login-page" style={{ minHeight: '100vh' }}>
      {/* Background decorations */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      {/* Blocked Club Notification Modal */}
      {blockedNotif && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div className="glass-card" style={{
            maxWidth: '400px', width: '100%',
            padding: '32px 28px',
            textAlign: 'center',
            border: blockedNotif.type === 'dissolved'
              ? '1px solid rgba(239,68,68,0.4)'
              : '1px solid rgba(245,158,11,0.4)',
            animation: 'slideUp 0.25s ease'
          }}>
            {/* Icon */}
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              margin: '0 auto 20px',
              background: blockedNotif.type === 'dissolved'
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px'
            }}>
              {blockedNotif.type === 'dissolved' ? '🏳️' : '⏸️'}
            </div>

            {/* Title */}
            <h3 style={{
              fontSize: '18px', fontWeight: 800,
              color: blockedNotif.type === 'dissolved' ? '#f87171' : '#fbbf24',
              marginBottom: '10px'
            }}>
              {blockedNotif.type === 'dissolved' ? 'CLB đã giải thể' : 'CLB đang tạm dừng'}
            </h3>

            {/* Club name */}
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-heading)', marginBottom: '8px' }}>
              {blockedNotif.clubName}
            </p>

            {/* Message */}
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              {blockedNotif.type === 'dissolved'
                ? 'Câu lạc bộ này đã chính thức giải thể. Bạn không thể truy cập hoặc thực hiện bất kỳ hoạt động nào.'
                : 'Câu lạc bộ này đang tạm dừng hoạt động theo quyết định của quản trị viên. Vui lòng liên hệ Admin để biết thêm thông tin.'}
            </p>

            {/* OK button */}
            <button
              onClick={() => setBlockedNotif(null)}
              style={{
                padding: '10px 32px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                background: blockedNotif.type === 'dissolved'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}


      <div style={{
        minHeight: '100vh',
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div className="logo-icon" style={{ width: '64px', height: '64px', fontSize: '28px', margin: '0 auto 16px' }}>F</div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '8px' }}>
            Chọn Câu lạc bộ
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Xin chào, <strong style={{ color: 'var(--primary)' }}>{currentUser.fullName}</strong>
            {' '}— Bạn đang tham gia <strong style={{ color: 'var(--primary)' }}>{totalClubs}</strong> câu lạc bộ
          </p>
        </div>

        {/* Club Cards */}
        <div style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Manager clubs */}
          {leaderMemberships.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Crown size={16} style={{ color: 'var(--warning, #f59e0b)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  CLB bạn đang quản lý
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {leaderMemberships.map(m => {
                  const club = getClubInfo(m);
                  const status = m.clubStatus;
                  const active = isActive(status);
                  const cardStyle = getCardStyle(status, true);
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectClub(club.id, 'MANAGER', m)}
                      className="glass-card"
                      disabled={isSubmitting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                        borderRadius: '14px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s ease',
                        ...cardStyle,
                      }}
                      onMouseEnter={e => {
                        if (active && !isSubmitting) {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = cardStyle.border?.replace('1px solid ', '') || '';
                      }}
                    >
                      {club.logo ? (
                        <img
                          src={club.logo}
                          alt={club.name}
                          style={{
                            width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover',
                            border: '2px solid rgba(245,158,11,0.4)', flexShrink: 0,
                            filter: !active ? 'grayscale(60%)' : 'none'
                          }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '12px',
                          background: active
                            ? 'linear-gradient(135deg,var(--primary),var(--secondary))'
                            : 'rgba(100,100,100,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Landmark size={24} style={{ color: '#fff' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: active ? 'var(--text-heading)' : 'var(--text-muted)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="badge badge-manager" style={{ fontSize: '10px' }}>Trưởng CLB</span>
                          <StatusBadge status={status} />
                        </div>
                      </div>
                      {isSubmitting ? (
                        <span className="login-spinner" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                      ) : active ? (
                        <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Member clubs */}
          {memberMemberships.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Users size={16} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                  CLB bạn là thành viên
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {memberMemberships.map(m => {
                  const club = getClubInfo(m);
                  const status = m.clubStatus;
                  const active = isActive(status);
                  const cardStyle = getCardStyle(status, false);
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectClub(club.id, 'MEMBER', m)}
                      className="glass-card"
                      disabled={isSubmitting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                        borderRadius: '14px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s ease',
                        ...cardStyle,
                      }}
                      onMouseEnter={e => {
                        if (active && !isSubmitting) {
                          e.currentTarget.style.transform = 'translateX(4px)';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      {club.logo ? (
                        <img
                          src={club.logo}
                          alt={club.name}
                          style={{
                            width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover',
                            border: '1px solid var(--border)', flexShrink: 0,
                            filter: !active ? 'grayscale(60%)' : 'none'
                          }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '12px',
                          background: active
                            ? 'linear-gradient(135deg,var(--primary),var(--secondary))'
                            : 'rgba(100,100,100,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Landmark size={24} style={{ color: '#fff' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: active ? 'var(--text-heading)' : 'var(--text-muted)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="badge badge-member" style={{ fontSize: '10px' }}>{m.role}</span>
                          {m.joinedSemester && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>· Tham gia: {m.joinedSemester}</span>}
                          <StatusBadge status={status} />
                        </div>
                      </div>
                      {isSubmitting ? (
                        <span className="login-spinner" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                      ) : active ? (
                        <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalClubs === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <Landmark size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Bạn chưa tham gia câu lạc bộ nào.</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
                Liên hệ phòng IC-PDP để được thêm vào danh sách thành viên.
              </p>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ marginTop: '32px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <LogOut size={14} /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
