import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import Modal from '../../components/Modal';
import { Award, FileText, CheckCircle, Clock, AlertTriangle, Send } from 'lucide-react';

export default function ReportAppraisal({ dbData, triggerNotification }) {
  const { clubReports, clubs, reportPeriods } = dbData;
  const [selectedReport, setSelectedReport] = useState(null);
  const [appraisal, setAppraisal] = useState({ score: '', adminRemark: '' });

  const getClubName = (clubId) => {
    const c = clubs.find(club => club.id === clubId);
    return c ? c.name : clubId;
  };

  const getPeriodName = (periodId) => {
    const p = reportPeriods.find(period => period.id === periodId);
    return p ? p.name : periodId;
  };

  const handleOpenAppraisal = (report) => {
    setSelectedReport(report);
    setAppraisal({
      score: report.score !== null ? String(report.score) : '',
      adminRemark: report.adminRemark || ''
    });
  };

  const handleCloseAppraisal = () => {
    setSelectedReport(null);
  };

  const handleSubmitAppraisal = (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    
    const scoreNum = Number(appraisal.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100 || appraisal.score === '') {
      triggerNotification('Điểm số phải là số từ 0 đến 100!', 'warning');
      return;
    }

    mockDb.appraiseReport(selectedReport.id, scoreNum, appraisal.adminRemark);
    triggerNotification(`Đã chấm điểm báo cáo cho CLB ${getClubName(selectedReport.clubId)}: ${scoreNum}đ`, 'success');
    handleCloseAppraisal();
  };

  const pendingReports = clubReports.filter(r => r.status === 'Submitted');
  const appraisedReports = clubReports.filter(r => r.status === 'Appraised');

  return (
    <div className="report-appraisal-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><AlertTriangle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Báo cáo chờ thẩm định</span>
            <span className="stats-value">{pendingReports.length} bản</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Báo cáo đã chấm điểm</span>
            <span className="stats-value">{appraisedReports.length} bản</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* Pending Reports List */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Clock size={18} /> Báo cáo Chờ Thẩm định</h3>
          </div>

          {pendingReports.length === 0 ? (
            <div className="empty-state-view">
              <FileText className="empty-state-icon" />
              <p>Hiện không có báo cáo nào đang chờ duyệt.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Câu lạc bộ</th>
                    <th>Đợt báo cáo</th>
                    <th>Số Sự kiện</th>
                    <th>Thành viên</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingReports.map(r => (
                    <tr key={r.id}>
                      <td><strong>{getClubName(r.clubId)}</strong></td>
                      <td>{getPeriodName(r.reportPeriodId)}</td>
                      <td>{r.eventCount} sự kiện</td>
                      <td>{r.memberCount} active</td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpenAppraisal(r)}
                        >
                          Đánh giá & Chấm điểm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Appraised Reports Archive */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Award size={18} /> Lịch sử Đã Thẩm định</h3>
          </div>

          {appraisedReports.length === 0 ? (
            <div className="empty-state-view">
              <FileText className="empty-state-icon" />
              <p>Chưa có báo cáo nào được thẩm định.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>CLB</th>
                    <th>Học kỳ</th>
                    <th>Điểm</th>
                    <th>Xếp loại</th>
                  </tr>
                </thead>
                <tbody>
                  {appraisedReports.map(r => (
                    <tr key={r.id}>
                      <td>
                        <strong>{getClubName(r.clubId)}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getPeriodName(r.reportPeriodId)}</div>
                      </td>
                      <td>{r.semesterId}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: r.score >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                          {r.score}đ
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          r.score >= 90 ? 'badge-active' : r.score >= 80 ? 'badge-present' : 'badge-pending'
                        }`}>
                          {r.score >= 90 ? 'Xuất sắc' : r.score >= 80 ? 'Tốt' : 'Khá / Trung bình'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appraisal modal form */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={handleCloseAppraisal}
          title={`Thẩm định hoạt động: ${getClubName(selectedReport.clubId)}`}
        >
          <form onSubmit={handleSubmitAppraisal}>
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.1)', marginBottom: '16px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Học kỳ:</span> <strong>{selectedReport.semesterId}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Đợt nộp:</span> <strong>{getPeriodName(selectedReport.reportPeriodId)}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Số sự kiện đã chạy:</span> <strong>{selectedReport.eventCount}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Tổng thành viên:</span> <strong>{selectedReport.memberCount}</strong></div>
              </div>
              <div style={{ marginTop: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nội dung báo cáo tự khai:</span>
                <p style={{ color: 'var(--text-main)', fontStyle: 'italic', whiteSpace: 'pre-line' }}>"{selectedReport.content}"</p>
              </div>
            </div>

            <div className="form-group">
              <label>Thang Điểm Hoạt Động (0 - 100)</label>
              <input 
                type="number"
                min="0"
                max="100"
                className="input-field"
                value={appraisal.score}
                onChange={e => setAppraisal({ ...appraisal, score: e.target.value })}
                placeholder="Nhập số điểm (Ví dụ: 85)"
                required
              />
            </div>

            <div className="form-group">
              <label>Lời nhận xét / Ý kiến phản hồi góp ý của PDP</label>
              <textarea 
                className="textarea-field"
                value={appraisal.adminRemark}
                onChange={e => setAppraisal({ ...appraisal, adminRemark: e.target.value })}
                placeholder="Nhập phản hồi chi tiết về các lỗi hoặc ưu điểm của CLB..."
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                <Send size={16} /> Ghi nhận & Công bố điểm số
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCloseAppraisal}>
                Hủy bỏ
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
