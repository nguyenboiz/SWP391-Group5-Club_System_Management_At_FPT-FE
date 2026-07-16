import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Send, RefreshCw, Search, Clock, CheckCircle, Users, Megaphone, AlertCircle, Trash2 } from 'lucide-react';
import { createNotification, getNotifications } from '../../services/notificationService';
import { validateNoSpecialChars } from '../../utils/validator';

export default function NotificationManagement({ triggerNotification }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [notificationType, setNotificationType] = useState('General');
  const [targetType, setTargetType] = useState('All');
  const [targetRole, setTargetRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      const list = Array.isArray(res) ? res : (res?.data ?? []);
      list.sort((a, b) => new Date(b.createdAt || b.sentAt || 0) - new Date(a.createdAt || a.sentAt || 0));
      setNotifications(list);
    } catch (err) {
      console.error('[NotificationManagement] Lỗi tải thông báo:', err);
      triggerNotification('Không tải được danh sách thông báo!', 'error');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleSend = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập tiêu đề thông báo!';
    } else if (!validateNoSpecialChars(title)) {
      newErrors.title = 'Tiêu đề không được chứa ký tự lạ!';
    }

    if (!content.trim()) {
      newErrors.content = 'Vui lòng nhập nội dung thông báo!';
    } else if (!validateNoSpecialChars(content)) {
      newErrors.content = 'Nội dung không được chứa ký tự lạ!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerNotification('❌ Vui lòng sửa các lỗi nhập liệu bên dưới!', 'warning');
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const dto = {
        title: title.trim(),
        content: content.trim(),
        notificationType,
        targetType,
      };
      if (targetRole) dto.targetRole = targetRole;

      await createNotification(dto);
      triggerNotification('Đã gửi thông báo thành công!', 'success');
      setTitle('');
      setContent('');
      setNotificationType('General');
      setTargetType('All');
      setTargetRole('');
      await loadNotifications();
    } catch (err) {
      console.error('[NotificationManagement] Lỗi gửi thông báo:', err);
      triggerNotification(err?.response?.data?.message || 'Gửi thông báo thất bại!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredList = notifications.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
  });

  return (
    <div className="notification-management-container">
      <div className="dashboard-grid-2col">

        {/* Left: Form gửi thông báo */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Megaphone size={18} /> Gửi Thông báo mới</h3>
          </div>

          <form onSubmit={handleSend} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Tiêu đề thông báo *</label>
              <input
                type="text"
                className="input-field"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                }}
                placeholder="Ví dụ: Thông báo kế hoạch học kỳ mới..."
              />
              {errors.title && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.title}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nội dung *</label>
              <textarea
                className="textarea-field"
                value={content}
                onChange={e => {
                  setContent(e.target.value);
                  if (errors.content) setErrors(prev => ({ ...prev, content: null }));
                }}
                placeholder="Nhập nội dung thông báo chi tiết..."
                rows={5}
              />
              {errors.content && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.content}</span>}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Loại thông báo</label>
                <select className="select-field" value={notificationType} onChange={e => setNotificationType(e.target.value)}>
                  <option value="General">Chung (General)</option>
                  <option value="Event">Sự kiện (Event)</option>
                  <option value="Report">Báo cáo (Report)</option>
                  <option value="System">Hệ thống (System)</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Đối tượng nhận</label>
                <select className="select-field" value={targetType} onChange={e => setTargetType(e.target.value)}>
                  <option value="All">Tất cả</option>
                  <option value="Role">Theo vai trò</option>
                  <option value="Club">Theo CLB</option>
                </select>
              </div>
            </div>

            {targetType === 'Role' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Vai trò cụ thể</label>
                <select className="select-field" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                  <option value="">-- Chọn vai trò --</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="MEMBER">Member</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isSubmitting ? (
                <><span className="login-spinner" style={{ width: '14px', height: '14px' }} /> Đang gửi...</>
              ) : (
                <><Send size={16} /> Gửi thông báo</>
              )}
            </button>
          </form>
        </div>

        {/* Right: Lịch sử thông báo đã gửi */}
        <div className="glass-card" style={{ maxHeight: '700px', display: 'flex', flexDirection: 'column' }}>
          <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="glass-card-title"><Bell size={18} /> Lịch sử Thông báo ({filteredList.length})</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadNotifications}
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
            </button>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '12px', position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm kiếm thông báo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', fontSize: '12px' }}
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div className="empty-state-view">
                <span className="login-spinner" style={{ width: '24px', height: '24px' }} />
                <p style={{ marginTop: '8px' }}>Đang tải...</p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="empty-state-view">
                <Bell className="empty-state-icon" />
                <p>Chưa có thông báo nào.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredList.map(n => {
                  const nId = n.id || n.notificationId;
                  const sentAt = n.createdAt || n.sentAt;
                  const nType = n.notificationType || n.type || 'General';
                  return (
                    <div key={nId} style={{
                      padding: '12px 14px', borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'rgba(255,255,255,0.01)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-heading)' }}>
                          {n.title}
                        </strong>
                        <span className={`badge ${nType === 'System' ? 'badge-admin' : nType === 'Event' ? 'badge-active' : 'badge-member'}`}
                          style={{ fontSize: '10px', flexShrink: 0, marginLeft: '8px' }}>
                          {nType}
                        </span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'pre-line', marginBottom: '6px', lineHeight: 1.5 }}>
                        {n.content}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.7 }}>
                        <span>
                          {n.targetType === 'Role' ? `→ ${n.targetRole}` : n.targetType === 'Club' ? `→ CLB #${n.clubId}` : '→ Tất cả'}
                        </span>
                        <span>{sentAt ? new Date(sentAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
