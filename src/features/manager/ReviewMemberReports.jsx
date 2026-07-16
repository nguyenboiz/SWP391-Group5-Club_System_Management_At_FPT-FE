import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Search, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Star, Award, AlertTriangle, RefreshCw } from 'lucide-react';
import * as clubReportService from '../../services/clubReportService';

const getStatusConfig = (status) => {
  const s = String(status || '');
  if (s === 'Chờ Manager duyệt' || s === 'Submitted' || s === 'Pending' || s === 'Chờ duyệt') {
    return { label: 'Chờ Manager duyệt', className: 'badge-member', icon: <Clock size={12} /> };
  }
  if (s === 'Chờ Admin duyệt') {
    return { label: 'Chờ Admin duyệt', className: 'badge-active', style: { backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6' }, icon: <Clock size={12} /> };
  }
  if (s === 'Đã duyệt' || s === 'Approved' || s === 'Appraised') {
    return { label: 'Đã duyệt hoàn toàn', className: 'badge-active', icon: <CheckCircle size={12} /> };
  }
  if (s === 'Từ chối' || s === 'Rejected' || s === 'Bị từ chối') {
    return { label: 'Bị từ chối', className: 'badge-blocked', icon: <XCircle size={12} /> };
  }
  return { label: s || 'Chờ duyệt', className: 'badge-member', icon: <Clock size={12} /> };
};

export default function ReviewClubReports({ triggerNotification }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreMap, setScoreMap] = useState({});
  const [remarkMap, setRemarkMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const syncReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clubReportService.getClubReports();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      // Mới nhất lên đầu
      list.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
      setReports(list);
    } catch (err) {
      console.error('[ReviewClubReports] Lỗi tải báo cáo:', err);
      triggerNotification('Không tải được danh sách báo cáo hoạt động!', 'error');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    syncReports();
  }, [syncReports]);

  const handleManagerReview = async (id, actionStatus) => {
    const remark = remarkMap[id] || '';
    if (actionStatus === 'Từ chối' && !remark.trim()) {
      triggerNotification('❌ Vui lòng nhập lý do nhận xét khi từ chối báo cáo!', 'warning');
      return;
    }

    try {
      await clubReportService.managerReviewClubReport(id, {
        status: actionStatus,
        managerNote: remark.trim() || 'Manager đã duyệt báo cáo.'
      });
      triggerNotification(`✅ Đã duyệt báo cáo thành công với trạng thái: ${actionStatus}!`, 'success');
      setExpandedId(null);
      await syncReports();
    } catch (err) {
      console.error('[ReviewClubReports] Lỗi duyệt báo cáo:', err);
      triggerNotification(err?.response?.data?.message || 'Duyệt báo cáo thất bại!', 'error');
    }
  };

  const filteredReports = reports.filter(r => {
    const isPending = r.status === 'Chờ Manager duyệt' || r.status === 'Submitted' || r.status === 'Pending' || r.status === 'Chờ duyệt';
    const isReviewed = r.status === 'Chờ Admin duyệt' || r.status === 'Đã duyệt' || r.status === 'Approved' || r.status === 'Appraised' || r.status === 'Từ chối' || r.status === 'Rejected';
    
    let matchesStatus = true;
    if (filterStatus === 'Submitted') {
      matchesStatus = isPending;
    } else if (filterStatus === 'Appraised') {
      matchesStatus = isReviewed;
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (r.clubName || '').toLowerCase().includes(q) || 
      (r.reportTitle || r.summaryContent || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = reports.filter(r => r.status === 'Chờ Manager duyệt' || r.status === 'Submitted' || r.status === 'Pending' || r.status === 'Chờ duyệt').length;
  const reviewedCount = reports.filter(r => r.status === 'Chờ Admin duyệt' || r.status === 'Đã duyệt' || r.status === 'Approved' || r.status === 'Appraised' || r.status === 'Từ chối' || r.status === 'Rejected').length;

  return (
    <div className="user-management-container">
      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stats-card" onClick={() => setFilterStatus('Submitted')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--warning)' }}><Clock size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Báo cáo chờ duyệt</span>
            <span className="stats-value">{pendingCount} báo cáo</span>
          </div>
        </div>
        <div className="stats-card" onClick={() => setFilterStatus('Appraised')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã xem xét</span>
            <span className="stats-value">{reviewedCount} báo cáo</span>
          </div>
        </div>
      </div>

      {/* Main Table/List */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h3 className="glass-card-title"><ClipboardList size={18} /> Phê duyệt báo cáo hoạt động Câu lạc bộ</h3>
        </div>

        <div className="search-filter-row">
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm theo tên CLB hoặc nội dung báo cáo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select className="select-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '180px' }}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Submitted">Chờ chấm điểm</option>
              <option value="Appraised">Đã chấm điểm</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="empty-state-view">
            <ClipboardList className="empty-state-icon" />
            <p>Không tìm thấy báo cáo CLB nào.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {filteredReports.map(rep => {
              const repId = rep.clubReportId || rep.id;
              const isExpanded = expandedId === repId;
              const isPending = rep.status === 'Chờ Manager duyệt' || rep.status === 'Submitted' || rep.status === 'Pending' || rep.status === 'Chờ duyệt';
              const cfg = getStatusConfig(rep.status);
              
              return (
                <div key={repId} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }} onClick={() => setExpandedId(isExpanded ? null : repId)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '15px' }}>{rep.clubName}</span>
                        <span className={`badge ${cfg.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', padding: '2px 8px', ...cfg.style }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Học kỳ: {rep.reportPeriodName || 'SU26'} · Số sự kiện: {rep.totalEventsHeld || 0} · Tiêu đề: {rep.reportTitle}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Nộp lúc: {rep.submittedAt ? new Date(rep.submittedAt).toLocaleString('vi-VN') : '—'}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpandedId(isExpanded ? null : repId)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isExpanded ? <>Đóng <ChevronUp size={14} /></> : <>Xem & Duyệt <ChevronDown size={14} /></>}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'pre-line', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        {rep.summaryContent || rep.content}
                      </div>

                      {isPending ? (
                        <div>
                          <div className="form-group">
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nhận xét / Phản hồi của Manager (bắt buộc khi Từ chối):</label>
                            <textarea
                              className="textarea-field"
                              placeholder="Nhập nhận xét hoặc lý do từ chối..."
                              rows={2}
                              value={remarkMap[repId] || ''}
                              onChange={e => setRemarkMap({ ...remarkMap, [repId]: e.target.value })}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleManagerReview(repId, 'Chờ Admin duyệt')}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <CheckCircle size={14} /> Duyệt & Gửi lên Admin
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleManagerReview(repId, 'Từ chối')}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <XCircle size={14} /> Từ chối báo cáo
                            </button>
                          </div>
                        </div>
                      ) : (
                        (rep.managerNote || rep.icpdpFeedback) && (
                          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid var(--primary)', color: 'var(--text-muted)' }}>
                            <strong>Nhận xét từ bạn:</strong> {rep.managerNote || rep.icpdpFeedback}
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
