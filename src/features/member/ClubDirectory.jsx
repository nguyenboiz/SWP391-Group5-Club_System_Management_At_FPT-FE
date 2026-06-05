import React, { useState } from 'react';
import { Landmark, Search, ExternalLink } from 'lucide-react';

export default function ClubDirectory({ dbData }) {
  const { clubs } = dbData;
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredClubs = clubs.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.intro.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="club-directory-container">
      {/* Header and Filter Row */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header">
          <h3 className="glass-card-title"><Landmark size={18} /> Khám phá các Câu lạc bộ Đại học FPT</h3>
        </div>

        <div className="search-filter-row">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Tìm câu lạc bộ theo tên, lĩnh vực..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select 
              className="select-field"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="ALL">Tất cả thể loại</option>
              <option value="Academic">Học thuật (Academic)</option>
              <option value="Arts">Nghệ thuật (Arts)</option>
              <option value="Sports">Thể thao (Sports)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clubs Grid Layout */}
      {filteredClubs.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <Landmark className="empty-state-icon" />
            <p>Không tìm thấy câu lạc bộ nào phù hợp với bộ lọc.</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredClubs.map(c => (
            <div key={c.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                <img 
                  src={c.logo} 
                  alt={c.name} 
                  style={{ width: '64px', height: '64px', borderRadius: '12px', border: '1px solid var(--border)', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '18px', color: 'var(--text-heading)' }}>{c.name}</h4>
                  <span className="badge badge-manager" style={{ marginTop: '4px' }}>{c.category}</span>
                </div>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '20px', flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {c.intro}
              </p>

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
          ))}
        </div>
      )}
    </div>
  );
}
