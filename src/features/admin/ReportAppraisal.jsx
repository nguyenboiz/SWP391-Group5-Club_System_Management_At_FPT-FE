import React, { useState, useEffect, useCallback } from 'react';
import { Award, FileText, CheckCircle, Clock, AlertTriangle, Send, Bell, Plus } from 'lucide-react';
import { mockDb } from '../../utils/mockDb';

// NOTE: BE chưa có các API sau, giữ mock tạm thời qua mockDb:
//   - GET  /api/club-reports              (danh sách báo cáo CLB)
//   - PUT  /api/club-reports/{id}/appraise (chấm điểm)
//   - GET  /api/announcements             (danh sách thông báo)
//   - POST /api/announcements             (tạo thông báo)

export default function ReportAppraisal({ triggerNotification }) {
  const [activeTab, setActiveTab] = useState('appraisal'); // 'appraisal' or 'announcements'

  // ── Announcement states (mockDb) ───────────────────────────────────────────
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

  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    if (!newAnn.title.trim() || !newAnn.content.trim()) {
      triggerNotification('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!', 'warning');
      return;
    }
    mockDb.addAnnouncement({
      title: newAnn.title.trim(),
      content: newAnn.content.trim(),
    });
    triggerNotification('Đã đăng và phát hành thông báo thành công!', 'success');
    setNewAnn({ title: '', content: '' });
  };


  return (
    <div className="report-appraisal-container">
      {/* Header and Switcher Tab */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title">
            {activeTab === 'appraisal' ? <FileText size={18} /> : <Bell size={18} />}
            {activeTab === 'appraisal' ? 'Thẩm định Báo cáo CLB' : 'Quản lý & Phát hành Thông báo'}
          </h3>
          <div className="role-switcher-container" style={{ margin: 0 }}>
            <button
              className={`role-switch-btn ${activeTab === 'appraisal' ? 'active' : ''}`}
              onClick={() => setActiveTab('appraisal')}
              type="button"
            >
              Thẩm định Báo cáo
            </button>
            <button
              className={`role-switch-btn ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
              type="button"
            >
              Gửi Thông báo
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'appraisal' ? (
        /* Report Appraisal – chờ BE */
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><FileText size={18} /> Danh sách Báo cáo CLB</h3>
          </div>
          <div className="empty-state-view">
            <AlertTriangle className="empty-state-icon" style={{ color: 'var(--warning)' }} />
            <p>Chức năng thẩm định báo cáo CLB đang chờ BE bổ sung API.</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Yêu cầu BE bổ sung: <code>GET /api/club-reports</code>, <code>PUT /api/club-reports/&#123;id&#125;/appraise</code>
            </p>
          </div>
        </div>
      ) : (
        /* Announcements view */
        <div className="dashboard-grid-2col">
          {/* Create Announcement Form */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Plus size={18} /> Phát hành Thông báo mới</h3>
            </div>

            <form onSubmit={handleCreateAnnouncement}>
              <div className="form-group">
                <label>Tiêu đề thông báo *</label>
                <input
                  type="text"
                  className="input-field"
                  value={newAnn.title}
                  onChange={e => setNewAnn({ ...newAnn, title: e.target.value })}
                  placeholder="Nhập tiêu đề thông báo..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Nội dung chi tiết thông báo *</label>
                <textarea
                  className="textarea-field"
                  value={newAnn.content}
                  onChange={e => setNewAnn({ ...newAnn, content: e.target.value })}
                  placeholder="Nhập nội dung thông báo gửi đến các CLB..."
                  rows={6}
                  required
                />
              </div>

              <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
                * Chú ý: API gửi thông báo đến BE chưa sẵn sàng. Thông báo hiện lưu tạm trong phiên làm việc này.
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Send size={16} /> Đăng và Phát hành thông báo
              </button>
            </form>
          </div>

          {/* Published Announcements List */}
          <div className="glass-card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Bell size={18} /> Thông báo đã phát hành ({announcements.length})</h3>
            </div>

            {announcements.length === 0 ? (
              <div className="empty-state-view">
                <Bell className="empty-state-icon" />
                <p>Chưa có thông báo nào được phát hành.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {announcements.map(ann => (
                  <div key={ann.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ color: 'var(--text-heading)', fontSize: '14px' }}>{ann.title}</strong>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-main)', fontStyle: 'italic', marginBottom: '8px', whiteSpace: 'pre-line' }}>
                      "{ann.content}"
                    </p>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                      Ngày đăng: {new Date(ann.createdAt).toLocaleString('vi-VN')}
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
