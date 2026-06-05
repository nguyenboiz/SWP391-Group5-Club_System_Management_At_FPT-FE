import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { FileText, Send, Award, Calendar, Users, Star, ClipboardList } from 'lucide-react';

export default function SubmitReport({ dbData, selectedClubId, triggerNotification }) {
  const { clubReports, reportPeriods, semesters, events, memberships } = dbData;
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [content, setContent] = useState('');

  // Filter report history for this club
  const clubHistory = clubReports.filter(r => r.clubId === selectedClubId);

  // Auto count for active metrics to show on screen
  const activeSemester = semesters.find(s => s.status === 'Active');
  const activeSemesterId = activeSemester ? activeSemester.id : 'SU26';
  
  const autoEventCount = events.filter(e => e.clubId === selectedClubId).length;
  const autoMemberCount = memberships.filter(m => m.clubId === selectedClubId && m.status === 'Active').length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPeriodId) {
      triggerNotification('Vui lòng chọn đợt nộp báo cáo!', 'warning');
      return;
    }
    if (!content.trim()) {
      triggerNotification('Vui lòng điền nội dung báo cáo hoạt động!', 'warning');
      return;
    }

    // Check if report for this period was already submitted
    const isSubmitted = clubHistory.some(r => r.reportPeriodId === selectedPeriodId);
    if (isSubmitted) {
      triggerNotification('Báo cáo của câu lạc bộ cho đợt này đã được nộp trước đó!', 'error');
      return;
    }

    mockDb.submitReport({
      clubId: selectedClubId,
      semesterId: activeSemesterId,
      reportPeriodId: selectedPeriodId,
      content: content.trim()
    });

    triggerNotification('Nộp báo cáo hoạt động định kỳ thành công!', 'success');
    setContent('');
    setSelectedPeriodId('');
  };

  const getPeriodName = (periodId) => {
    const p = reportPeriods.find(period => period.id === periodId);
    return p ? p.name : periodId;
  };

  // Only open report periods for selection
  const openPeriods = reportPeriods.filter(r => r.status === 'Open');

  return (
    <div className="submit-report-container">
      {/* Metric aggregate display widget */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><Calendar size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Sự kiện đã chạy (Kỳ {activeSemesterId})</span>
            <span className="stats-value">{autoEventCount} sự kiện</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><Users size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Thành viên Active hiện tại</span>
            <span className="stats-value">{autoMemberCount} thành viên</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--warning)' }}><Star size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Điểm xếp hạng trung bình</span>
            <span className="stats-value">
              {clubHistory.filter(r => r.score !== null).length > 0
                ? (clubHistory.reduce((acc, curr) => acc + (curr.score || 0), 0) / clubHistory.filter(r => r.score !== null).length).toFixed(1) + 'đ'
                : 'N/A'}
            </span>
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
                {openPeriods.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Hạn: {p.deadline})</option>
                ))}
              </select>
            </div>

            {/* Simulated automated aggregates info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginBottom: '16px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Thống kê sự kiện:</span>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Tự động đếm: {autoEventCount} chương trình</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Thành viên đăng ký:</span>
                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Tự động đếm: {autoMemberCount} sinh viên</div>
              </div>
              <div style={{ gridColumn: 'span 2', fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                * Số liệu trên được tính tự động từ bảng dữ liệu Event và Membership trong kỳ của CLB. Manager không cần điền tay.
              </div>
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

            <button type="submit" className="btn btn-primary">
              <Send size={16} /> Nộp báo cáo lên PDP
            </button>
          </form>
        </div>

        {/* Right Side: History & PDP Appraisal comments */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><ClipboardList size={18} /> Lịch sử & Điểm số phản hồi</h3>
          </div>

          {clubHistory.length === 0 ? (
            <div className="empty-state-view">
              <ClipboardList className="empty-state-icon" />
              <p>Chưa có báo cáo nào được gửi.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
              {clubHistory.map(r => (
                <div 
                  key={r.id} 
                  style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.01)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong>{getPeriodName(r.reportPeriodId)}</strong>
                    <span className={`badge ${
                      r.status === 'Appraised' ? 'badge-active' : 'badge-pending'
                    }`}>
                      {r.status === 'Appraised' ? 'Đã chấm điểm' : 'Đang chờ duyệt'}
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '10px' }}>
                    "{r.content}"
                  </div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <span>Sự kiện: {r.eventCount}</span> | <span>Thành viên: {r.memberCount}</span>
                  </div>

                  {r.status === 'Appraised' && (
                    <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(242,111,33,0.05)', border: '1px solid rgba(242,111,33,0.15)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '13px' }}><Award size={12} /> PDP Chấm điểm:</span>
                        <strong style={{ fontSize: '16px', color: 'var(--success)' }}>{r.score} điểm</strong>
                      </div>
                      {r.adminRemark && (
                        <p style={{ fontSize: '12px', color: 'var(--text-main)', marginTop: '4px' }}>
                          <strong>Ý kiến PDP:</strong> {r.adminRemark}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
