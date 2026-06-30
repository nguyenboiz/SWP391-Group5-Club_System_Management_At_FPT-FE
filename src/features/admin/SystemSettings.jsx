import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, DollarSign, Users, Clock, HelpCircle, FileText } from 'lucide-react';

export default function SystemSettings({ triggerNotification }) {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    maxClubMembers: 100,
    eventBudgetThreshold: 5000000,
    reportDeadlineDays: 5,
    requireEvidenceForPoints: true,
    systemEmail: 'support.clubs@fpt.edu.vn',
    termsAndRegulations: 'Quy định quản lý câu lạc bộ sinh viên Đại học FPT:\n1. Tất cả sự kiện phải gửi duyệt trước ít nhất 7 ngày.\n2. Báo cáo định kỳ phải nộp đúng hạn. Nộp muộn 2 lần trong kỳ sẽ bị tạm dừng hoạt động.\n3. Minh chứng sự kiện cần hình ảnh rõ nét, chụp đầy đủ ban truyền thông và người tham gia.'
  });

  useEffect(() => {
    const stored = localStorage.getItem('fpt_system_settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('fpt_system_settings', JSON.stringify(settings));
    triggerNotification('Đã lưu cấu hình hệ thống thành công!', 'success');
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="system-settings-container">

      {/* ⚠ BE MISSING API BANNER */}
      <div style={{
        marginBottom: '20px', padding: '16px 20px',
        borderRadius: '10px',
        background: 'rgba(234,179,8,0.08)',
        border: '1.5px solid rgba(234,179,8,0.4)',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <ShieldAlert size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#eab308', fontSize: '13px', marginBottom: '6px' }}>
            ⚠ [BE CẦN BỔ SUNG API] — Trang này đang lưu cục bộ (localStorage)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            Cấu hình hệ thống hiện chỉ lưu trên trình duyệt, chưa đồng bộ lên máy chủ. Backend cần bổ sung:
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
              <li><code>GET  /api/settings</code> — Lấy cấu hình hệ thống hiện tại</li>
              <li><code>PUT  /api/settings</code> — Lưu cấu hình {'{ maxClubMembers, eventBudgetThreshold, reportDeadlineDays, ... }'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px', padding: '12px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className={`role-switch-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Settings size={14} /> Cấu hình thông số chung
          </button>
          <button className={`role-switch-btn ${activeTab === 'regulations' ? 'active' : ''}`} onClick={() => setActiveTab('regulations')}
            style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <FileText size={14} /> Quy chế & Hướng dẫn
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {activeTab === 'general' ? (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Settings size={18} /> Cấu hình Thông số Hệ thống</h3>
            </div>

            <div className="dashboard-grid-2col" style={{ gap: '24px' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} style={{ color: 'var(--primary)' }} />
                  Số lượng thành viên tối đa trong một CLB:
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.maxClubMembers}
                  onChange={e => handleChange('maxClubMembers', parseInt(e.target.value, 10))}
                  min={10} max={1000}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Giới hạn số lượng thành viên tối đa (mặc định 100).</span>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} style={{ color: 'var(--primary)' }} />
                  Hạn mức ngân sách sự kiện cần Manager phê duyệt (VND):
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.eventBudgetThreshold}
                  onChange={e => handleChange('eventBudgetThreshold', parseInt(e.target.value, 10))}
                  min={0}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ngân sách sự kiện vượt hạn mức này sẽ tự động phân loại ưu tiên cao khi gửi duyệt.</span>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} style={{ color: 'var(--primary)' }} />
                  Số ngày gia hạn nộp báo cáo (sau khi hết hạn):
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.reportDeadlineDays}
                  onChange={e => handleChange('reportDeadlineDays', parseInt(e.target.value, 10))}
                  min={0} max={30}
                  required
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Thời gian gia hạn nộp trễ cho phép sau khi cổng báo cáo chính thức đóng.</span>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HelpCircle size={14} style={{ color: 'var(--primary)' }} />
                  Email liên hệ hỗ trợ hệ thống:
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={settings.systemEmail}
                  onChange={e => handleChange('systemEmail', e.target.value)}
                  placeholder="anv@fpt.edu.vn"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={settings.requireEvidenceForPoints}
                  onChange={e => handleChange('requireEvidenceForPoints', e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                Bắt buộc nộp Minh chứng (Evidence) để được cộng điểm hoạt động
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginLeft: '24px' }}>
                Nếu được tích chọn, sinh viên bắt buộc phải tải lên ảnh chụp/tài liệu check-in khi kết thúc sự kiện để điểm danh được công nhận.
              </span>
            </div>
          </div>
        ) : (
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><FileText size={18} /> Quy chế & Hướng dẫn sử dụng</h3>
            </div>
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Nội dung quy chế hoạt động chung (Hiển thị tại màn hình Dashboard của các CLB):</label>
              <textarea
                className="textarea-field"
                rows={12}
                value={settings.termsAndRegulations}
                onChange={e => handleChange('termsAndRegulations', e.target.value)}
                placeholder="Nhập nội dung quy định..."
                style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.6 }}
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
            <Save size={16} /> Lưu cấu hình hệ thống
          </button>
        </div>
      </form>
    </div>
  );
}
