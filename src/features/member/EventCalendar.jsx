import React, { useState, useEffect, useCallback } from 'react';
import { getApprovedEventsByClub, getEventDetail, registerEvent } from '../../services/eventService';
import { getUserActivityHistory } from '../../services/userService';
import { Calendar, MapPin, RefreshCw, CheckCircle, Eye, X, UserPlus, Check, Paperclip, FileText, Download } from 'lucide-react';
import { parseDateVN, formatDateVN } from '../../utils/validator';

export default function EventCalendar({ currentUserId, triggerNotification, selectedClubId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [eventDetail, setEventDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Tracking registered events locally
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [registeringId, setRegisteringId] = useState(null);

  const fetchUserRegisteredEvents = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const res = await getUserActivityHistory(currentUserId);
      const rawData = res?.data ?? res;
      if (rawData && Array.isArray(rawData.eventHistory)) {
        const ids = rawData.eventHistory.map(ev => ev.eventId).filter(Boolean);
        setRegisteredIds(prev => {
          const next = new Set(prev);
          ids.forEach(id => {
            next.add(Number(id));
            next.add(String(id));
          });
          return next;
        });
      }
    } catch (err) {
      console.warn('[EventCalendar] Lỗi lấy lịch sử hoạt động để kiểm tra đăng ký:', err);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      const saved = localStorage.getItem(`fpt_registered_events_${currentUserId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRegisteredIds(prev => {
              const next = new Set(prev);
              parsed.forEach(id => {
                next.add(Number(id));
                next.add(String(id));
              });
              return next;
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
      fetchUserRegisteredEvents();
    }
  }, [currentUserId, fetchUserRegisteredEvents]);

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

  const handleRegister = async (eventId, eventName) => {
    if (!currentUserId) {
      triggerNotification('Vui lòng đăng nhập để đăng ký sự kiện!', 'warning');
      return;
    }
    setRegisteringId(eventId);
    try {
      await registerEvent(eventId, { roleInEvent: 'Participant' });
      triggerNotification(`Đăng ký tham gia sự kiện "${eventName}" thành công!`, 'success');
      
      setRegisteredIds(prev => {
        const next = new Set(prev);
        next.add(Number(eventId));
        next.add(String(eventId));
        localStorage.setItem(`fpt_registered_events_${currentUserId}`, JSON.stringify(Array.from(next)));
        return next;
      });
    } catch (err) {
      console.error('[EventCalendar] Lỗi đăng ký sự kiện:', err);
      triggerNotification(err?.response?.data?.message || 'Đăng ký tham gia sự kiện thất bại!', 'error');
    } finally {
      setRegisteringId(null);
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
            const now = new Date();
            const start = parseDateVN(eTime);
            const end = eEndTime ? parseDateVN(eEndTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration fallback

            let statusLabel = 'Sắp diễn ra';
            let statusClass = 'badge-active'; // Green
            let canRegister = true;
            let isOngoing = false;

            if (e.status === 'Cancelled' || e.status === 'Đã hủy' || e.status === 'Bị hủy') {
              statusLabel = 'Đã hủy';
              statusClass = 'badge-blocked'; // Red
              canRegister = false;
            } else if (now < start) {
              statusLabel = 'Sắp diễn ra';
              statusClass = 'badge-active'; // Green
              canRegister = true;
            } else if (now >= start && now <= end) {
              statusLabel = 'Đang diễn ra';
              statusClass = 'badge-pending'; // Yellow
              canRegister = false;
              isOngoing = true;
            } else {
              statusLabel = 'Đã kết thúc';
              statusClass = 'badge-member'; // Grey/Blue
              canRegister = false;
            }

            return (
              <div key={eId} className="glass-card calendar-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span className={`badge ${statusClass}`} style={{ marginBottom: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    {statusLabel}
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
                        {formatDateVN(eTime)}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => handleViewDetail(eId, e)}
                  >
                    <Eye size={12} /> Chi tiết
                  </button>

                  {registeredIds.has(Number(eId)) || registeredIds.has(String(eId)) ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'default', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }}
                      disabled
                    >
                      <Check size={12} /> Đã đăng ký
                    </button>
                  ) : !canRegister ? (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: 0.5, cursor: 'not-allowed' }}
                      disabled
                    >
                      {isOngoing ? 'Đang diễn ra' : 'Hết hạn đăng ký'}
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      onClick={() => handleRegister(eId, eName)}
                      disabled={registeringId === eId}
                    >
                      <UserPlus size={12} /> {registeringId === eId ? 'Đang gửi...' : 'Đăng ký'}
                    </button>
                  )}
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

                {(() => {
                  const now = new Date();
                  const start = new Date(eventDetail.startTime);
                  const end = eventDetail.endTime ? new Date(eventDetail.endTime) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

                  let statusLabel = 'Sắp diễn ra';
                  let statusClass = 'badge-active';
                  let canRegister = true;
                  let isOngoing = false;

                  if (eventDetail.status === 'Cancelled' || eventDetail.status === 'Đã hủy' || eventDetail.status === 'Bị hủy') {
                    statusLabel = 'Đã hủy';
                    statusClass = 'badge-blocked';
                    canRegister = false;
                  } else if (now < start) {
                    statusLabel = 'Sắp diễn ra';
                    statusClass = 'badge-active';
                    canRegister = true;
                  } else if (now >= start && now <= end) {
                    statusLabel = 'Đang diễn ra';
                    statusClass = 'badge-pending';
                    canRegister = false;
                    isOngoing = true;
                  } else {
                    statusLabel = 'Đã kết thúc';
                    statusClass = 'badge-member';
                    canRegister = false;
                  }

                  return (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          ['Ngày bắt đầu', eventDetail.startTime ? formatDateVN(eventDetail.startTime) : 'N/A'],
                          ['Ngày kết thúc', eventDetail.endTime ? formatDateVN(eventDetail.endTime) : 'N/A'],
                          ['Địa điểm', eventDetail.location || eventDetail.venue || 'N/A'],
                          ['Ngân sách dự toán', eventDetail.planBudget || eventDetail.budget ? `${(eventDetail.planBudget || eventDetail.budget)}đ` : 'N/A'],
                          ['Số lượng dự kiến', eventDetail.targetParticipants ? `${eventDetail.targetParticipants} người` : 'N/A'],
                          ['Trạng thái', <span className={`badge ${statusClass}`}>{statusLabel}</span>],
                          ['Mô tả chi tiết', eventDetail.description || 'Không có mô tả chi tiết']
                        ].map(([label, value]) => (
                          <div key={label} style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <span style={{ minWidth: '150px', fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-main)', wordBreak: 'break-all' }}>{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* File đính kèm / Kế hoạch & Hình ảnh cho Member & Leader xem */}
                      {(() => {
                        const eId = eventDetail.id || eventDetail.eventId;
                        const eName = eventDetail.eventName || eventDetail.name;
                        let attachedFiles = eventDetail.files || eventDetail.documents || eventDetail.attachments || [];
                        if (!Array.isArray(attachedFiles) || attachedFiles.length === 0) {
                          const byId = localStorage.getItem(`fpt_event_files_${eId}`);
                          const byName = localStorage.getItem(`fpt_event_files_${eName}`);
                          const str = byId || byName;
                          if (str) {
                            try { attachedFiles = JSON.parse(str); } catch {}
                          }
                        }

                        if (!attachedFiles || attachedFiles.length === 0) return null;

                        const isImageFile = (file) => {
                          const name = (file.name || file.fileName || file.url || file.path || '').toLowerCase();
                          const type = (file.type || '').toLowerCase();
                          return type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
                        };

                        return (
                          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '12px' }}>
                            <strong style={{ fontSize: '13px', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                              <Paperclip size={14} style={{ color: 'var(--primary)' }} /> Tài liệu &amp; Hình ảnh đính kèm ({attachedFiles.length}):
                            </strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {attachedFiles.map((file, idx) => {
                                const fileName = file.name || file.fileName || `Tài_liệu_${idx + 1}`;
                                const fileSize = file.size ? `${(file.size / 1024).toFixed(1)} KB` : '';
                                const fileUrl = file.url || file.fileUrl || file.path;
                                const isImg = isImageFile(file);

                                const handleDownload = () => {
                                  if (!fileUrl) {
                                    alert('Không tìm thấy đường dẫn file!');
                                    return;
                                  }
                                  const a = document.createElement('a');
                                  a.href = fileUrl;
                                  a.download = fileName;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                };

                                if (isImg) {
                                  return (
                                    <div key={idx} style={{ padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 600 }}>🖼️ {fileName}</span>
                                        {fileUrl && (
                                          <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={handleDownload}
                                            style={{ fontSize: '11px', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                          >
                                            <Download size={12} /> Tải ảnh
                                          </button>
                                        )}
                                      </div>
                                      {fileUrl && (
                                        <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '8px' }}>
                                          <img src={fileUrl} alt={fileName} style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '4px', objectFit: 'contain' }} />
                                        </div>
                                      )}
                                    </div>
                                  );
                                }

                                return (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                      <FileText size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                      <span style={{ fontSize: '12px', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {fileName} {fileSize && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({fileSize})</span>}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      onClick={handleDownload}
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 10px', flexShrink: 0 }}
                                    >
                                      <Download size={12} /> Tải về
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                        {registeredIds.has(Number(eventDetail.id || eventDetail.eventId)) || registeredIds.has(String(eventDetail.id || eventDetail.eventId)) ? (
                          <button
                            className="btn btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'default', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' }}
                            disabled
                          >
                            <Check size={14} /> Đã đăng ký tham gia sự kiện
                          </button>
                        ) : !canRegister ? (
                          <button
                            className="btn btn-secondary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: 0.5, cursor: 'not-allowed' }}
                            disabled
                          >
                            {isOngoing ? 'Đang diễn ra (Không thể đăng ký)' : 'Hết hạn đăng ký'}
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => {
                              const evId = eventDetail.id || eventDetail.eventId;
                              handleRegister(evId, eventDetail.eventName || eventDetail.name);
                            }}
                            disabled={registeringId === (eventDetail.id || eventDetail.eventId)}
                          >
                            <UserPlus size={14} /> {registeringId === (eventDetail.id || eventDetail.eventId) ? 'Đang xử lý...' : 'Đăng ký tham gia ngay'}
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
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
