import React from 'react';
import { mockDb } from '../../utils/mockDb';
import { Calendar, MapPin, Check, UserCheck, AlertCircle } from 'lucide-react';

export default function EventCalendar({ dbData, currentUserId, triggerNotification }) {
  const { events, participants, clubs } = dbData;

  const handleRegister = (eventId, eventName) => {
    if (!currentUserId) {
      triggerNotification('Vui lòng chọn hoặc đăng nhập tài khoản sinh viên!', 'warning');
      return;
    }
    
    mockDb.registerEvent(eventId, currentUserId);
    triggerNotification(`Đăng ký tham gia "${eventName}" thành công!`, 'success');
  };

  const getClubName = (clubId) => {
    const c = clubs.find(club => club.id === clubId);
    return c ? c.name : clubId;
  };

  // Check if student has already registered
  const isRegistered = (eventId) => {
    return participants.some(p => p.eventId === eventId && p.userId === currentUserId);
  };

  return (
    <div className="event-calendar-container">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header">
          <h3 className="glass-card-title"><Calendar size={18} /> Lịch sự kiện & Hoạt động sắp diễn ra</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Học sinh có thể đăng ký trực tiếp để tham dự sự kiện. Khi đăng ký, trạng thái điểm danh ban đầu mặc định là <strong style={{ color: 'var(--warning)' }}>Vắng mặt</strong> cho đến khi được ban chủ nhiệm quét điểm danh thực tế hoặc PDP duyệt minh chứng.
        </p>
      </div>

      <div className="calendar-grid">
        {events.map(e => {
          const registered = isRegistered(e.id);
          return (
            <div key={e.id} className="glass-card calendar-card">
              <div>
                <span className="alumni-cohort-badge" style={{ marginBottom: '12px', display: 'inline-block' }}>
                  {getClubName(e.clubId)}
                </span>
                
                <h4 style={{ fontSize: '16px', color: 'var(--text-heading)', minHeight: '48px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {e.name}
                </h4>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {e.description}
                </p>

                <div className="event-details-row" style={{ marginTop: '16px' }}>
                  <MapPin size={12} />
                  <span>{e.venue}</span>
                </div>

                <div className="event-details-row">
                  <Calendar size={12} />
                  <span>{new Date(e.dateTime).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                {registered ? (
                  <button className="btn btn-secondary" style={{ width: '100%', cursor: 'default' }} disabled>
                    <Check size={14} style={{ color: 'var(--success)' }} /> Đã đăng ký tham gia
                  </button>
                ) : (
                  <button 
                    onClick={() => handleRegister(e.id, e.name)}
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
    </div>
  );
}
