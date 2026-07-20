import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Plus, FileText, Send, Clock, CheckCircle, XCircle, RefreshCw, X, HelpCircle } from 'lucide-react';
import * as clubReportService from '../../services/clubReportService';
import * as reportPeriodService from '../../services/reportPeriodService';
import * as semesterService from '../../services/semesterService';

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

export default function ClubReportSubmission({ selectedClubId, triggerNotification }) {
  const [reports, setReports] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // Submit Form State
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [summaryContent, setSummaryContent] = useState('');
  const [totalEvents, setTotalEvents] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const loadData = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    
    // 1. Fetch submitted reports of this club
    try {
      const reportsRes = await clubReportService.getClubReports({ clubId: selectedClubId });
      const reportsList = Array.isArray(reportsRes) ? reportsRes : (reportsRes?.data ?? []);
      // Sort newest first
      reportsList.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
      setReports(reportsList);
    } catch (err) {
      console.warn('[ClubReportSubmission] Lỗi tải lịch sử báo cáo CLB (có thể chưa có dữ liệu):', err?.response?.status, err?.response?.data?.message || err?.message);
      setReports([]);
    }

    // 2. Fetch report periods of active semesters
    try {
      const semestersRes = await semesterService.getSemesters();
      const semestersList = Array.isArray(semestersRes) ? semestersRes : (semestersRes?.data ?? []);
      let activeSemesterId = null;
      if (semestersList.length > 0) {
        const activeSem = semestersList.find(s => s.status === 'Active' || s.status === 'ActiveSemester') || semestersList[0];
        activeSemesterId = activeSem.id;
      }
      
      if (activeSemesterId) {
        const periodsRes = await reportPeriodService.getReportPeriods(activeSemesterId);
        const periodsList = Array.isArray(periodsRes) ? periodsRes : (periodsRes?.data ?? []);
        setPeriods(periodsList);
      } else {
        setPeriods([]);
      }
    } catch (err) {
      console.warn('[ClubReportSubmission] Lỗi tải đợt báo cáo:', err?.response?.status, err?.response?.data?.message || err?.message);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId, triggerNotification]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!selectedPeriodId) errors.selectedPeriodId = 'Vui lòng chọn đợt báo cáo!';
    if (!reportTitle.trim()) errors.reportTitle = 'Tiêu đề báo cáo không được trống!';
    if (!summaryContent.trim()) errors.summaryContent = 'Nội dung tóm tắt không được trống!';
    if (isNaN(totalEvents) || parseInt(totalEvents, 10) < 0) {
      errors.totalEvents = 'Số lượng sự kiện phải là số không âm!';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSubmitting(true);
    try {
      await clubReportService.createClubReport({
        clubId: selectedClubId,
        reportPeriodId: parseInt(selectedPeriodId, 10),
        reportTitle: reportTitle.trim(),
        summaryContent: summaryContent.trim(),
        totalEventsHeld: parseInt(totalEvents, 10),
      });

      triggerNotification('✅ Gửi báo cáo lên hệ thống thành công!', 'success');
      setShowSubmitModal(false);
      // Reset form
      setSelectedPeriodId('');
      setReportTitle('');
      setSummaryContent('');
      setTotalEvents('0');
      
      // Reload reports list
      await loadData();
    } catch (err) {
      console.error('[ClubReportSubmission] Error submitting report:', err);
      triggerNotification(err?.response?.data?.message || 'Gửi báo cáo thất bại!', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-management-container">
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
          Báo cáo hoạt động CLB
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <RefreshCw size={14} /> Làm mới
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowSubmitModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> Nộp Báo cáo mới
          </button>
        </div>
      </div>

      {/* Reports list */}
      <div className="glass-card">
        <div className="glass-card-header">
          <h3 className="glass-card-title"><ClipboardList size={18} /> Lịch sử Báo cáo Hoạt động</h3>
        </div>

        {loading ? (
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state-view">
            <ClipboardList className="empty-state-icon" />
            <p>Chưa có báo cáo hoạt động nào được nộp cho CLB này.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {reports.map((rep) => {
              const repId = rep.clubReportId || rep.id;
              const cfg = getStatusConfig(rep.status);
              
              return (
                <div key={repId} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 650, color: 'var(--text-heading)', fontSize: '14px' }}>
                          {rep.reportTitle}
                        </span>
                        <span className={`badge ${cfg.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', padding: '2px 8px', ...cfg.style }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Đợt báo cáo: <span style={{ color: 'var(--text-main)' }}>{rep.reportPeriodName || rep.periodName || '—'}</span> · 
                        Số sự kiện tổ chức: <span style={{ color: 'var(--text-main)' }}>{rep.totalEventsHeld || 0}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Ngày nộp: {rep.submittedAt ? new Date(rep.submittedAt).toLocaleString('vi-VN') : '—'}
                      </div>

                      {/* Summary contents */}
                      <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', fontSize: '12.5px', marginTop: '10px', border: '1px dashed var(--border)', color: 'var(--text-main)' }}>
                        <strong>Nội dung tóm tắt:</strong><br />
                        {rep.summaryContent || rep.content}
                      </div>

                      {/* Notes / Feedback sent down from Manager / Admin */}
                      {(rep.managerNote || rep.icpdpFeedback) && (
                        <div style={{ background: 'rgba(249, 115, 22, 0.04)', padding: '10px', borderRadius: '6px', fontSize: '12px', marginTop: '10px', borderLeft: '3px solid var(--primary)', color: 'var(--text-muted)' }}>
                          <strong>Phản hồi từ Ban Quản lý:</strong> {rep.managerNote || rep.icpdpFeedback}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: SUBMIT NEW REPORT */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '580px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title"><FileText size={18} style={{ marginRight: '6px' }} /> Nộp Báo cáo Hoạt động mới</h3>
              <button className="modal-close" onClick={() => setShowSubmitModal(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmitReport} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              <div className="form-group">
                <label>Đợt báo cáo *</label>
                <select 
                  className="select-field"
                  value={selectedPeriodId}
                  onChange={e => {
                    setSelectedPeriodId(e.target.value);
                    if (formErrors.selectedPeriodId) setFormErrors(prev => ({ ...prev, selectedPeriodId: null }));
                  }}
                >
                  <option value="">-- Chọn đợt báo cáo --</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.periodName} (Hạn nộp: {p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : '—'})
                    </option>
                  ))}
                </select>
                {formErrors.selectedPeriodId && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{formErrors.selectedPeriodId}</span>}
              </div>

              <div className="form-group">
                <label>Tiêu đề báo cáo *</label>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: Báo cáo hoạt động JS Club tháng 6"
                  value={reportTitle}
                  onChange={e => {
                    setReportTitle(e.target.value);
                    if (formErrors.reportTitle) setFormErrors(prev => ({ ...prev, reportTitle: null }));
                  }}
                />
                {formErrors.reportTitle && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{formErrors.reportTitle}</span>}
              </div>

              <div className="form-group">
                <label>Số lượng sự kiện đã tổ chức *</label>
                <input 
                  type="number"
                  className="input-field"
                  value={totalEvents}
                  onChange={e => {
                    setTotalEvents(e.target.value);
                    if (formErrors.totalEvents) setFormErrors(prev => ({ ...prev, totalEvents: null }));
                  }}
                  min="0"
                />
                {formErrors.totalEvents && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{formErrors.totalEvents}</span>}
              </div>

              <div className="form-group">
                <label>Nội dung tóm tắt hoạt động *</label>
                <textarea 
                  className="textarea-field"
                  placeholder="Mô tả tóm tắt các hoạt động, sự kiện chính đã triển khai..."
                  rows={4}
                  value={summaryContent}
                  onChange={e => {
                    setSummaryContent(e.target.value);
                    if (formErrors.summaryContent) setFormErrors(prev => ({ ...prev, summaryContent: null }));
                  }}
                />
                {formErrors.summaryContent && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{formErrors.summaryContent}</span>}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSubmitModal(false)}>Đóng</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Send size={14} /> {submitting ? 'Đang gửi...' : 'Nộp báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
