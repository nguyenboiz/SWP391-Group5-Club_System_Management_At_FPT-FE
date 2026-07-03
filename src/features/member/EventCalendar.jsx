import React, { useState, useEffect, useCallback } from 'react';
import { getApprovedEventsByClub, getEventDetail } from '../../services/eventService';
import { Calendar, MapPin, RefreshCw, CheckCircle, Eye, X } from 'lucide-react';

export default function EventCalendar({ currentUserId, triggerNotification, selectedClubId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [eventDetail, setEventDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await getApprovedEventsByClub(selectedClubId);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setEvents(list);
    } catch (err) {
      console.error('[EventCalendar] Lỗi tải sự kiện đã duyệt:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleViewDetail = async (eventId, eFallback) => {
    if (!eventId) return;
    setShowDetailModal(true);
    setLoadingDetail(true);
    setEventDetail(null);
    try {
      const data = await getEventDetail(eventId);
      setEventDetail(data?.data ?? data);
    } catch (err) {
      console.error('[EventCalendar] Lỗi tải chi tiết sự kiện:', err);
      setEventDetail(eFallback);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="event-calendar-container">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title"><Calendar size={18} /> Lịch sự kiện đã được duyệt</h3>
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
          Danh sách các sự kiện của CLB đã được Phòng ban duyệt và chính thức được tổ chức.
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
            <p>Chưa có sự kiện nào được duyệt trong CLB này.</p>
          </div>
        </div>
      ) : (
        <div className="calendar-grid">
          {events.map(e => {
            const eId = e.id || e.eventId;
            const eName = e.eventName || e.name;
            const eLocation = e.location || e.venue;
            const eTime = e.startTime || e.dateTime;
            const eEndTime = e.endTime;
            const eDesc = e.description || '';
            const eBudget = e.planBudget || e.budget;
            return (
              <div key={eId} className="glass-card calendar-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className="badge badge-active" style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <CheckCircle size={10} /> Đã duyệt
                  </span>

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
                      <span>
                        {new Date(eTime).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => handleViewDetail(eId, e)}
                  >
                    <Eye size={12} /> Chi tiết sự kiện
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAIL EVENT MODAL */}
      {showDetailModal && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '520px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Calendar size={18} style={{ marginRight: '6px' }} /> Chi tiết Sự kiện</h3>
              <button className="modal-close" onClick={() => { setShowDetailModal(false); setEventDetail(null); }}><X size={18} /></button>
            </div>
            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div className="login-spinner" style={{ margin: '0 auto' }}></div>
              </div>
            ) : eventDetail ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <h4 style={{ fontSize: '18px', color: 'var(--text-heading)', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  {eventDetail.eventName || eventDetail.name}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    ['Ngày bắt đầu', eventDetail.startTime ? new Date(eventDetail.startTime).toLocaleString('vi-VN') : 'N/A'],
                    ['Ngày kết thúc', eventDetail.endTime ? new Date(eventDetail.endTime).toLocaleString('vi-VN') : 'N/A'],
                    ['Địa điểm', eventDetail.location || eventDetail.venue || 'N/A'],
                    ['Ngân sách dự toán', eventDetail.planBudget || eventDetail.budget ? `${(eventDetail.planBudget || eventDetail.budget)}đ` : 'N/A'],
                    ['Số lượng dự kiến', eventDetail.targetParticipants ? `${eventDetail.targetParticipants} người` : 'N/A'],
                    ['Trạng thái duyệt', <span className="badge badge-active">Đã duyệt</span>],
                    ['Mô tả chi tiết', eventDetail.description || 'Không có mô tả chi tiết']
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <span style={{ minWidth: '150px', fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-main)', wordBreak: 'break-all' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>Không tải được thông tin sự kiện.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
