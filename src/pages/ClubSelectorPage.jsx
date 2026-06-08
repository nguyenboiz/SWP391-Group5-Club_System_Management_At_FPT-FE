import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockDb } from '../utils/mockDb';
import { Landmark, LogOut, ChevronRight, Crown, Users } from 'lucide-react';

export default function ClubSelectorPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const dbData = mockDb.getData();
  const { clubs, memberships } = dbData;

  // All active memberships of this user
  const myMemberships = memberships.filter(
    m => m.userId === currentUser.id && m.status === 'Active'
  );

  // Separate leader (manager) and regular member clubs
  const leaderMemberships = myMemberships.filter(m => m.role === 'Leader');
  const memberMemberships = myMemberships.filter(m => m.role !== 'Leader');

  const getClub = (clubId) => clubs.find(c => c.id === clubId);

  const handleSelectClub = (clubId, asRole) => {
    // Save selected club to sessionStorage
    sessionStorage.setItem('fpt_selected_club', clubId);
    if (asRole === 'MANAGER') {
      navigate('/manager');
    } else {
      navigate('/member');
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
        <div style={{
          width: '100%',
          maxWidth: '720px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
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
                  const club = getClub(m.clubId);
                  if (!club) return null;
                  const memberCount = memberships.filter(mb => mb.clubId === club.id && mb.status === 'Active').length;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectClub(club.id, 'MANAGER')}
                      className="glass-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                        cursor: 'pointer',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        background: 'rgba(245, 158, 11, 0.06)',
                        borderRadius: '14px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.6)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)'; }}
                    >
                      <img
                        src={club.logo}
                        alt={club.name}
                        style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '2px solid rgba(245,158,11,0.4)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge badge-manager" style={{ fontSize: '10px' }}>Manager</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={11} /> {memberCount} thành viên
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
                  const club = getClub(m.clubId);
                  if (!club) return null;
                  const memberCount = memberships.filter(mb => mb.clubId === club.id && mb.status === 'Active').length;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectClub(club.id, 'MEMBER')}
                      className="glass-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '18px 20px',
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        textAlign: 'left',
                        width: '100%',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <img
                        src={club.logo}
                        alt={club.name}
                        style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-heading)', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.name}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge badge-member" style={{ fontSize: '10px' }}>{m.role}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={11} /> {memberCount} thành viên
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            · Tham gia: {m.joinedSemester}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
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
