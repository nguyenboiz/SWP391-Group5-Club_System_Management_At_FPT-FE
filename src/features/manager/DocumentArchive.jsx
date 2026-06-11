import React, { useState, useEffect, useCallback } from 'react';
import { uploadDocument, getDocumentsByClub, downloadDocument, deleteDocument } from '../../services/documentService';
import { Folder, Upload, FileText, Globe, Lock, Download, Trash2, RefreshCw } from 'lucide-react';

export default function DocumentArchive({ dbData, selectedClubId, triggerNotification }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Upload form state
  const [docName, setDocName] = useState('');
  const [docTypeId, setDocTypeId] = useState('1'); // DocumentTypeId (số nguyên)
  const [eventId, setEventId] = useState('');
  const [accessLevel, setAccessLevel] = useState('Public');
  const [files, setFiles] = useState(null);

  const [activeFolder, setActiveFolder] = useState('ALL');

  // Load tài liệu từ API
  const loadDocuments = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await getDocumentsByClub(selectedClubId);
      setDocuments(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err) {
      console.error('[DocumentArchive] Lỗi tải tài liệu:', err);
      triggerNotification('Không tải được danh sách tài liệu!', 'error');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId, triggerNotification]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      triggerNotification('Vui lòng chọn ít nhất một tệp tin để tải lên!', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('ClubId', selectedClubId);
      formData.append('DocumentTypeId', docTypeId);
      if (eventId) formData.append('EventId', eventId);
      formData.append('AccessLevel', accessLevel);
      Array.from(files).forEach(file => {
        formData.append('Files', file);
      });

      await uploadDocument(formData);
      triggerNotification(`Đã tải lên tài liệu thành công!`, 'success');

      // Reset form
      setDocName('');
      setDocTypeId('1');
      setEventId('');
      setAccessLevel('Public');
      setFiles(null);
      // Reset file input
      const fileInput = document.getElementById('doc-file-input');
      if (fileInput) fileInput.value = '';

      await loadDocuments();
    } catch (err) {
      console.error('[DocumentArchive] Lỗi upload tài liệu:', err);
      triggerNotification(
        err?.response?.data?.message || 'Tải lên tài liệu thất bại. Vui lòng thử lại!',
        'error'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    const docId = doc.id || doc.documentId;
    try {
      const response = await downloadDocument(docId);
      // Tạo blob URL và trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.name || doc.documentName || `document-${docId}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      triggerNotification('Đang tải tệp tin...', 'success');
    } catch (err) {
      console.error('[DocumentArchive] Lỗi download:', err);
      triggerNotification('Không thể tải tài liệu. Vui lòng thử lại!', 'error');
    }
  };

  const handleDelete = async (doc) => {
    const docId = doc.id || doc.documentId;
    const docName = doc.name || doc.documentName;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${docName}"?`)) return;
    try {
      await deleteDocument(docId);
      triggerNotification(`Đã xóa tài liệu: ${docName}`, 'success');
      await loadDocuments();
    } catch (err) {
      console.error('[DocumentArchive] Lỗi xóa tài liệu:', err);
      triggerNotification(
        err?.response?.data?.message || 'Xóa tài liệu thất bại!',
        'error'
      );
    }
  };

  // Map DocumentTypeId → tên folder (tuỳ chỉnh theo BE)
  const docTypeMap = {
    '1': 'Proposal',
    '2': 'Script',
    '3': 'Report Template',
    '4': 'Other',
  };

  const getDocType = (doc) => {
    const typeId = String(doc.documentTypeId || doc.typeId || '');
    return docTypeMap[typeId] || doc.type || doc.documentType || 'Other';
  };

  const folders = [
    { key: 'ALL', name: 'Tất cả tài liệu' },
    { key: 'Proposal', name: 'Thư mục Proposal (Kế hoạch)' },
    { key: 'Script', name: 'Thư mục Kịch bản mẫu (Script)' },
    { key: 'Report Template', name: 'Thư mục Báo cáo (Report)' },
    { key: 'Other', name: 'Tài liệu khác' }
  ];

  const filteredDocs = documents.filter(d =>
    activeFolder === 'ALL' || getDocType(d) === activeFolder
  );

  const getCount = (folderKey) =>
    folderKey === 'ALL' ? documents.length : documents.filter(d => getDocType(d) === folderKey).length;

  return (
    <div className="document-archive-container">
      <div className="dashboard-grid-2col">
        {/* Left Side: Folder explorer and document listing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Folders navigation */}
          <div className="glass-card">
            <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="glass-card-title"><Folder size={18} /> Thư mục kế thừa</h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={loadDocuments}
                disabled={loading}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {folders.map(f => (
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
                  <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>{getCount(f.key)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Document list */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><FileText size={18} /> Tệp tin lưu trữ</h3>
            </div>

            {loading ? (
              <div className="empty-state-view">
                <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
                <p style={{ marginTop: '10px' }}>Đang tải...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
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
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map(d => {
                      const dId = d.id || d.documentId;
                      const dName = d.name || d.documentName;
                      const dAccess = d.accessLevel || d.visibility;
                      const dDate = d.uploadedAt || d.createdAt || '';
                      const dType = getDocType(d);
                      return (
                        <tr key={dId}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FileText size={14} style={{ color: 'var(--primary)' }} /> {dName}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phân loại: {dType}</div>
                          </td>
                          <td>{dDate ? new Date(dDate).toLocaleDateString('vi-VN') : '—'}</td>
                          <td>
                            <span className={`badge ${dAccess === 'Public' ? 'badge-public' : 'badge-internal'}`}>
                              {dAccess === 'Public' ? (
                                <><Globe size={10} style={{ marginRight: '4px' }} /> Công khai</>
                              ) : (
                                <><Lock size={10} style={{ marginRight: '4px' }} /> Nội bộ</>
                              )}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleDownload(d)}
                                title="Tải về"
                              >
                                <Download size={12} />
                              </button>
                              <button
                                className="btn btn-sm"
                                style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}
                                onClick={() => handleDelete(d)}
                                title="Xóa"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
              <label>Phân loại Folder lưu trữ</label>
              <select
                className="select-field"
                value={docTypeId}
                onChange={e => setDocTypeId(e.target.value)}
              >
                <option value="1">Thư mục Proposal (Kế hoạch)</option>
                <option value="2">Thư mục Kịch bản mẫu (Script)</option>
                <option value="3">Thư mục Báo cáo (Report)</option>
                <option value="4">Khác (Other)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Quyền truy cập (Access Level)</label>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="doc-access"
                    checked={accessLevel === 'Public'}
                    onChange={() => setAccessLevel('Public')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Công khai (Public)</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="doc-access"
                    checked={accessLevel === 'Internal'}
                    onChange={() => setAccessLevel('Internal')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <span>Nội bộ (Internal)</span>
                </label>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                Tài liệu "Công khai" sẽ hiển thị trong thư viện tri thức chung dành cho toàn bộ sinh viên.
              </span>
            </div>

            <div className="form-group">
              <label>Tệp tin đính kèm <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                id="doc-file-input"
                type="file"
                className="input-field"
                multiple
                onChange={e => setFiles(e.target.files)}
                style={{ padding: '8px' }}
                required
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Có thể chọn nhiều tệp cùng lúc.
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              disabled={isUploading}
            >
              {isUploading ? (
                <span className="login-spinner" />
              ) : (
                <><Upload size={16} /> Tải tài liệu lên hệ thống</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
