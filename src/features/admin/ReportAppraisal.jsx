import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Clock, AlertTriangle, Send, Bell, Plus, XCircle, Star, RefreshCw } from 'lucide-react';
import * as clubReportService from '../../services/clubReportService';
import * as notificationService from '../../services/notificationService';

export default function ReportAppraisal({ triggerNotification }) {
  const [activeTab, setActiveTab] = useState('appraisal');
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [scoreMap, setScoreMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  // Report detailed data cache
  const [reportDetails, setReportDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '' });

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await clubReportService.getClubReports();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setReports(list);
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi tải báo cáo từ Backend:', err);
      triggerNotification('Không tải được danh sách báo cáo hoạt động từ máy chủ!', 'error');
    } finally {
      setLoadingReports(false);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await notificationService.getNotifications();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setAnnouncements(list);
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi tải danh sách thông báo:', err);
    }
  };

  useEffect(() => {
    loadReports();
    loadAnnouncements();
  }, []);

  const handleExpand = async (reportId) => {
    if (expandedId === reportId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(reportId);

    // If detail is not cached yet, fetch from API
    if (!reportDetails[reportId]) {
      setLoadingDetails(prev => ({ ...prev, [reportId]: true }));
      try {
        const data = await clubReportService.getClubReportDetail(reportId);
        setReportDetails(prev => ({ ...prev, [reportId]: data?.data ?? data }));
      } catch (err) {
        console.error('[ReportAppraisal] Lỗi tải chi tiết báo cáo:', err);
      } finally {
        setLoadingDetails(prev => ({ ...prev, [reportId]: false }));
      }
    }
  };

  const handleAppraise = async (report) => {
    const score = parseInt(scoreMap[report.clubReportId || report.id]);
    if (isNaN(score) || score < 0 || score > 100) {
      triggerNotification('Vui lòng nhập điểm đánh giá từ 0–100!', 'warning');
      return;
    }
    const reportId = report.clubReportId || report.id;
    try {
      await clubReportService.reviewClubReport(reportId, {
        status: 'Đã duyệt',
        icpdpFeedback: `Điểm: ${score}. Đã duyệt từ Admin.`
      });
      triggerNotification(`Đã duyệt và đánh giá báo cáo: ${score}/100 điểm!`, 'success');
      setExpandedId(null);
      await loadReports();
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi duyệt báo cáo:', err);
      triggerNotification(err?.response?.data?.message || 'Phê duyệt báo cáo thất bại!', 'error');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnn.title.trim() || !newAnn.content.trim()) {
      triggerNotification('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!', 'warning');
      return;
    }
    try {
      await notificationService.createNotification({
        title: newAnn.title.trim(),
        content: newAnn.content.trim(),
        targetType: 'All', // Toàn hệ thống
        notificationType: 'System'
      });
      triggerNotification('Đã phát hành thông báo toàn hệ thống thành công!', 'success');
      setNewAnn({ title: '', content: '' });
      await loadAnnouncements();
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi tạo thông báo:', err);
      triggerNotification(err?.response?.data?.message || 'Phát hành thông báo thất bại!', 'error');
    }
  };

  const pendingCount = reports.filter(r => r.status === 'Submitted' || r.status === 'Chờ duyệt').length;
  const approvedCount = reports.filter(r => r.status === 'Approved' || r.status === 'Đã duyệt').length;

  return (
    <div className="report-appraisal-container">
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
              {loadingReports ? (
                <div className="empty-state-view">
                  <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
                </div>
              ) : reports.length === 0 ? (
                <div className="empty-state-view">
                  <FileText className="empty-state-icon" />
                  <p>Chưa có báo cáo nào gửi lên.</p>
                </div>
              ) : (
                reports.map(report => {
                  const repId = report.clubReportId || report.id;
                  const isExpanded = expandedId === repId;
                  const isPending = report.status === 'Submitted' || report.status === 'Chờ duyệt' || report.status === 'Pending';
                  const isApproved = report.status === 'Approved' || report.status === 'Đã duyệt';
                  
                  return (
                    <div key={repId} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: `1px solid ${isPending ? 'rgba(245,158,11,0.3)' : 'var(--border)'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '15px' }}>
                              {report.reportTitle || report.reportPeriodName || report.periodName}
                            </span>
                            {isPending && <span className="badge badge-member"><Clock size={10} /> Chờ phê duyệt</span>}
                            {isApproved && <span className="badge badge-active"><CheckCircle size={10} /> Đã duyệt</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <span>🏢 Câu lạc bộ: <strong>{report.clubName} ({report.clubCode})</strong></span>
                            <span>🕐 Nộp lúc: {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                          </div>
                          {report.managerNote && (
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              📝 Nhận xét của Manager: <em>"{report.managerNote}"</em>
                            </div>
                          )}
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleExpand(repId)}>
                          {isExpanded ? 'Đóng' : 'Xem chi tiết'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                          {loadingDetails[repId] ? (
                            <div style={{ textAlign: 'center', padding: '16px' }}>
                              <span className="login-spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                            </div>
                          ) : (
                            <>
                              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-line' }}>
                                <strong>Nội dung báo cáo:</strong>
                                <p style={{ marginTop: '6px' }}>
                                  {(reportDetails[repId]?.summaryContent || reportDetails[repId]?.content || report.summaryContent || report.content)}
                                </p>
                              </div>

                              {isPending ? (
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
                                      value={scoreMap[repId] || ''}
                                      onChange={e => setScoreMap(m => ({ ...m, [repId]: e.target.value }))}
                                      style={{ maxWidth: '150px' }}
                                    />
                                  </div>
                                  <button
                                    className="btn btn-success btn-sm"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                    onClick={() => handleAppraise(report)}
                                  >
                                    <Award size={16} /> Phê duyệt & Chấm điểm
                                  </button>
                                </div>
                              ) : (
                                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(34,197,94,0.05)', fontSize: '12px', borderLeft: '3px solid var(--success)', color: 'var(--text-muted)' }}>
                                  Báo cáo đã duyệt thành công. Phản hồi: <strong>{report.icpdpFeedback || reportDetails[repId]?.icpdpFeedback || 'Không có phản hồi'}</strong> {report.reviewedAt && `vào ${new Date(report.reviewedAt).toLocaleDateString('vi-VN')}`}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
