import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { BookOpen, Search, Download, Eye, FileText, ExternalLink } from 'lucide-react';

export default function KnowledgeSharing({ dbData, triggerNotification }) {
  const { documents, clubs } = dbData;
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Filter only PUBLIC documents
  const publicDocs = documents.filter(d => d.visibility === 'Public');

  const getClubName = (clubId) => {
    const c = clubs.find(club => club.id === clubId);
    return c ? c.name : clubId;
  };

  const handleDocAction = (docId, docName, docUrl, actionType) => {
    mockDb.incrementDocCounters(docId, actionType);
    if (actionType === 'download') {
      triggerNotification(`Bắt đầu tải xuống tài liệu: ${docName}`, 'success');
      window.open(docUrl, '_blank');
    }
  };

  const filteredDocs = publicDocs.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="knowledge-sharing-container">
      {/* Search Header panel */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header">
          <h3 className="glass-card-title"><BookOpen size={18} /> Thư viện Chia sẻ Tri thức & Tài liệu Kế thừa</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tổng hợp toàn bộ các Proposal xuất sắc, kịch bản mẫu chương trình và tài liệu học thuật được các câu lạc bộ công khai chia sẻ rộng rãi. Click để tải về tham khảo.
        </p>

        <div className="search-filter-row">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Tìm kiếm tài liệu học tập, proposal mẫu, kịch bản..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select 
              className="select-field"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="ALL">Tất cả tài liệu</option>
              <option value="Proposal">Bản Proposal mẫu</option>
              <option value="Script">Kịch bản chi tiết mẫu</option>
              <option value="Report Template">Mẫu báo cáo kỳ</option>
              <option value="Other">Các tài nguyên khác</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Shared Files */}
      {filteredDocs.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <BookOpen className="empty-state-icon" />
            <p>Không tìm thấy tài liệu phù hợp.</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredDocs.map(d => (
            <div key={d.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge badge-manager">{d.type}</span>
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                  {getClubName(d.clubId).split(' - ')[0]}
                </span>
              </div>

              <h4 style={{ fontSize: '15px', color: 'var(--text-heading)', minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '10px' }}>
                {d.name}
              </h4>

              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Eye size={12} /> {d.viewCount} lượt xem</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Download size={12} /> {d.downloadCount} lượt tải</span>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleDocAction(d.id, d.name, d.url, 'view')}
                  className="btn btn-secondary" 
                  style={{ flex: 1, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                >
                  <Eye size={12} /> Đọc trực tuyến
                </button>
                <button 
                  onClick={() => handleDocAction(d.id, d.name, d.url, 'download')}
                  className="btn btn-primary" 
                  style={{ flex: 1, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                >
                  <Download size={12} /> Tải xuống
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
