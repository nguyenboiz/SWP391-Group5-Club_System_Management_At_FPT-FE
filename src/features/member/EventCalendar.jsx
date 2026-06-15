import React, { useState, useEffect, useCallback } from 'react';
import { getEventsByClub } from '../../services/eventService';
import { Calendar, MapPin, Check, RefreshCw } from 'lucide-react';

// NOTE: BE chưa có API đăng ký sự kiện cho member.
// Yêu cầu BE bổ sung: POST /api/events/{eventId}/register

export default function EventCalendar({ currentUserId, triggerNotification, selectedClubId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredIds, setRegisteredIds] = useState(new Set());

  const loadEvents = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await getEventsByClub(selectedClubId);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setEvents(list);
    } catch (err) {
      console.error('[EventCalendar] Lỗi tải sự kiện:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleRegister = (eventId, eventName) => {
    if (!currentUserId) {
      triggerNotification('Vui lòng đăng nhập tài khoản sinh viên!', 'warning');
      return;
    }
    // TODO: thay bằng POST /api/events/{eventId}/register khi BE bổ sung
    setRegisteredIds(prev => new Set([...prev, eventId]));
    triggerNotification(`Đăng ký tham gia "${eventName}" thành công! (Chờ BE bổ sung API để lưu chính thức)`, 'success');
  };

  return (
    <div className="event-calendar-container">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title"><Calendar size={18} /> Lịch sự kiện & Hoạt động sắp diễn ra</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadEvents}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Xem danh sách sự kiện của CLB và đăng ký tham gia. Khi đăng ký, trạng thái điểm danh ban đầu mặc định là{' '}
          <strong style={{ color: 'var(--warning)' }}>Vắng mặt</strong> cho đến khi được Ban chủ nhiệm điểm danh thực tế.
        </p>
      </div>

      {loading ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
            <p style={{ marginTop: '10px' }}>Đang tải danh sách sự kiện...</p>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <Calendar className="empty-state-icon" />
            <p>Chưa có sự kiện nào trong CLB này.</p>
          </div>
        </div>
      ) : (
        <div className="calendar-grid">
          {events.map(e => {
            const eId = e.id || e.eventId;
            const eName = e.eventName || e.name;
            const eLocation = e.location || e.venue;
            const eTime = e.startTime || e.dateTime;
            const eDesc = e.description || '';
            const eStatus = e.status || e.approvalStatus;
            const registered = registeredIds.has(eId);
            return (
              <div key={eId} className="glass-card calendar-card">
                <div>
                  {eStatus && (
                    <span className={`badge ${eStatus === 'Approved' ? 'badge-active' : eStatus === 'Rejected' ? 'badge-blocked' : 'badge-pending'}`} style={{ marginBottom: '12px', display: 'inline-block', fontSize: '11px' }}>
                      {eStatus === 'Approved' ? 'Đã duyệt' : eStatus === 'Rejected' ? 'Bị từ chối' : eStatus === 'Pending' ? 'Chờ duyệt' : eStatus}
                    </span>
                  )}

                  <h4 style={{ fontSize: '16px', color: 'var(--text-heading)', minHeight: '48px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {eName}
                  </h4>

                  {eDesc && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {eDesc}
                    </p>
                  )}

                  {eLocation && (
                    <div className="event-details-row" style={{ marginTop: '16px' }}>
                      <MapPin size={12} />
                      <span>{eLocation}</span>
                    </div>
                  )}

                  {eTime && (
                    <div className="event-details-row">
                      <Calendar size={12} />
                      <span>{new Date(eTime).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                  {registered ? (
                    <button className="btn btn-secondary" style={{ width: '100%', cursor: 'default' }} disabled>
                      <Check size={14} style={{ color: 'var(--success)' }} /> Đã đăng ký tham gia
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(eId, eName)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Đăng ký tham gia
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
