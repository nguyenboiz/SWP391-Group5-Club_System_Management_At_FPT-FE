import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Clock, AlertTriangle, Send, Bell, Plus, XCircle, Star } from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

// Thay bằng báo cáo tổng hợp từ Manager theo đúng đặc tả vai trò Admin
const MOCK_MANAGER_SUMMARY_REPORTS = [
  {
    id: 'msr-001',
    managerName: 'Nguyễn Việt Hoàng',
    managerId: 'manager01',
    periodName: 'Báo cáo Giữa kỳ Summer 2026',
    submittedAt: '2026-06-12T14:00:00',
    status: 'Pending',
    content: 'TỔNG HỢP HOẠT ĐỘNG CLB KỲ SUMMER 2026 (GIỮA KỲ):\n- Tổng số CLB hoạt động ổn định: 6/6 CLB.\n- Tổng số sự kiện đã tổ chức: 8 sự kiện. Nổi bật nhất là Workshop React của JS Club thu hút 40+ sinh viên.\n- Khó khăn: Thiếu thốn cơ sở vật chất phòng Lab Gamma vào cuối tuần do trùng lịch học quân sự.\n- Đề xuất: PDP hỗ trợ cấp thêm 2 phòng thực hành tự do vào thứ 7 và Chủ nhật cho sinh viên sinh hoạt học thuật.',
    clubCount: 6,
    eventCount: 8,
    score: null,
  },
  {
    id: 'msr-002',
    managerName: 'Trần Thị Lan',
    managerId: 'manager02',
    periodName: 'Báo cáo Cuối kỳ Spring 2026',
    submittedAt: '2026-04-20T10:00:00',
    status: 'Approved',
    content: 'TỔNG HỢP CUỐI KỲ SPRING 2026:\n- Tất cả các CLB đã nộp báo cáo đầy đủ.\n- 5/6 CLB đạt điểm đánh giá A (Xuất sắc).\n- Đã bàn giao xong tài liệu hướng dẫn chuyển giao Leader kỳ tiếp theo.\n- Melody Club đạt giải thưởng CLB hoạt động tích cực nhất học kỳ.',
    clubCount: 6,
    eventCount: 15,
    score: 95,
    approvedBy: 'Hệ thống (Admin)',
    approvedAt: '2026-04-22T09:00:00',
  }
];

export default function ReportAppraisal({ triggerNotification }) {
  const [activeTab, setActiveTab] = useState('appraisal');
  const [reports, setReports] = useState(MOCK_MANAGER_SUMMARY_REPORTS);
  const [scoreMap, setScoreMap] = useState({});
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
      triggerNotification('Vui lòng nhập điểm đánh giá từ 0–100!', 'warning');
      return;
    }
    setReports(prev => prev.map(r =>
      r.id === report.id
        ? { ...r, status: 'Approved', score, approvedBy: 'Bạn (Admin)', approvedAt: new Date().toISOString() }
        : r
    ));
    triggerNotification(`Đã duyệt và đánh giá báo cáo tổng hợp: ${score}/100 điểm! (Mock)`, 'success');
    setExpandedId(null);
  };

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!newAnn.title.trim() || !newAnn.content.trim()) {
      triggerNotification('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!', 'warning');
      return;
    }
    mockDb.addAnnouncement({ title: newAnn.title.trim(), content: newAnn.content.trim() });
    triggerNotification('Đã phát hành thông báo toàn hệ thống thành công! (Mock)', 'success');
    setNewAnn({ title: '', content: '' });
  };

  const pendingCount = reports.filter(r => r.status === 'Pending').length;
  const approvedCount = reports.filter(r => r.status === 'Approved').length;

  return (
    <div className="report-appraisal-container">
      {/* Mock notice */}
      <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.2)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <AlertTriangle size={13} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span><strong style={{ color: 'var(--warning)' }}>Vai trò Admin:</strong> Đang xem và duyệt báo cáo tổng hợp hệ thống từ các Manager (chờ BE cung cấp API <code>GET /api/manager-reports</code>).</span>
      </div>

      {/* Tab Switcher */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '6px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`role-switch-btn ${activeTab === 'appraisal' ? 'active' : ''}`} onClick={() => setActiveTab('appraisal')}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FileText size={14} /> Báo cáo tổng hợp từ Manager ({pendingCount} chờ)
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
                <span className="stats-label">Chờ phê duyệt</span>
                <span className="stats-value" style={{ color: pendingCount > 0 ? 'var(--warning)' : undefined }}>{pendingCount} báo cáo</span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Đã phê duyệt</span>
                <span className="stats-value">{approvedCount} báo cáo</span>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><FileText size={18} /> Danh sách Báo cáo tổng hợp từ Manager ({reports.length})</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {reports.map(report => {
                const isExpanded = expandedId === report.id;
                return (
                  <div key={report.id} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: `1px solid ${report.status === 'Pending' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '15px' }}>{report.periodName}</span>
                          {report.status === 'Pending' && <span className="badge badge-member"><Clock size={10} /> Chờ phê duyệt</span>}
                          {report.status === 'Approved' && <span className="badge badge-active"><CheckCircle size={10} /> Đã duyệt — {report.score}/100 điểm</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <span>👤 Người báo cáo: Manager {report.managerName} ({report.managerId})</span>
                          <span>🕐 Gửi ngày: {new Date(report.submittedAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                          <span>📋 Số CLB giám sát: {report.clubCount} CLB</span>
                          <span>🚀 Số sự kiện tổng kết: {report.eventCount} sự kiện</span>
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(isExpanded ? null : report.id)}>
                        {isExpanded ? 'Đóng' : 'Xem chi tiết'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-line' }}>
                          {report.content}
                        </div>
                        
                        {report.status === 'Pending' ? (
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
                                placeholder="Nhập điểm..."
                                value={scoreMap[report.id] || ''}
                                onChange={e => setScoreMap(m => ({ ...m, [report.id]: e.target.value }))}
                                style={{ maxWidth: '150px' }}
                              />
                            </div>
                            <button
                              className="btn btn-success btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                              onClick={() => handleAppraise(report)}
                            >
                              <Award size={16} /> Xác nhận Phê duyệt & Chấm điểm
                            </button>
                          </div>
                        ) : (
                          <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(34,197,94,0.05)', fontSize: '12px', borderLeft: '3px solid var(--success)', color: 'var(--text-muted)' }}>
                            Báo cáo đã được phê duyệt bởi: <strong>{report.approvedBy}</strong> ngày {new Date(report.approvedAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
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
              <h3 className="glass-card-title"><Plus size={18} /> Phát hành Thông báo hệ thống</h3>
            </div>
            <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Tiêu đề thông báo *</label>
                <input type="text" className="input-field" value={newAnn.title} onChange={e => setNewAnn({ ...newAnn, title: e.target.value })} placeholder="Nhập tiêu đề thông báo..." required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Nội dung thông báo toàn hệ thống *</label>
                <textarea className="textarea-field" value={newAnn.content} onChange={e => setNewAnn({ ...newAnn, content: e.target.value })} placeholder="Nhập nội dung thông báo gửi đến toàn bộ CLB và Sinh viên..." rows={6} required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Send size={16} /> Đăng & Phát hành
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
