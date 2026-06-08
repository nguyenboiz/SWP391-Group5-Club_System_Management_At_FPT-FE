import React from 'react';
import { Landmark, ExternalLink, Users, Calendar } from 'lucide-react';

export default function ClubDirectory({ dbData, currentUserId }) {
  const { clubs, memberships } = dbData;

  // Chỉ lấy các CLB mà user hiện tại đang là thành viên Active
  const myMemberships = memberships.filter(
    m => m.userId === currentUserId && m.status === 'Active'
  );
  const myClubIds = myMemberships.map(m => m.clubId);
  const myClubs = clubs.filter(c => myClubIds.includes(c.id));

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
          <div>
            <h3 className="glass-card-title" style={{ marginBottom: '4px' }}>
              <Landmark size={18} /> Danh sách CLB của tôi
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Bạn đang là thành viên của <strong style={{ color: 'var(--primary)' }}>{myClubs.length}</strong> câu lạc bộ
            </p>
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="cards-grid">
        {myClubs.map(c => {
          const membership = myMemberships.find(m => m.clubId === c.id);
          const memberCount = memberships.filter(m => m.clubId === c.id && m.status === 'Active').length;
          return (
            <div key={c.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                <img 
                  src={c.logo} 
                  alt={c.name} 
                  style={{ width: '64px', height: '64px', borderRadius: '12px', border: '1px solid var(--border)', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '17px', color: 'var(--text-heading)', marginBottom: '6px' }}>{c.name}</h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span className="badge badge-manager">{c.category}</span>
                    <span className="badge badge-member">{membership?.role || 'Member'}</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '16px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {c.intro}
              </p>

              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} /> {memberCount} thành viên
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={12} /> Tham gia: {membership?.joinedSemester}
                </span>
              </div>

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
            </div>
          );
        })}
      </div>
    </div>
  );
}
