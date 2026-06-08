import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import Modal from '../../components/Modal';
import { Check, X, Eye, FileText, CheckCircle, Image as ImageIcon, AlertCircle } from 'lucide-react';

export default function EvidenceApproval({ dbData, triggerNotification }) {
  const { evidence, users, events, clubs } = dbData;
  const [selectedEvd, setSelectedEvd] = useState(null);
  const [adminRemark, setAdminRemark] = useState('');
  const [filterStatus, setFilterStatus] = useState('Pending');

  // Map user names and event names for list
  const getUsername = (userId) => {
    const u = users.find(user => user.id === userId);
    return u ? `${u.fullName} (${u.id})` : userId;
  };

  const getEventName = (eventId) => {
    if (!eventId) return 'Hoạt động CLB Chung';
    const e = events.find(event => event.id === eventId);
    return e ? e.name : eventId;
  };

  const getClubName = (clubId) => {
    const c = clubs.find(club => club.id === clubId);
    return c ? c.name : clubId;
  };

  const handleOpenDetail = (evd) => {
    setSelectedEvd(evd);
    setAdminRemark(evd.adminRemark || '');
  };

  const handleCloseDetail = () => {
    setSelectedEvd(null);
  };

  const handleApprove = () => {
    if (!selectedEvd) return;
    mockDb.updateEvidenceStatus(selectedEvd.id, 'Approved', adminRemark || 'Xác nhận hợp lệ.');
    triggerNotification('Phê duyệt minh chứng thành công!', 'success');
    handleCloseDetail();
  };

  const handleReject = () => {
    if (!selectedEvd) return;
    mockDb.updateEvidenceStatus(selectedEvd.id, 'Rejected', adminRemark || 'Từ chối: Minh chứng không hợp lệ.');
    triggerNotification('Đã từ chối minh chứng này!', 'error');
    handleCloseDetail();
  };

  const filteredEvidence = evidence.filter(e => e.status === filterStatus);

  return (
    <div className="evidence-approval-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><AlertCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Chờ duyệt</span>
            <span className="stats-value">
              {evidence.filter(e => e.status === 'Pending').length} tệp
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã duyệt</span>
            <span className="stats-value">
              {evidence.filter(e => e.status === 'Approved').length} tệp
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <h3 className="glass-card-title"><FileText size={18} /> Danh sách tham gia chờ duyệt</h3>
          
          <div className="role-switcher-container">
            <button 
              className={`role-switch-btn ${filterStatus === 'Pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Pending')}
            >
              Chờ duyệt ({evidence.filter(e => e.status === 'Pending').length})
            </button>
            <button 
              className={`role-switch-btn ${filterStatus === 'Approved' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Approved')}
            >
              Đã duyệt
            </button>
            <button 
              className={`role-switch-btn ${filterStatus === 'Rejected' ? 'active' : ''}`}
              onClick={() => setFilterStatus('Rejected')}
            >
              Bị từ chối
            </button>
          </div>
        </div>

        {filteredEvidence.length === 0 ? (
          <div className="empty-state-view">
            <ImageIcon className="empty-state-icon" />
            <p>Không có minh chứng nào ở trạng thái này.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Sinh viên</th>
                  <th>Câu lạc bộ</th>
                  <th>Sự kiện / Hoạt động</th>
                  <th>Thời gian nộp</th>
                  <th>Loại minh chứng</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvidence.map(e => (
                  <tr key={e.id}>
                    <td>
                      <strong>{getUsername(e.userId)}</strong>
                    </td>
                    <td>{getClubName(e.clubId)}</td>
                    <td>{getEventName(e.eventId)}</td>
                    <td>{new Date(e.submittedAt).toLocaleString('vi-VN')}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                        {e.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        e.status === 'Approved' ? 'badge-active' : e.status === 'Rejected' ? 'badge-blocked' : 'badge-pending'
                      }`}>
                        {e.status === 'Approved' ? 'Đã duyệt' : e.status === 'Rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenDetail(e)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={12} /> Xem & Duyệt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details approval modal */}
      {selectedEvd && (
        <Modal 
          isOpen={!!selectedEvd} 
          onClose={handleCloseDetail} 
          title={`Chi tiết - ${getEventName(selectedEvd.eventId)}`}
        >
          <div className="evidence-preview-container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Sinh viên nộp:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{getUsername(selectedEvd.userId)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Câu lạc bộ:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{getClubName(selectedEvd.clubId)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Loại tài liệu:</span>
                <div>{selectedEvd.type}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Thời gian:</span>
                <div>{new Date(selectedEvd.submittedAt).toLocaleString('vi-VN')}</div>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Tệp đính kèm:</span>
              {/* Image preview mock */}
              <img 
                src={selectedEvd.fileUrl} 
                alt="Evidence preview" 
                className="evidence-img-large"
              />
            </div>

            <div className="form-group">
              <label>Ghi chú / Nhận xét của PDP</label>
              <textarea 
                className="textarea-field"
                value={adminRemark}
                onChange={e => setAdminRemark(e.target.value)}
                placeholder="Nhập lý do từ chối hoặc lời phê duyệt tại đây..."
              />
            </div>

            {selectedEvd.status === 'Pending' ? (
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  className="btn btn-success" 
                  onClick={handleApprove}
                  style={{ flex: 1 }}
                >
                  <Check size={16} /> Duyệt
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleReject}
                  style={{ flex: 1 }}
                >
                  <X size={16} /> Từ chối
                </button>
              </div>
            ) : (
              <div>
                <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Trạng thái hiện tại:</span>
                  <div style={{ fontWeight: 600, marginTop: '2px', color: selectedEvd.status === 'Approved' ? 'var(--success)' : 'var(--error)' }}>
                    {selectedEvd.status === 'Approved' ? 'ĐÃ PHÊ DUYỆT' : 'ĐÃ TỪ CHỐI'}
                  </div>
                  {selectedEvd.adminRemark && (
                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Ý kiến phản hồi: </span>
                      {selectedEvd.adminRemark}
                    </div>
                  )}
                </div>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleCloseDetail}
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  Đóng cửa sổ
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
