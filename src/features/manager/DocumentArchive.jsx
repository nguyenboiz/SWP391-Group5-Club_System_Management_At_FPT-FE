import React, { useState, useEffect, useCallback } from 'react';
import { uploadDocument, getDocumentsByClub, downloadDocument, deleteDocument, updateDocument, getDocumentDetail } from '../../services/documentService';
import { Folder, Upload, FileText, Globe, Lock, Download, Trash2, RefreshCw, Edit, X, Save, Eye } from 'lucide-react';

export default function DocumentArchive({ selectedClubId, triggerNotification, readOnly = false }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Upload form state
  const [docName, setDocName] = useState('');
  const [docTypeId, setDocTypeId] = useState('1'); // DocumentTypeId (số nguyên)
  const [eventId, setEventId] = useState('');
  const [accessLevel, setAccessLevel] = useState('Public');
  const [files, setFiles] = useState(null);

  // Edit document modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Detail document modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [docDetail, setDocDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [activeFolder, setActiveFolder] = useState('ALL');

  const backendClubId = selectedClubId;

  // Load tài liệu từ API
  const loadDocuments = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await getDocumentsByClub(backendClubId);
      setDocuments(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err) {
      console.error('[DocumentArchive] Lỗi tải tài liệu:', err);
      triggerNotification('Không tải được danh sách tài liệu!', 'error');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [backendClubId, triggerNotification]);

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
      formData.append('ClubId', backendClubId);
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

  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    if (!editingDoc) return;
    setIsUpdating(true);
    try {
      await updateDocument(editingDoc.id || editingDoc.documentId, {
        documentName: editingDoc.documentName,
        documentTypeId: Number(editingDoc.documentTypeId),
        eventId: editingDoc.eventId ? Number(editingDoc.eventId) : null,
        accessLevel: editingDoc.accessLevel
      });
      triggerNotification(`Đã cập nhật tài liệu thành công!`, 'success');
      setShowEditModal(false);
      setEditingDoc(null);
      await loadDocuments();
    } catch (err) {
      console.error('[DocumentArchive] Lỗi sửa tài liệu:', err);
      triggerNotification(err?.response?.data?.message || 'Cập nhật tài liệu thất bại!', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewDetail = async (doc) => {
    const docId = doc.id || doc.documentId;
    if (!docId) return;
    setShowDetailModal(true);
    setLoadingDetail(true);
    setDocDetail(null);
    try {
      const data = await getDocumentDetail(docId);
      setDocDetail(data?.data ?? data);
    } catch (err) {
      console.error('[DocumentArchive] Lỗi tải chi tiết tài liệu:', err);
      setDocDetail(doc);
    } finally {
      setLoadingDetail(false);
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
                <p>Thư mục trống. Không có tài liệu nào.</p>
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
                                onClick={() => handleViewDetail(d)}
                                title="Xem chi tiết"
                              >
                                <Eye size={12} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleDownload(d)}
                                title="Tải về"
                              >
                                <Download size={12} />
                              </button>
                              {!readOnly && (
                                <>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px' }}
                                    onClick={() => {
                                      setEditingDoc({
                                        id: dId,
                                        documentName: dName,
                                        documentTypeId: d.documentTypeId || d.typeId || 1,
                                        eventId: d.eventId || '',
                                        accessLevel: dAccess
                                      });
                                      setShowEditModal(true);
                                    }}
                                    title="Chỉnh sửa"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    className="btn btn-sm"
                                    style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.3)' }}
                                    onClick={() => handleDelete(d)}
                                    title="Xóa"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
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

        {/* Right Side: Upload Form / Details Panel */}
        {readOnly ? (
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Lock size={18} /> Lưu ý Quyền hạn</h3>
            </div>
            <div style={{ padding: '8px 0', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-main)' }}>
              <p>Kho tài liệu lưu trữ nội bộ của câu lạc bộ.</p>
              <p style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                * Chỉ <strong>Ban chủ nhiệm (Leader)</strong> của câu lạc bộ mới có quyền tải lên tài liệu mới hoặc thực hiện xóa tệp tin lưu trữ. Sinh viên là thành viên thông thường chỉ có quyền đọc trực tuyến hoặc tải xuống tài nguyên được chia sẻ.
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* EDIT DOCUMENT MODAL */}
      {showEditModal && editingDoc && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '480px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit size={16} style={{ marginRight: '6px' }} /> Sửa thông tin tài liệu</h3>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingDoc(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateDocument} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div className="form-group">
                <label>Tên tài liệu *</label>
                <input
                  type="text"
                  className="input-field"
                  value={editingDoc.documentName}
                  onChange={e => setEditingDoc({ ...editingDoc, documentName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phân loại Thư mục</label>
                <select
                  className="select-field"
                  value={editingDoc.documentTypeId}
                  onChange={e => setEditingDoc({ ...editingDoc, documentTypeId: e.target.value })}
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
                      name="edit-doc-access"
                      checked={editingDoc.accessLevel === 'Public'}
                      onChange={() => setEditingDoc({ ...editingDoc, accessLevel: 'Public' })}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>Công khai (Public)</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="edit-doc-access"
                      checked={editingDoc.accessLevel === 'Internal'}
                      onChange={() => setEditingDoc({ ...editingDoc, accessLevel: 'Internal' })}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span>Nội bộ (Internal)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled={isUpdating}>
                  <Save size={16} /> {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setEditingDoc(null); }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL DOCUMENT MODAL */}
      {showDetailModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title"><FileText size={18} style={{ marginRight: '6px' }} /> Chi tiết Tài liệu</h3>
              <button className="modal-close" onClick={() => { setShowDetailModal(false); setDocDetail(null); }}><X size={18} /></button>
            </div>
            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div className="login-spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : docDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {[
                  ['Tên tài liệu', docDetail.name || docDetail.documentName || 'N/A'],
                  ['Mã tài liệu', docDetail.id || docDetail.documentId || 'N/A'],
                  ['Phân loại thư mục', getDocType(docDetail)],
                  ['Cấp độ truy cập', <span className={`badge ${docDetail.accessLevel === 'Public' ? 'badge-active' : 'badge-blocked'}`}>{docDetail.accessLevel === 'Public' ? 'Công khai' : 'Nội bộ'}</span>],
                  ['Ngày tải lên', docDetail.uploadedAt || docDetail.createdAt ? new Date(docDetail.uploadedAt || docDetail.createdAt).toLocaleString('vi-VN') : 'N/A'],
                  ['Đính kèm sự kiện ID', docDetail.eventId || 'Không có'],
                  ['Đường dẫn file (URL)', docDetail.fileUrl ? <a href={docDetail.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Xem tệp</a> : 'N/A']
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ minWidth: '150px', fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-main)', wordBreak: 'break-all' }}>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>Không tải được thông tin tài liệu.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

