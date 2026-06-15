import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService';
import { Landmark, LogOut, ChevronRight, Crown, Users } from 'lucide-react';

export default function ClubSelectorPage() {
  const { currentUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
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
      return {
        id: `be-${clubId}-${idx}`,
        userId: currentUser.id,
        clubId,
        role: isLeader ? 'Leader' : 'Member',
        status: 'Active',
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
      status: 'Active',
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

  const handleSelectClub = async (clubId, asRole) => {
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

  return (
    <div className="login-page" style={{ minHeight: '100vh' }}>
      {/* Background decorations */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

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
            Xin chào, <strong style={{ color: 'var(--primary)' }}>{currentUser.fullName}</strong> ({currentUser.id})
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
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectClub(club.id, 'MANAGER')}
                      className="glass-card"
                      disabled={isSubmitting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                        cursor: isSubmitting ? 'wait' : 'pointer',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        background: 'rgba(245, 158, 11, 0.06)',
                        borderRadius: '14px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)'; }}
                    >
                      {club.logo ? (
                        <img
                          src={club.logo}
                          alt={club.name}
                          style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(245,158,11,0.4)', flexShrink: 0 }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Landmark size={24} style={{ color: '#fff' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge badge-manager" style={{ fontSize: '10px' }}>Manager</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {club.id}</span>
                        </div>
                      </div>
                      {isSubmitting ? (
                        <span className="login-spinner" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                      ) : (
                        <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      )}
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
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectClub(club.id, 'MEMBER')}
                      className="glass-card"
                      disabled={isSubmitting}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                        cursor: isSubmitting ? 'wait' : 'pointer',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { if (!isSubmitting) { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; } }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      {club.logo ? (
                        <img
                          src={club.logo}
                          alt={club.name}
                          style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Landmark size={24} style={{ color: '#fff' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge badge-member" style={{ fontSize: '10px' }}>{m.role}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: {club.id}</span>
                          {m.joinedSemester && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>· Tham gia: {m.joinedSemester}</span>}
                        </div>
                      </div>
                      {isSubmitting ? (
                        <span className="login-spinner" style={{ width: '18px', height: '18px', flexShrink: 0 }} />
                      ) : (
                        <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                      )}
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
