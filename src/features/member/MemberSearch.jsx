import React, { useState, useEffect } from 'react';
import { Search, Users, Landmark, Mail, Phone } from 'lucide-react';

export default function MemberSearch({ dbData, currentUserId, selectedClubId: initialClubId }) {
  const { users, memberships, clubs } = dbData;

  // Lấy danh sách CLB mà user hiện tại tham gia (Active)
  const myMemberships = memberships.filter(
    m => m.userId === currentUserId && m.status === 'Active'
  );
  let myClubs = myMemberships
    .map(m => clubs.find(c => c.id === m.clubId))
    .filter(Boolean);

  // Nếu là user thật từ Backend đã chọn CLB, thêm CLB đó vào danh sách để không báo trống
  if (initialClubId && !myClubs.some(c => c.id === initialClubId)) {
    const selectedClubObj = clubs.find(c => c.id === initialClubId);
    if (selectedClubObj) {
      myClubs.push(selectedClubObj);
    }
  }

  const [selectedClubId, setSelectedClubId] = useState(initialClubId || myClubs[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  // Khi club thay đổi, reset search
  useEffect(() => {
    setSearchQuery('');
  }, [selectedClubId]);

  if (myClubs.length === 0) {
    return (
      <div className="glass-card">
        <div className="empty-state-view">
          <Users className="empty-state-icon" />
          <p>Bạn chưa tham gia câu lạc bộ nào.</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Tham gia CLB để xem danh sách thành viên cùng CLB.
          </p>
        </div>
      </div>
    );
  }

  // Thành viên Active của CLB đang được chọn
  const clubMemberships = memberships.filter(
    m => m.clubId === selectedClubId && m.status === 'Active'
  );

  const clubMembers = clubMemberships
    .map(m => {
      const user = users.find(u => u.id === m.userId);
      return user ? { ...user, memberRole: m.role, joinedSemester: m.joinedSemester } : null;
    })
    .filter(Boolean)
    .filter(u => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });

  const selectedClub = clubs.find(c => c.id === selectedClubId);

  return (
    <div className="alumni-search-container">
      {/* Header + Club Selector */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header">
          <h3 className="glass-card-title"><Users size={18} /> Tìm thành viên CLB</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Xem danh sách thành viên trong các CLB bạn đang tham gia. Chọn CLB để xem thành viên tương ứng.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Club selector (Locked based on selected club) */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Câu lạc bộ đang chọn
            </label>
            <div 
              className="input-field" 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.03)', 
                color: 'var(--text-main)', 
                cursor: 'not-allowed', 
                display: 'flex', 
                alignItems: 'center', 
                height: '42px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0 12px',
                fontWeight: 600
              }}
            >
              {selectedClub ? selectedClub.name.split(' - ')[0] : 'N/A'}
            </div>
          </div>

          {/* Search input */}
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tìm kiếm thành viên
            </label>
            <div className="search-input-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="input-field"
                placeholder="Tên, MSSV, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Selected club info */}
        {selectedClub && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)' }}>
            <img src={selectedClub.logo} alt={selectedClub.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '14px' }}>{selectedClub.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                <Landmark size={10} style={{ marginRight: '4px' }} />
                {clubMemberships.length} thành viên đang hoạt động
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members Grid */}
      {clubMembers.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <Users className="empty-state-icon" />
            <p>Không tìm thấy thành viên nào phù hợp.</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {clubMembers.map(member => (
            <div key={member.id} className="alumni-card">
              <div className="alumni-header">
                <div className="alumni-title-group">
                  <div style={{ 
                    width: '44px', height: '44px', borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>
                    {member.fullName.charAt(0)}
                  </div>
                  <div style={{ marginLeft: '12px' }}>
                    <span className="alumni-name">{member.fullName}</span>
                    <div className="alumni-meta-row" style={{ marginTop: '4px' }}>
                      <span className={`badge ${member.memberRole === 'Leader' ? 'badge-manager' : 'badge-member'}`}>
                        {member.memberRole}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MSSV: {member.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Tham gia từ học kỳ <strong style={{ color: 'var(--text-main)' }}>{member.joinedSemester}</strong>
                {' · '}Khóa <strong style={{ color: 'var(--text-main)' }}>{member.cohort}</strong>
              </div>

              <div className="alumni-contacts">
                <div className="alumni-contact-item">
                  <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                  <a href={`mailto:${member.email}`}>{member.email}</a>
                </div>
                {member.phone && (
                  <div className="alumni-contact-item">
                    <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                    <span>{member.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
