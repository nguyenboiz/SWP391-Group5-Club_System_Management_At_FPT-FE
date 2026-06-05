import React, { useState } from 'react';
import { Search, GraduationCap, Mail, Briefcase, Landmark } from 'lucide-react';

export default function AlumniSearch({ dbData }) {
  const { users, memberships, clubs } = dbData;
  const [searchQuery, setSearchQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [clubFilter, setClubFilter] = useState('ALL');

  // Filter only ALUMNI users
  const alumniUsers = users.filter(u => u.isAlumni);

  // Cross-reference memberships and filters
  const filteredAlumni = alumniUsers.filter(user => {
    // 1. Keyword search check
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.currentJob.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Cohort filter check
    const matchesCohort = cohortFilter === 'ALL' || user.cohort === cohortFilter;

    // 3. Club filter check
    let matchesClub = true;
    if (clubFilter !== 'ALL') {
      // Find if this user has any membership record in the selected club
      matchesClub = memberships.some(m => m.userId === user.id && m.clubId === clubFilter);
    }

    return matchesSearch && matchesCohort && matchesClub;
  });

  // Get former club names of an alumni user
  const getAlumniClubsInfo = (userId) => {
    const userMemberships = memberships.filter(m => m.userId === userId);
    return userMemberships.map(m => {
      const club = clubs.find(c => c.id === m.clubId);
      return {
        role: m.role,
        clubName: club ? club.name.split(' - ')[0] : m.clubId
      };
    });
  };

  const cohorts = ['ALL', 'K14', 'K15', 'K16', 'K17', 'K18'];

  return (
    <div className="alumni-search-container">
      {/* Header Search & Filter Box */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header">
          <h3 className="glass-card-title"><GraduationCap size={18} /> Mạng lưới Cựu thành viên & Kết nối Thế hệ (Alumni Network)</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tìm kiếm các thế hệ cựu thành viên xuất sắc của các CLB để kết nối học hỏi kinh nghiệm lập nghiệp hoặc liên hệ mời tham gia ngày kỷ niệm sinh nhật CLB.
        </p>

        <div className="search-filter-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
          <div className="search-input-wrapper" style={{ width: '100%' }}>
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Nhập tên, MSSV, nơi làm việc của cựu thành viên..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select 
              className="select-field"
              value={cohortFilter}
              onChange={e => setCohortFilter(e.target.value)}
            >
              <option value="ALL">Tất cả các Khóa</option>
              {cohorts.filter(c => c !== 'ALL').map(c => (
                <option key={c} value={c}>Khóa {c}</option>
              ))}
            </select>
          </div>
          <div>
            <select 
              className="select-field"
              value={clubFilter}
              onChange={e => setClubFilter(e.target.value)}
            >
              <option value="ALL">Tất cả câu lạc bộ</option>
              {clubs.map(c => (
                <option key={c.id} value={c.id}>{c.name.split(' - ')[0]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Alumni Cards Directory */}
      {filteredAlumni.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <GraduationCap className="empty-state-icon" />
            <p>Không tìm thấy cựu thành viên nào phù hợp với điều kiện tìm kiếm.</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredAlumni.map(alumni => {
            const formerClubs = getAlumniClubsInfo(alumni.id);
            return (
              <div key={alumni.id} className="alumni-card">
                <div className="alumni-header">
                  <div className="alumni-title-group">
                    <span className="alumni-name">{alumni.fullName}</span>
                    <div className="alumni-meta-row">
                      <span className="alumni-cohort-badge">{alumni.cohort}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MSSV: {alumni.id}</span>
                    </div>
                  </div>
                  <GraduationCap size={24} style={{ color: 'var(--primary)', opacity: 0.8 }} />
                </div>

                <div className="alumni-job">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                    <Briefcase size={14} style={{ color: 'var(--primary)' }} /> {alumni.currentJob}
                  </span>
                </div>

                {/* Former clubs history display */}
                {formerClubs.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Lịch sử CLB đã tham gia:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {formerClubs.map((fc, idx) => (
                        <span 
                          key={idx} 
                          className="badge" 
                          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: '10px' }}
                          title={`Chức vụ: ${fc.role}`}
                        >
                          <Landmark size={8} style={{ marginRight: '4px', color: 'var(--primary)' }} />
                          {fc.clubName} ({fc.role})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="alumni-contacts">
                  <div className="alumni-contact-item">
                    <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                    <a href={`mailto:${alumni.email}`}>{alumni.email}</a>
                  </div>
                  {alumni.facebook && (
                    <div className="alumni-contact-item">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                      </svg>
                      <a href={`https://${alumni.facebook}`} target="_blank" rel="noopener noreferrer">{alumni.facebook}</a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
