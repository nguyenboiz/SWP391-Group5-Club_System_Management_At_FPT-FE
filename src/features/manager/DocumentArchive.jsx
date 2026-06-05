import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { Folder, Upload, FileText, Globe, Lock, Eye, Download, Plus } from 'lucide-react';

export default function DocumentArchive({ dbData, selectedClubId, triggerNotification }) {
  const { documents } = dbData;
  const [newDoc, setNewDoc] = useState({ name: '', type: 'Proposal', url: '', visibility: 'Public' });
  const [activeFolder, setActiveFolder] = useState('ALL');

  const clubDocs = documents.filter(d => d.clubId === selectedClubId);

  const handleUploadDoc = (e) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.url) {
      triggerNotification('Vui lòng nhập tên tài liệu và đường dẫn liên kết!', 'warning');
      return;
    }

    mockDb.addDocument({
      clubId: selectedClubId,
      name: newDoc.name,
      type: newDoc.type,
      url: newDoc.url,
      visibility: newDoc.visibility
    });

    triggerNotification(`Đã tải lên tài liệu: ${newDoc.name}`, 'success');
    setNewDoc({ name: '', type: 'Proposal', url: '', visibility: 'Public' });
  };

  const filteredDocs = clubDocs.filter(d => activeFolder === 'ALL' || d.type === activeFolder);

  const folders = [
    { key: 'ALL', name: 'Tất cả tài liệu' },
    { key: 'Proposal', name: 'Thư mục Proposal (Kế hoạch)' },
    { key: 'Script', name: 'Thư mục Kịch bản mẫu (Script)' },
    { key: 'Report Template', name: 'Thư mục Báo cáo (Report)' },
    { key: 'Other', name: 'Tài liệu khác' }
  ];

  return (
    <div className="document-archive-container">
      <div className="dashboard-grid-2col">
        {/* Left Side: Folder explorer and document listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Folders navigation */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Folder size={18} /> Thư mục kế thừa</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {folders.map(f => {
                const count = f.key === 'ALL' ? clubDocs.length : clubDocs.filter(d => d.type === f.key).length;
                return (
                  <div 
                    key={f.key}
                    className={`nav-item ${activeFolder === f.key ? 'active' : ''}`}
                    onClick={() => setActiveFolder(f.key)}
                    style={{ justifyContent: 'space-between', padding: '10px 14px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Folder size={16} style={{ color: activeFolder === f.key ? 'var(--primary)' : 'var(--text-muted)' }} />
                      <span>{f.name}</span>
                    </div>
                    <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Document list */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><FileText size={18} /> Tệp tin lưu trữ</h3>
            </div>

            {filteredDocs.length === 0 ? (
              <div className="empty-state-view">
                <FileText className="empty-state-icon" />
                <p>Thư mục trống. Hãy tải lên tài liệu đầu tiên của CLB.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tên tài liệu</th>
                      <th>Ngày tải</th>
                      <th>Quyền hạn</th>
                      <th>Thống kê</th>
                      <th>Tải về</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(d => (
                      <tr key={d.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={14} style={{ color: 'var(--primary)' }} /> {d.name}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phân loại: {d.type}</div>
                        </td>
                        <td>{d.uploadedAt}</td>
                        <td>
                          <span className={`badge ${d.visibility === 'Public' ? 'badge-public' : 'badge-internal'}`}>
                            {d.visibility === 'Public' ? (
                              <><Globe size={10} style={{ marginRight: '4px' }} /> Công khai</>
                            ) : (
                              <><Lock size={10} style={{ marginRight: '4px' }} /> Nội bộ</>
                            )}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', marginRight: '8px' }}><Eye size={10} /> {d.viewCount}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}><Download size={10} /> {d.downloadCount}</span>
                          </div>
                        </td>
                        <td>
                          <a 
                            href={d.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => mockDb.incrementDocCounters(d.id, 'download')}
                          >
                            <Download size={12} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Upload Form */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Upload size={18} /> Tải tài liệu lên kho lưu trữ</h3>
          </div>

          <form onSubmit={handleUploadDoc}>
            <div className="form-group">
              <label>Tên tài liệu / giáo trình</label>
              <input 
                type="text" 
                className="input-field" 
                value={newDoc.name}
                onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                placeholder="Kịch bản họp báo K19 / Proposal xin ngân sách..."
                required
              />
            </div>

            <div className="form-group">
              <label>Phân loại Folder lưu trữ</label>
              <select 
                className="select-field"
                value={newDoc.type}
                onChange={e => setNewDoc({ ...newDoc, type: e.target.value })}
              >
                <option value="Proposal">Thư mục Proposal (Kế hoạch)</option>
                <option value="Script">Thư mục Kịch bản mẫu (Script)</option>
                <option value="Report Template">Thư mục Báo cáo (Report)</option>
                <option value="Other">Khác (Other)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Liên kết Tệp tin (Google Drive / FPT Cloud Link)</label>
              <input 
                type="url" 
                className="input-field" 
                value={newDoc.url}
                onChange={e => setNewDoc({ ...newDoc, url: e.target.value })}
                placeholder="https://drive.google.com/file/d/..."
                required
              />
            </div>

            <div className="form-group">
              <label>Quyền truy cập (Confidentiality)</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="doc-visibility" 
                    checked={newDoc.visibility === 'Public'}
                    onChange={() => setNewDoc({ ...newDoc, visibility: 'Public' })}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Công khai (Public)</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="doc-visibility" 
                    checked={newDoc.visibility === 'Internal'}
                    onChange={() => setNewDoc({ ...newDoc, visibility: 'Internal' })}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Nội bộ (Internal)</span>
                </label>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                Tài liệu "Công khai" sẽ hiển thị trong thư viện tri thức chung dành cho toàn bộ sinh viên trong trường đọc & tham khảo.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Upload size={16} /> Tải tài liệu lên hệ thống
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
