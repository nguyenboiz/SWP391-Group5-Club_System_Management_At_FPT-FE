import React, { useState, useEffect } from 'react';
import { Award, FileText, CheckCircle, Clock, AlertTriangle, Send, Bell, Plus, XCircle, RefreshCw, Calendar } from 'lucide-react';
import * as clubReportService from '../../services/clubReportService';
import * as notificationService from '../../services/notificationService';
import * as reportPeriodService from '../../services/reportPeriodService';
import * as semesterService from '../../services/semesterService';

export default function ReportAppraisal({ triggerNotification }) {
  const [activeTab, setActiveTab] = useState('appraisal'); // appraisal, periods, announcements
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [scoreMap, setScoreMap] = useState({});
  const [rejectionNotes, setRejectionNotes] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  // Report detailed data cache
  const [reportDetails, setReportDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ title: '', content: '' });

  // Report Periods and Semesters
  const [periods, setPeriods] = useState([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [semesters, setSemesters] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  
  const [newPeriod, setNewPeriod] = useState({
    semesterId: '',
    periodName: '',
    description: '',
    deadline: ''
  });
  const [submittingPeriod, setSubmittingPeriod] = useState(false);

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

  const loadPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const res = await reportPeriodService.getReportPeriods();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setPeriods(list);
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi tải đợt báo cáo:', err);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const loadSemesters = async () => {
    setLoadingSemesters(true);
    try {
      const res = await semesterService.getSemesters();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      setSemesters(list);
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi tải học kỳ:', err);
    } finally {
      setLoadingSemesters(false);
    }
  };

  useEffect(() => {
    loadReports();
    loadAnnouncements();
    loadPeriods();
    loadSemesters();
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

  const handleAppraise = async (report, statusToSubmit) => {
    const reportId = report.clubReportId || report.id;
    const rejectionNote = rejectionNotes[reportId] || '';

    if (statusToSubmit === 'Từ chối') {
      if (!rejectionNote.trim()) {
        triggerNotification('❌ Vui lòng nhập lý do từ chối!', 'warning');
        return;
      }
    }

    try {
      await clubReportService.reviewClubReport(reportId, {
        status: statusToSubmit,
        icpdpFeedback: statusToSubmit === 'Đã duyệt'
          ? 'Đã duyệt từ Admin.'
          : rejectionNote.trim()
      });
      triggerNotification(
        statusToSubmit === 'Đã duyệt'
          ? '✅ Đã phê duyệt báo cáo thành công!'
          : '❌ Đã từ chối báo cáo thành công!',
        'success'
      );
      setExpandedId(null);
      await loadReports();
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi duyệt báo cáo:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.title;
      if (status === 403) triggerNotification('❌ Bạn không có quyền duyệt báo cáo này!', 'error');
      else if (status === 404) triggerNotification('❌ Không tìm thấy báo cáo này!', 'error');
      else triggerNotification(`❌ Thao tác thất bại: ${serverMsg || 'Lỗi máy chủ!'}`, 'error');
    }
  };

  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    if (!newPeriod.semesterId) {
      triggerNotification('❌ Vui lòng chọn học kỳ!', 'warning');
      return;
    }
    if (!newPeriod.periodName.trim()) {
      triggerNotification('❌ Vui lòng nhập tên đợt báo cáo!', 'warning');
      return;
    }
    if (!newPeriod.deadline) {
      triggerNotification('❌ Vui lòng chọn hạn nộp!', 'warning');
      return;
    }

    setSubmittingPeriod(true);
    try {
      await reportPeriodService.createReportPeriod({
        semesterId: parseInt(newPeriod.semesterId, 10),
        periodName: newPeriod.periodName.trim(),
        description: newPeriod.description.trim(),
        deadline: newPeriod.deadline
      });
      triggerNotification('✅ Tạo đợt báo cáo mới thành công!', 'success');
      setNewPeriod({ semesterId: '', periodName: '', description: '', deadline: '' });
      await loadPeriods();
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi tạo đợt báo cáo:', err);
      triggerNotification(err?.response?.data?.message || 'Tạo đợt báo cáo thất bại!', 'error');
    } finally {
      setSubmittingPeriod(false);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnn.title.trim()) {
      triggerNotification('❌ Vui lòng nhập Tiêu đề thông báo!', 'warning');
      return;
    }
    if (newAnn.title.trim().length < 5) {
      triggerNotification('❌ Tiêu đề thông báo phải có ít nhất 5 ký tự!', 'warning');
      return;
    }
    if (!newAnn.content.trim()) {
      triggerNotification('❌ Vui lòng nhập Nội dung thông báo!', 'warning');
      return;
    }
    if (newAnn.content.trim().length < 10) {
      triggerNotification('❌ Nội dung thông báo quá ngắn, phải có ít nhất 10 ký tự!', 'warning');
      return;
    }
    try {
      await notificationService.createNotification({
        title: newAnn.title.trim(),
        content: newAnn.content.trim(),
        targetType: 'Toàn hệ thống',
        notificationType: 'Hệ thống'
      });
      triggerNotification('✅ Đã phát hành thông báo toàn hệ thống thành công!', 'success');
      setNewAnn({ title: '', content: '' });
      await loadAnnouncements();
    } catch (err) {
      console.error('[ReportAppraisal] Lỗi tạo thông báo:', err);
    }
  };

  const pendingCount = reports.filter(r => r.status === 'Chờ Admin duyệt' || r.status === 'Submitted' || r.status === 'Pending').length;
      const approvedCount = reports.filter(r => r.status === 'Đã duyệt' || r.status === 'Approved').length;

      return (
        <div className="report-appraisal-container">
          {/* Tab Switcher */}
          <div className="glass-card" style={{ marginBottom: '24px', padding: '6px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className={`role-switch-btn ${activeTab === 'appraisal' ? 'active' : ''}`} onClick={() => setActiveTab('appraisal')}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <FileText size={14} /> Báo cáo tổng hợp từ Manager ({pendingCount} chờ)
              </button>
              <button className={`role-switch-btn ${activeTab === 'periods' ? 'active' : ''}`} onClick={() => setActiveTab('periods')}
                style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Calendar size={14} /> Quản lý Đợt Báo cáo
              </button>
            </div>
          </div>

          {activeTab === 'appraisal' && (
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
                  <h3 className="glass-card-title"><FileText size={18} /> Danh sách Báo cáo hoạt động CLB ({reports.length})</h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  {loadingReports ? (
                    <div className="empty-state-view">
                      <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
                    </div>
                  ) : (
                    reports.map(report => {
                      const repId = report.clubReportId || report.id;
                      const isExpanded = expandedId === repId;
                      const status = report.status;
                      const isPendingAdmin = status === 'Chờ Admin duyệt' || status === 'Submitted' || status === 'Pending' || status === 'Chờ duyệt';
                      const isApproved = status === 'Đã duyệt' || status === 'Approved';
                      const isRejected = status === 'Từ chối' || status === 'Rejected';
                      const isPendingManager = status === 'Chờ Manager duyệt';
                      
                      return (
                        <div key={repId} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: `1px solid ${isPendingAdmin ? 'rgba(245,158,11,0.3)' : 'var(--border)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '15px' }}>
                                  {report.reportTitle || report.reportPeriodName || report.periodName}
                                </span>
                                {isPendingAdmin && <span className="badge badge-admin"><Clock size={10} /> Đã gửi Admin (Chờ duyệt)</span>}
                                {isPendingManager && <span className="badge badge-manager"><Clock size={10} /> Chờ Manager duyệt</span>}
                                {isApproved && <span className="badge badge-active"><CheckCircle size={10} /> Đã duyệt</span>}
                                {isRejected && <span className="badge badge-blocked"><XCircle size={10} /> Từ chối</span>}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <span>🏢 Câu lạc bộ: <strong>{report.clubName} ({report.clubCode})</strong></span>
                                <span>🕐 Nộp lúc: {report.submittedAt ? new Date(report.submittedAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                              </div>
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
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <span style={{ minWidth: '150px', fontSize: '12px', color: 'var(--text-muted)' }}>Số sự kiện tổ chức:</span>
                                      <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{reportDetails[repId]?.totalEventsHeld || report.totalEventsHeld || 0}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <span style={{ minWidth: '150px', fontSize: '12px', color: 'var(--text-muted)' }}>Số dư tài chính (VND):</span>
                                      <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                                        {reportDetails[repId]?.financialBalance !== undefined 
                                          ? reportDetails[repId]?.financialBalance.toLocaleString('vi-VN') 
                                          : (report.financialBalance !== undefined ? report.financialBalance.toLocaleString('vi-VN') : '0')}
                                      </span>
                                    </div>
                                  </div>

                                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-main)', lineHeight: 1.7, marginBottom: '16px', whiteSpace: 'pre-line' }}>
                                    <strong>Nội dung tóm tắt báo cáo:</strong>
                                    <p style={{ marginTop: '6px' }}>
                                      {(reportDetails[repId]?.summaryContent || reportDetails[repId]?.content || report.summaryContent || report.content)}
                                    </p>
                                  </div>

                                  {status === 'Chờ Admin duyệt' ? (
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                                      <div className="form-group" style={{ marginBottom: '12px' }}>
                                        <label>Phản hồi của Admin / Lý do từ chối (bắt buộc khi Từ chối):</label>
                                        <textarea
                                          className="textarea-field"
                                          placeholder="Nhập phản hồi phê duyệt hoặc lý do từ chối..."
                                          rows={2}
                                          value={rejectionNotes[repId] || ''}
                                          onChange={e => setRejectionNotes(m => ({ ...m, [repId]: e.target.value }))}
                                        />
                                      </div>

                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                          className="btn btn-success btn-sm"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                          onClick={() => handleAppraise(report, 'Đã duyệt')}
                                        >
                                          <Award size={16} /> Phê duyệt
                                        </button>
                                        <button
                                          className="btn btn-danger btn-sm"
                                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                          onClick={() => handleAppraise(report, 'Từ chối')}
                                        >
                                          <XCircle size={16} /> Từ chối
                                        </button>
                                      </div>
                                    </div>
                                  ) : isPendingManager ? (
                                    <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(245,158,11,0.05)', fontSize: '12.5px', borderLeft: '3px solid var(--warning)', color: 'var(--text-muted)' }}>
                                      ⚠️ Báo cáo này đang chờ Manager duyệt sơ bộ. Bạn chỉ được phép chấm điểm &amp; duyệt sau khi Manager đã thông qua.
                                    </div>
                                  ) : isRejected ? (
                                    <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.05)', fontSize: '12.5px', borderLeft: '3px solid var(--error)', color: 'var(--text-muted)' }}>
                                      ❌ Báo cáo đã bị Admin từ chối. Lý do phản hồi: <strong>{report.icpdpFeedback || reportDetails[repId]?.icpdpFeedback || '—'}</strong>
                                    </div>
                                  ) : (
                                    <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(34,197,94,0.05)', fontSize: '12px', borderLeft: '3px solid var(--success)', color: 'var(--text-muted)' }}>
                                      ✅ Báo cáo đã duyệt thành công. Phản hồi/Điểm số: <strong>{report.icpdpFeedback || reportDetails[repId]?.icpdpFeedback || 'Không có phản hồi'}</strong> {report.reviewedAt && `vào ${new Date(report.reviewedAt).toLocaleDateString('vi-VN')}`}
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
          )}

          {activeTab === 'periods' && (
            <div className="dashboard-grid-2col">
              <div className="glass-card">
                <div className="glass-card-header">
                  <h3 className="glass-card-title"><Plus size={18} /> Tạo Đợt Báo Cáo Mới</h3>
                </div>
                <form onSubmit={handleCreatePeriod} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Học kỳ *</label>
                    <select 
                      className="select-field" 
                      value={newPeriod.semesterId} 
                      onChange={e => setNewPeriod({ ...newPeriod, semesterId: e.target.value })} 
                      required
                    >
                      <option value="">-- Chọn Học kỳ --</option>
                      {semesters.map(s => (
                        <option key={s.semesterId} value={s.semesterId}>
                          {s.semesterName} ({s.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Tên đợt báo cáo *</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      value={newPeriod.periodName} 
                      onChange={e => setNewPeriod({ ...newPeriod, periodName: e.target.value })} 
                      placeholder="Ví dụ: Báo cáo cuối học kỳ" 
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Hạn nộp báo cáo *</label>
                    <input 
                      type="datetime-local" 
                      className="input-field" 
                      value={newPeriod.deadline} 
                      onChange={e => setNewPeriod({ ...newPeriod, deadline: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Nội dung mô tả / Yêu cầu</label>
                    <textarea 
                      className="textarea-field" 
                      value={newPeriod.description} 
                      onChange={e => setNewPeriod({ ...newPeriod, description: e.target.value })} 
                      placeholder="Yêu cầu các CLB báo cáo tài chính, tổng số hoạt động..." 
                      rows={4} 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={submittingPeriod} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <Send size={16} /> {submittingPeriod ? 'Đang tạo...' : 'Tạo & Phát hành đợt nộp'}
                  </button>
                </form>
              </div>

              <div className="glass-card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <div className="glass-card-header">
                  <h3 className="glass-card-title"><Calendar size={18} /> Danh sách Đợt Báo cáo ({periods.length})</h3>
                </div>
                {periods.length === 0 ? (
                  <div className="empty-state-view">
                    <Calendar className="empty-state-icon" />
                    <p>Chưa có đợt báo cáo nào được tạo.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                    {periods.map(p => (
                      <div key={p.reportPeriodId || p.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>
                            {p.periodName}
                          </span>
                          <span className="badge badge-active" style={{ fontSize: '10px' }}>{p.status}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          🏫 Học kỳ: <strong>{p.semester?.semesterName || `ID ${p.semesterId}`}</strong><br />
                          ⏰ Hạn nộp: <strong style={{ color: 'var(--warning)' }}>{p.deadline ? new Date(p.deadline).toLocaleString('vi-VN') : '—'}</strong>
                        </div>
                        {p.description && (
                          <p style={{ fontSize: '12.5px', color: 'var(--text-main)', fontStyle: 'italic', marginBottom: 0, whiteSpace: 'pre-line' }}>
                            "{p.description}"
                          </p>
                        )}
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
