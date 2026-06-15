import React, { useState } from 'react';
import { FileText, Send, Award, Calendar, Users, Star, ClipboardList, AlertTriangle } from 'lucide-react';
import * as semesterService from '../../services/semesterService';
import * as reportPeriodService from '../../services/reportPeriodService';

// NOTE: BE chưa có API cho club reports.
// Yêu cầu BE bổ sung:
//   - GET  /api/club-reports?clubId={clubId}
//   - POST /api/club-reports
// Khi có API, thay phần mock bên dưới.

export default function SubmitReport({ selectedClubId, triggerNotification }) {
  const [semesters, setSemesters] = React.useState([]);
  const [reportPeriods, setReportPeriods] = React.useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = React.useState('');
  const [content, setContent] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const semData = await semesterService.getSemesters();
        const semList = Array.isArray(semData) ? semData : (semData?.data ?? []);
        setSemesters(semList);

        // Load periods for active semester
        const active = semList.find(s => s.status === 'Active' || s.status === 'Open') || semList[0];
        if (active) {
          const rpData = await reportPeriodService.getReportPeriods(active.id);
          const rpList = Array.isArray(rpData) ? rpData : (rpData?.data ?? []);
          setReportPeriods(rpList.filter(r => r.status === 'Open' || r.status === 'Active'));
        }
      } catch (err) {
        console.error('[SubmitReport] Lỗi tải dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPeriodId) {
      triggerNotification('Vui lòng chọn đợt nộp báo cáo!', 'warning');
      return;
    }
    if (!content.trim()) {
      triggerNotification('Vui lòng điền nội dung báo cáo hoạt động!', 'warning');
      return;
    }

    // TODO: thay bằng POST /api/club-reports khi BE bổ sung
    triggerNotification('Chức năng nộp báo cáo CLB đang chờ BE bổ sung API.', 'warning');
  };

  if (loading) {
    return (
      <div className="empty-state-view">
        <span className="login-spinner" style={{ width: '32px', height: '32px' }} />
        <p style={{ marginTop: '12px' }}>Đang tải dữ liệu học kỳ...</p>
      </div>
    );
  }

  return (
    <div className="submit-report-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><Calendar size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">CLB đang hoạt động</span>
            <span className="stats-value">ID: {selectedClubId}</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><ClipboardList size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đợt báo cáo đang mở</span>
            <span className="stats-value">{reportPeriods.length} đợt</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* Left Side: Create Report form */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><FileText size={18} /> Gửi báo cáo định kỳ lên nhà trường</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Đợt thu báo cáo đang mở cổng</label>
              <select
                className="select-field"
                value={selectedPeriodId}
                onChange={e => setSelectedPeriodId(e.target.value)}
                required
              >
                <option value="">-- Chọn đợt nộp báo cáo --</option>
                {reportPeriods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.periodName || p.name} (Hạn: {p.deadline ? new Date(p.deadline).toLocaleDateString('vi-VN') : 'N/A'})
                  </option>
                ))}
              </select>
              {reportPeriods.length === 0 && (
                <span style={{ fontSize: '12px', color: 'var(--warning)', display: 'block', marginTop: '4px' }}>
                  Hiện không có đợt báo cáo nào đang mở cổng.
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Báo cáo tình hình chi tiết hoạt động</label>
              <textarea
                className="textarea-field"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Tóm tắt kết quả đạt được, khó khăn, đề xuất kiến nghị với phòng IC-PDP..."
                rows={6}
                required
              />
            </div>

            <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
              <AlertTriangle size={12} style={{ marginRight: '4px', color: 'var(--warning)' }} />
              API nộp báo cáo CLB chưa có trên BE. Vui lòng yêu cầu BE bổ sung <code>POST /api/club-reports</code>.
            </div>

            <button type="submit" className="btn btn-primary">
              <Send size={16} /> Nộp báo cáo lên PDP
            </button>
          </form>
        </div>

        {/* Right Side: History placeholder */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><ClipboardList size={18} /> Lịch sử & Điểm số phản hồi</h3>
          </div>
          <div className="empty-state-view">
            <ClipboardList className="empty-state-icon" />
            <p>Lịch sử báo cáo sẽ hiển thị khi BE bổ sung API.</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Yêu cầu BE: <code>GET /api/club-reports?clubId=&#123;id&#125;</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
