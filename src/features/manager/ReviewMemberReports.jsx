import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

const statusConfig = {
  Approved: { label: 'Đã duyệt', className: 'badge-active', icon: <CheckCircle size={12} /> },
  Rejected: { label: 'Từ chối', className: 'badge-blocked', icon: <XCircle size={12} /> },
  Pending:  { label: 'Chờ duyệt', className: 'badge-member', icon: <Clock size={12} /> },
};

export default function ReviewMemberReports({ selectedClubId, triggerNotification }) {
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarkMap, setRemarkMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const syncReports = () => {
      const db = mockDb.getData();
      const list = (db.memberReports || []).filter(
        r => String(r.clubId) === String(selectedClubId)
      );
      // Báo cáo mới nhất lên đầu
      list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setReports(list);
    };
    syncReports();
    window.addEventListener('mockDbUpdate', syncReports);
    return () => window.removeEventListener('mockDbUpdate', syncReports);
  }, [selectedClubId]);

  const handleApprove = (id) => {
    const remark = remarkMap[id] || '';
    mockDb.updateMemberReportStatus(id, 'Approved', remark.trim());
    triggerNotification('Đã duyệt báo cáo thành công!', 'success');
    setExpandedId(null);
  };

  const handleReject = (id) => {
    const remark = remarkMap[id] || '';
    if (!remark.trim()) {
      triggerNotification('Vui lòng nhập lý do từ chối vào ghi chú!', 'warning');
      return;
    }
    mockDb.updateMemberReportStatus(id, 'Rejected', remark.trim());
    triggerNotification('Đã từ chối báo cáo!', 'error');
    setExpandedId(null);
  };

  const filteredReports = reports.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (r.title || '').toLowerCase().includes(q) || 
      (r.userFullName || '').toLowerCase().includes(q) || 
      (r.userId || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const approvedCount = reports.filter(r => r.status === 'Approved').length;
  const rejectedCount = reports.filter(r => r.status === 'Rejected').length;

  return (
    <div className="user-management-container">
      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stats-card" onClick={() => setFilterStatus('Pending')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--warning, #f59e0b)' }}><Clock size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Báo cáo chờ duyệt</span>
            <span className="stats-value">{pendingCount} báo cáo</span>
          </div>
        </div>
        <div className="stats-card" onClick={() => setFilterStatus('Approved')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã duyệt</span>
            <span className="stats-value">{approvedCount} báo cáo</span>
          </div>
        </div>
        <div className="stats-card" onClick={() => setFilterStatus('Rejected')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--error)' }}><XCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã từ chối</span>
            <span className="stats-value">{rejectedCount} báo cáo</span>
          </div>
        </div>
      </div>

      {/* Main Table/List */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h3 className="glass-card-title"><ClipboardList size={18} /> Phê duyệt báo cáo cá nhân của thành viên</h3>
        </div>

        <div className="search-filter-row">
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm theo tên thành viên, MSSV hoặc tiêu đề báo cáo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select className="select-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '180px' }}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
            </select>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="empty-state-view">
            <ClipboardList className="empty-state-icon" />
            <p>Không tìm thấy báo cáo nào.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {filteredReports.map(rep => {
              const isExpanded = expandedId === rep.id;
              const cfg = statusConfig[rep.status] || statusConfig.Pending;
              return (
                <div key={rep.id} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }} onClick={() => setExpandedId(isExpanded ? null : rep.id)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>{rep.userFullName}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({rep.userId})</span>
                        <span className={`badge ${cfg.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', padding: '2px 8px' }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 500 }}>
                        {rep.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Gửi lúc: {new Date(rep.submittedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpandedId(isExpanded ? null : rep.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isExpanded ? <>Đóng <ChevronUp size={14} /></> : <>Xem xét <ChevronDown size={14} /></>}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'pre-line', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        {rep.content}
                      </div>

                      {rep.status === 'Pending' ? (
                        <div>
                          <div className="form-group">
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MessageSquare size={12} /> Phản hồi &amp; Ghi chú của Leader (bắt buộc nếu từ chối)
                            </label>
                            <textarea
                              className="textarea-field"
                              placeholder="Nhập nhận xét hoặc lý do từ chối..."
                              rows={2}
                              value={remarkMap[rep.id] || ''}
                              onChange={e => setRemarkMap({ ...remarkMap, [rep.id]: e.target.value })}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(rep.id)}
                            >
                              Phê duyệt báo cáo
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleReject(rep.id)}
                            >
                              Từ chối báo cáo
                            </button>
                          </div>
                        </div>
                      ) : (
                        rep.leaderRemark && (
                          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid var(--primary)', color: 'var(--text-muted)' }}>
                            <strong>Phản hồi từ bạn:</strong> {rep.leaderRemark}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
