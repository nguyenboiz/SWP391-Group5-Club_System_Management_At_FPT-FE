import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Clock, AlertTriangle, Send, Bell, Plus, XCircle, Star } from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

// NOTE: BE chưa có các API sau, giữ mock tạm thời:
//   - GET  /api/club-reports              (danh sách báo cáo CLB)
//   - PUT  /api/club-reports/{id}/appraise (chấm điểm)
//   - GET  /api/announcements
//   - POST /api/announcements

const MOCK_CLUB_REPORTS = [
  {
    id: 'cr-001', clubId: 1, clubName: 'FCode Club',
    periodName: 'Báo cáo Giữa kỳ Summer 2026',
    leaderName: 'Phạm Minh Đức', leaderId: 'SE180222',
    submittedAt: '2026-06-12T14:00:00',
    status: 'Pending',
    content: 'CLB đã tổ chức thành công 3 buổi workshop React, Hackathon nội bộ với 47 thành viên tham gia. Tổng điểm hoạt động đạt 85/100. Khó khăn: thiếu phòng họp vào cuối tuần. Đề xuất: nhà trường hỗ trợ phòng thực hành thứ 7.',
    activityCount: 3, memberCount: 47, score: null,
  },
  {
    id: 'cr-002', clubId: 2, clubName: 'Melody Club',
    periodName: 'Báo cáo Giữa kỳ Summer 2026',
    leaderName: 'Trần Thị Lan', leaderId: 'SE190400',
    submittedAt: '2026-06-11T10:00:00',
    status: 'Approved',
    content: 'CLB tổ chức 2 buổi biểu diễn tại hội trường A và sân khấu ngoài trời, thu hút hơn 200 sinh viên tham dự. Đã hoàn thành kế hoạch học kỳ. CLB đạt danh hiệu "Câu lạc bộ xuất sắc" kỳ Spring 2026.',
    activityCount: 2, memberCount: 31, score: 92,
    approvedBy: 'Nguyễn Việt Hoàng (PDP01)',
    approvedAt: '2026-06-13T09:00:00',
  },
  {
    id: 'cr-003', clubId: 3, clubName: 'FPT Chess Club',
    periodName: 'Báo cáo Giữa kỳ Summer 2026',
    leaderName: 'Nguyễn Hà Hải', leaderId: 'SE180333',
    submittedAt: '2026-06-14T16:00:00',
    status: 'Pending',
    content: 'CLB tổ chức giải đấu cờ vua nội bộ với 24 thành viên tham gia. Đã kết nghĩa với CLB cờ vua ĐH Hà Nội và dự kiến giao lưu vào tháng 7. Đề xuất tài trợ bộ cờ mới cho phòng tập.',
    activityCount: 1, memberCount: 24, score: null,
  },
];

export default function ReportAppraisal({ triggerNotification }) {
  const [activeTab, setActiveTab] = useState('appraisal');
  const [reports, setReports] = useState(MOCK_CLUB_REPORTS);
  const [scoreMap, setScoreMap] = useState({});
  const [remarkMap, setRemarkMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  // Announcements (mockDb)
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '' });

  useEffect(() => {
    const syncAnn = () => {
      const db = mockDb.getData();
      setAnnouncements(db.announcements || []);
    };
    syncAnn();
    window.addEventListener('mockDbUpdate', syncAnn);
    return () => window.removeEventListener('mockDbUpdate', syncAnn);
  }, []);

  const handleAppraise = (report) => {
    const score = parseInt(scoreMap[report.id]);
    if (!score || score < 0 || score > 100) {
      triggerNotification('Vui lòng nhập điểm từ 0–100!', 'warning');
      return;
    }
    // TODO: thay bằng PUT /api/club-reports/{id}/appraise khi BE bổ sung
    setReports(prev => prev.map(r =>
      r.id === report.id
        ? { ...r, status: 'Approved', score, approvedBy: 'Bạn (Admin)', approvedAt: new Date().toISOString() }
        : r
    ));
    triggerNotification(`Đã chấm điểm ${score}/100 cho "${report.clubName}"! (Mock - Chờ BE API)`, 'success');
    setExpandedId(null);
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!newAnn.title.trim() || !newAnn.content.trim()) {
      triggerNotification('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!', 'warning');
      return;
    }
    mockDb.addAnnouncement({ title: newAnn.title.trim(), content: newAnn.content.trim() });
    triggerNotification('Đã đăng thông báo thành công! (Mock - Chờ BE API)', 'success');
    setNewAnn({ title: '', content: '' });
  };

  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const approvedCount = reports.filter(r => r.status === 'Approved').length;

  return (
    <div className="report-appraisal-container">
      {/* Mock notice */}
      <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.2)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <AlertTriangle size={13} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span><strong style={{ color: 'var(--warning)' }}>Mock Data:</strong> Dữ liệu báo cáo CLB mẫu — Yêu cầu BE bổ sung: <code>GET/PUT /api/club-reports</code></span>
      </div>

      {/* Tab Switcher */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '6px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`role-switch-btn ${activeTab === 'appraisal' ? 'active' : ''}`} onClick={() => setActiveTab('appraisal')}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FileText size={14} /> Thẩm định Báo cáo CLB ({pendingCount} chờ)
          </button>
          <button className={`role-switch-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Bell size={14} /> Gửi Thông báo hệ thống
          </button>
        </div>
      </div>

      {activeTab === 'appraisal' ? (
        <>
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--warning)' }}><Clock size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Chờ thẩm định</span>
                <span className="stats-value" style={{ color: pendingCount > 0 ? 'var(--warning)' : undefined }}>{pendingCount}</span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Đã thẩm định</span>
                <span className="stats-value">{approvedCount}</span>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><FileText size={18} /> Danh sách Báo cáo CLB ({reports.length})</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {reports.map(report => {
                const isExpanded = expandedId === report.id;
                return (
                  <div key={report.id} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: `1px solid ${report.status === 'Pending' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '15px' }}>{report.clubName}</span>
                          {report.status === 'Pending' && <span className="badge badge-member"><Clock size={10} /> Chờ thẩm định</span>}
                          {report.status === 'Approved' && <span className="badge badge-active"><CheckCircle size={10} /> Đã thẩm định — {report.score}/100 điểm</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>👤 {report.leaderName} ({report.leaderId})</span>
                          <span>📅 {report.periodName}</span>
                          <span>🕐 {new Date(report.submittedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                          <span>📋 {report.activityCount} hoạt động</span>
                          <span>👥 {report.memberCount} thành viên</span>
                        </div>
                      </div>
                      {report.status === 'Pending' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(isExpanded ? null : report.id)}>
                          {isExpanded ? 'Đóng' : 'Xem & Chấm'}
                        </button>
                      )}
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-line' }}>
                          {report.content}
                        </div>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Star size={14} style={{ color: 'var(--primary)' }} />
                            Điểm đánh giá (0–100):
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            min={0} max={100}
                            placeholder="Nhập điểm 0–100..."
                            value={scoreMap[report.id] || ''}
                            onChange={e => setScoreMap(m => ({ ...m, [report.id]: e.target.value }))}
                            style={{ maxWidth: '150px' }}
                          />
                        </div>
                        <button
                          className="btn btn-success"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                          onClick={() => handleAppraise(report)}
                        >
                          <Award size={16} /> Xác nhận Thẩm định & Chấm điểm
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="dashboard-grid-2col">
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Plus size={18} /> Phát hành Thông báo mới</h3>
            </div>
            <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tiêu đề thông báo *</label>
                <input type="text" className="input-field" value={newAnn.title} onChange={e => setNewAnn({ ...newAnn, title: e.target.value })} placeholder="Nhập tiêu đề thông báo..." required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nội dung chi tiết *</label>
                <textarea className="textarea-field" value={newAnn.content} onChange={e => setNewAnn({ ...newAnn, content: e.target.value })} placeholder="Nhập nội dung thông báo gửi đến các CLB..." rows={6} required />
              </div>
              <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
                * Thông báo hiện lưu tạm trong phiên làm việc. Cần BE bổ sung <code>POST /api/announcements</code>.
              </div>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} /> Đăng và Phát hành
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Bell size={18} /> Thông báo đã phát hành ({announcements.length})</h3>
            </div>
            {announcements.length === 0 ? (
              <div className="empty-state-view">
                <Bell className="empty-state-icon" />
                <p>Chưa có thông báo nào.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {announcements.map(ann => (
                  <div key={ann.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px', marginBottom: '6px' }}>{ann.title}</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '8px', whiteSpace: 'pre-line' }}>"{ann.content}"</p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      {new Date(ann.createdAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
