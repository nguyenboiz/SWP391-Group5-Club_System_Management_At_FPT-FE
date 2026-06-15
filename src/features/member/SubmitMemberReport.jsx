import React, { useState, useEffect } from 'react';
import { ClipboardList, Send, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { mockDb } from '../../utils/mockDb';

const statusConfig = {
  Approved: { label: 'Đã duyệt', className: 'badge-active', icon: <CheckCircle size={12} /> },
  Rejected: { label: 'Từ chối', className: 'badge-blocked', icon: <XCircle size={12} /> },
  Pending:  { label: 'Chờ duyệt', className: 'badge-member', icon: <Clock size={12} /> },
};

export default function SubmitMemberReport({ selectedClubId, triggerNotification }) {
  const { currentUser } = useAuth();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const syncReports = () => {
      const db = mockDb.getData();
      const list = (db.memberReports || []).filter(
        r => String(r.clubId) === String(selectedClubId) && r.userId === currentUser?.id
      );
      // Sắp xếp báo cáo mới nhất lên đầu
      list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setHistory(list);
    };
    syncReports();
    window.addEventListener('mockDbUpdate', syncReports);
    return () => window.removeEventListener('mockDbUpdate', syncReports);
  }, [selectedClubId, currentUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      triggerNotification('Vui lòng nhập đầy đủ tiêu đề và nội dung!', 'warning');
      return;
    }
    mockDb.submitMemberReport({
      userId: currentUser?.id,
      userFullName: currentUser?.fullName,
      clubId: selectedClubId,
      title: title.trim(),
      content: content.trim(),
    });
    triggerNotification('Nộp báo cáo lên Leader thành công!', 'success');
    setTitle('');
    setContent('');
  };

  return (
    <div className="submit-report-container">
      <div className="dashboard-grid-2col">
        {/* Left Column: Form */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><ClipboardList size={18} /> Nộp Báo cáo cho Leader</h3>
          </div>

          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <AlertTriangle size={12} style={{ marginRight: '4px', color: 'var(--warning)', display: 'inline' }} />
            Chức năng nộp báo cáo cá nhân đang hoạt động ở chế độ lưu trữ cục bộ (Local Storage) để chuẩn bị tích hợp khi BE bổ sung API.
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tiêu đề báo cáo *</label>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Báo cáo tuần 10, Báo cáo tiến độ sự kiện..."
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nội dung hoạt động chi tiết *</label>
              <textarea
                className="textarea-field"
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Mô tả công việc đã làm, tiến độ, khó khăn và đề xuất hỗ trợ từ Leader..."
                rows={6}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Send size={16} /> Nộp báo cáo lên Leader
            </button>
          </form>
        </div>

        {/* Right Column: History */}
        <div className="glass-card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title"><ClipboardList size={18} /> Lịch sử báo cáo đã gửi ({history.length})</h3>
          </div>

          {history.length === 0 ? (
            <div className="empty-state-view">
              <ClipboardList className="empty-state-icon" />
              <p>Bạn chưa gửi báo cáo nào trong câu lạc bộ này.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {history.map(rep => {
                const cfg = statusConfig[rep.status] || statusConfig.Pending;
                return (
                  <div key={rep.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--text-heading)', fontSize: '14px' }}>{rep.title}</strong>
                      <span className={`badge ${cfg.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-main)', whiteSpace: 'pre-line', marginBottom: '8px', lineHeight: 1.5 }}>
                      {rep.content}
                    </p>
                    {rep.leaderRemark && (
                      <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', fontSize: '12px', borderLeft: '3px solid var(--primary)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <strong>Phản hồi từ Leader:</strong> {rep.leaderRemark}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      Gửi lúc: {new Date(rep.submittedAt).toLocaleString('vi-VN')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
