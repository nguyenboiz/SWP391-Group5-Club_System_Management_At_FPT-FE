import React from 'react';
import { Landmark, ExternalLink, Users } from 'lucide-react';

export default function ClubDirectory({ currentUserId, selectedClubId }) {
  // Read club info from sessionStorage (saved from BE login)
  const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
  const availableClubs = availableClubsStr ? JSON.parse(availableClubsStr) : [];

  // Build clubs list from availableClubs, optionally filtered to selected club
  const myClubs = availableClubs
    .filter(c => !selectedClubId || String(c.clubId || c.id) === String(selectedClubId))
    .map(c => ({
      id: String(c.clubId || c.id || ''),
      name: c.clubName || c.name || `CLB #${c.clubId || c.id}`,
      logo: c.logoImage || c.logo || '',
      fanpage: c.fanpageUrl || c.fanpage || '',
      description: c.description || '',
      role: c.role || c.clubRole || 'Member',
    }));

  if (myClubs.length === 0) {
    return (
      <div className="glass-card">
        <div className="empty-state-view">
          <Landmark className="empty-state-icon" />
          <p>Bạn chưa tham gia câu lạc bộ nào.</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Liên hệ phòng IC-PDP hoặc CLB bạn muốn tham gia để được thêm vào danh sách thành viên.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="club-directory-container">
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="glass-card-title" style={{ marginBottom: '0' }}>
            <Landmark size={18} /> CLB của tôi
          </h3>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="cards-grid">
        {myClubs.map(c => (
          <div key={c.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              {c.logo ? (
                <img
                  src={c.logo}
                  alt={c.name}
                  style={{ width: '64px', height: '64px', borderRadius: '12px', border: '1px solid var(--border)', objectFit: 'cover', flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Landmark size={28} style={{ color: '#fff' }} />
                </div>
              )}
              <div>
                <h4 style={{ fontSize: '17px', color: 'var(--text-heading)', marginBottom: '6px' }}>{c.name}</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className={`badge ${c.role === 'Leader' || c.role === 'MANAGER' ? 'badge-manager' : 'badge-member'}`}>
                    {c.role}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {c.id}</span>
                </div>
              </div>
            </div>

            {c.description && (
              <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {c.description}
              </p>
            )}

            {c.fanpage && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto' }}>
                <a
                  href={c.fanpage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%', fontSize: '13px' }}
                >
                  Ghé thăm Fanpage <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
