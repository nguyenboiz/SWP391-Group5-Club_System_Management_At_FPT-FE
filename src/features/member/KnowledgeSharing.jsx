import React, { useState, useEffect, useCallback } from 'react';
import { getDocumentsByClub } from '../../services/documentService';
import { BookOpen, Search, Download, Eye, RefreshCw } from 'lucide-react';

export default function KnowledgeSharing({ selectedClubId, triggerNotification }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const docTypeMap = {
    '1': 'Proposal', '2': 'Script', '3': 'Report Template', '4': 'Other',
  };

  const getDocType = (doc) => {
    const typeId = String(doc.documentTypeId || doc.typeId || '');
    return docTypeMap[typeId] || doc.type || doc.documentType || 'Other';
  };

  const loadDocuments = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await getDocumentsByClub(selectedClubId);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      // Filter only Public documents
      setDocuments(list.filter(d => (d.accessLevel || d.visibility) === 'Public'));
    } catch (err) {
      console.error('[KnowledgeSharing] Lỗi tải tài liệu:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const filteredDocs = documents.filter(d => {
    const name = (d.documentName || d.name || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'ALL' || getDocType(d) === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="knowledge-sharing-container">
      {/* Search Header panel */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title"><BookOpen size={18} /> Thư viện Chia sẻ Tri thức & Tài liệu Kế thừa</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadDocuments}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tổng hợp các Proposal xuất sắc, kịch bản mẫu chương trình và tài liệu học thuật được câu lạc bộ công khai chia sẻ. Click để tải về tham khảo.
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
      {loading ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
            <p style={{ marginTop: '10px' }}>Đang tải tài liệu...</p>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <BookOpen className="empty-state-icon" />
            <p>Không tìm thấy tài liệu công khai nào phù hợp.</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredDocs.map((d, idx) => {
            const dId = d.id || d.documentId;
            const dName = d.documentName || d.name || 'Tài liệu';
            const dType = getDocType(d);
            const dUrl = d.fileUrl || d.url || '#';
            const dDate = d.uploadedAt || d.createdAt;
            return (
              <div key={dId || idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-manager">{dType}</span>
                  {dDate && (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(dDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: '15px', color: 'var(--text-heading)', minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '10px' }}>
                  {dName}
                </h4>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { if (dUrl !== '#') window.open(dUrl, '_blank'); }}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                  >
                    <Eye size={12} /> Đọc trực tuyến
                  </button>
                  <button
                    onClick={() => {
                      if (dUrl !== '#') {
                        window.open(dUrl, '_blank');
                        if (triggerNotification) triggerNotification(`Bắt đầu tải xuống: ${dName}`, 'success');
                      }
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
                  >
                    <Download size={12} /> Tải xuống
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
