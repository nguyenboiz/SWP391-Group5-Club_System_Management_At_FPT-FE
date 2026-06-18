import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, Star, Award, AlertTriangle } from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

const statusConfig = {
  Appraised: { label: 'Đã chấm điểm', className: 'badge-active', icon: <CheckCircle size={12} /> },
  Submitted:  { label: 'Chờ chấm điểm', className: 'badge-member', icon: <Clock size={12} /> },
};

export default function ReviewClubReports({ triggerNotification }) {
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Submitted');
  const [searchQuery, setSearchQuery] = useState('');
  const [scoreMap, setScoreMap] = useState({});
  const [remarkMap, setRemarkMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const syncReports = () => {
    const db = mockDb.getData();
    const list = db.clubReports || [];
    // Thêm tên CLB từ db.clubs nếu không có sẵn
    const enriched = list.map(r => {
      const club = db.clubs.find(c => String(c.id) === String(r.clubId));
      return {
        ...r,
        clubName: club ? club.name || club.clubName : `CLB #${r.clubId}`
      };
    });
    // Báo cáo mới nhất lên đầu
    enriched.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    setReports(enriched);
  };

  useEffect(() => {
    syncReports();
    window.addEventListener('mockDbUpdate', syncReports);
    return () => window.removeEventListener('mockDbUpdate', syncReports);
  }, []);

  const handleAppraise = (id) => {
    const score = parseInt(scoreMap[id], 10);
    const remark = remarkMap[id] || '';
    if (isNaN(score) || score < 0 || score > 100) {
      triggerNotification('Vui lòng nhập điểm đánh giá từ 0–100!', 'warning');
      return;
    }

    mockDb.appraiseReport(id, score, remark.trim());
    triggerNotification('Đã chấm điểm báo cáo câu lạc bộ thành công!', 'success');
    setExpandedId(null);
  };

  const filteredReports = reports.filter(r => {
    const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      (r.clubName || '').toLowerCase().includes(q) || 
      (r.content || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = reports.filter(r => r.status === 'Submitted').length;
  const appraisedCount = reports.filter(r => r.status === 'Appraised').length;

  return (
    <div className="user-management-container">
      {/* Mock notice */}
      <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.2)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <AlertTriangle size={13} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span><strong style={{ color: 'var(--warning)' }}>Vai trò Manager:</strong> Nhận và chấm điểm báo cáo hoạt động của các CLB (chờ BE bổ sung API <code>GET/PUT /api/club-reports</code>).</span>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stats-card" onClick={() => setFilterStatus('Submitted')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--warning)' }}><Clock size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Báo cáo chờ chấm điểm</span>
            <span className="stats-value">{pendingCount} báo cáo</span>
          </div>
        </div>
        <div className="stats-card" onClick={() => setFilterStatus('Appraised')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã chấm điểm</span>
            <span className="stats-value">{appraisedCount} báo cáo</span>
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

        {filteredReports.length === 0 ? (
          <div className="empty-state-view">
            <ClipboardList className="empty-state-icon" />
            <p>Không tìm thấy báo cáo CLB nào.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {filteredReports.map(rep => {
              const isExpanded = expandedId === rep.id;
              const cfg = statusConfig[rep.status] || statusConfig.Submitted;
              return (
                <div key={rep.id} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }} onClick={() => setExpandedId(isExpanded ? null : rep.id)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '15px' }}>{rep.clubName}</span>
                        <span className={`badge ${cfg.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', padding: '2px 8px' }}>
                          {cfg.icon} {cfg.label}
                        </span>
                        {rep.score !== null && rep.score !== undefined && (
                          <span className="badge badge-active" style={{ fontSize: '10px' }}>{rep.score}/100 điểm</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Học kỳ: {rep.semesterId || 'SU26'} · Số sự kiện: {rep.eventCount} · Số thành viên: {rep.memberCount}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Nộp lúc: {new Date(rep.submittedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpandedId(isExpanded ? null : rep.id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isExpanded ? <>Đóng <ChevronUp size={14} /></> : <>Xem & Chấm <ChevronDown size={14} /></>}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'pre-line', lineHeight: 1.6, background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                        {rep.content}
                      </div>

                      {rep.status === 'Submitted' ? (
                        <div>
                          <div className="form-group" style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Star size={14} style={{ color: 'var(--primary)' }} />
                              Nhập điểm đánh giá (0–100):
                            </label>
                            <input
                              type="number"
                              className="input-field"
                              min={0} max={100}
                              placeholder="Ví dụ: 85, 90..."
                              value={scoreMap[rep.id] || ''}
                              onChange={e => setScoreMap({ ...scoreMap, [rep.id]: e.target.value })}
                              style={{ maxWidth: '120px' }}
                            />
                          </div>

                          <div className="form-group">
                            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nhận xét / Phản hồi của Manager:</label>
                            <textarea
                              className="textarea-field"
                              placeholder="Nhập nhận xét hoạt động..."
                              rows={2}
                              value={remarkMap[rep.id] || ''}
                              onChange={e => setRemarkMap({ ...remarkMap, [rep.id]: e.target.value })}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleAppraise(rep.id)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Award size={14} /> Xác nhận và Chấm điểm
                            </button>
                          </div>
                        </div>
                      ) : (
                        rep.adminRemark && (
                          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid var(--primary)', color: 'var(--text-muted)' }}>
                            <strong>Nhận xét từ bạn:</strong> {rep.adminRemark}
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
