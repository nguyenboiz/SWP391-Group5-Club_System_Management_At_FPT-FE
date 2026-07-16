import React, { useState } from 'react';
import { GraduationCap, Search, User, Mail, Award, Briefcase, Landmark } from 'lucide-react';

const MOCK_ALUMNI = [
  { id: 1, name: 'Nguyễn Văn Hùng', role: 'Cựu Leader (2022-2023)', club: 'Multimedia Communication Club', email: 'hungnv@fpt.edu.vn', company: 'FPT Software', title: 'Senior UX Designer', year: 'Khóa 15' },
  { id: 2, name: 'Trần Thị Mai', role: 'Cựu Phó Chủ Nhiệm', club: 'Business Club', email: 'maitt@gmail.com', company: 'VinGroup', title: 'Marketing Manager', year: 'Khóa 16' },
  { id: 3, name: 'Lê Hoàng Nam', role: 'Cựu Trưởng Ban Kỹ Thuật', club: 'Software Engineering Club', email: 'namlh@outlook.com', company: 'Google Asia', title: 'Software Engineer', year: 'Khóa 14' },
  { id: 4, name: 'Phạm Minh Quân', role: 'Cựu Thủ Quỹ', club: 'Event Club', email: 'quanpm@fpt.com', company: 'Unilever', title: 'Event Specialist', year: 'Khóa 15' },
  { id: 5, name: 'Đặng Thùy Chi', role: 'Cựu Trưởng Ban Nhân Sự', club: 'Multimedia Communication Club', email: 'chidt@fpt.edu.vn', company: 'Shopee Vietnam', title: 'HR Generalist', year: 'Khóa 16' }
];

export default function AlumniSearch() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAlumni = MOCK_ALUMNI.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.club.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q)
    );
  });

  return (
    <div className="alumni-search-container">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header">
          <h3 className="glass-card-title"><GraduationCap size={18} /> Mạng lưới Cựu thành viên & Kết nối Thế hệ (Alumni Network)</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Tìm kiếm các thế hệ cựu thành viên xuất sắc của các CLB để kết nối học hỏi kinh nghiệm lập nghiệp.
        </p>
      </div>

      <div className="search-filter-row" style={{ marginBottom: '20px' }}>
        <div className="search-box" style={{ flex: 1 }}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="input-field"
            placeholder="Tìm theo tên cựu thành viên, câu lạc bộ, công ty đang làm việc..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {filteredAlumni.length === 0 ? (
          <div className="empty-state-view" style={{ gridColumn: '1 / -1' }}>
            <GraduationCap className="empty-state-icon" />
            <p>Không tìm thấy cựu thành viên nào phù hợp.</p>
          </div>
        ) : (
          filteredAlumni.map(alumni => (
            <div key={alumni.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>{alumni.name}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{alumni.year}</span>
                </div>
                <span className="badge badge-active" style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={10} /> {alumni.role}
                </span>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Landmark size={14} style={{ color: 'var(--primary)' }} />
                  <span>CLB cũ: <strong>{alumni.club}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Briefcase size={14} style={{ color: 'var(--success)' }} />
                  <span>Công việc: <strong>{alumni.title}</strong> tại <em>{alumni.company}</em></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} style={{ color: '#3b82f6' }} />
                  <span>Liên hệ: <a href={`mailto:${alumni.email}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>{alumni.email}</a></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
