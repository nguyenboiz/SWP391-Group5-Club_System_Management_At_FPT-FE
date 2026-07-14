import React, { useState, useEffect, useCallback } from 'react';
import { createEvent, getEventsByClub, cancelEvent, updateEvent } from '../../services/eventService';
import { Calendar, Plus, UserCheck, MapPin, AlertTriangle, Edit, X, Save, XCircle } from 'lucide-react';

export default function EventManager({ selectedClubId, triggerNotification }) {

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit event
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Cancel event confirm
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [newEvent, setNewEvent] = useState({
    eventName: '',
    startTime: '',
    endTime: '',
    location: '',
    planBudget: '',
    targetParticipants: '',
    description: '',
    files: []
  });
  const [selectedEventId, setSelectedEventId] = useState(null);

  const backendClubId = selectedClubId;

  // Load events từ API khi selectedClubId thay đổi
  const loadEvents = useCallback(async () => {
    if (!selectedClubId) return;
    setLoadingEvents(true);
    try {
      const data = await getEventsByClub(backendClubId);
      setEvents(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err) {
      console.error('[EventManager] Lỗi tải sự kiện:', err);
      triggerNotification('Không tải được danh sách sự kiện!', 'error');
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [backendClubId, triggerNotification]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const selectedEvent = events.find(e => (e.id || e.eventId) === selectedEventId);

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    const now = new Date();

    // --- Kiểm tra từng trường rõ ràng ---
    if (!newEvent.eventName.trim()) {
      triggerNotification('❌ Vui lòng nhập Tên chương trình / sự kiện!', 'warning');
      return;
    }
    if (!newEvent.startTime) {
      triggerNotification('❌ Vui lòng chọn Thời gian bắt đầu!', 'warning');
      return;
    }
    if (new Date(newEvent.startTime) <= now) {
      triggerNotification('❌ Thời gian bắt đầu phải là thời điểm trong tương lai!', 'warning');
      return;
    }
    if (!newEvent.location.trim()) {
      triggerNotification('❌ Vui lòng nhập Địa điểm tổ chức!', 'warning');
      return;
    }
    const budgetNum = Number(String(newEvent.planBudget).replace(/,/g, ''));
    if (!newEvent.planBudget || isNaN(budgetNum) || budgetNum < 0) {
      triggerNotification('❌ Ngân sách dự trù không hợp lệ (phải là số không âm, ví dụ: 1500000)!', 'warning');
      return;
    }
    if (newEvent.endTime && new Date(newEvent.endTime) <= new Date(newEvent.startTime)) {
      triggerNotification('❌ Thời gian kết thúc phải sau thời gian bắt đầu!', 'warning');
      return;
    }
    if (!selectedClubId) {
      triggerNotification('❌ Không xác định được CLB. Vui lòng chọn lại CLB trước khi tạo sự kiện!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build multipart/form-data
      const formData = new FormData();
      formData.append('ClubId', backendClubId);
      formData.append('EventName', newEvent.eventName.trim());
      formData.append('Description', newEvent.description || '');
      formData.append('Location', newEvent.location.trim());
      formData.append('PlanBudget', String(newEvent.planBudget).replace(/,/g, ''));
      formData.append('TargetParticipants', newEvent.targetParticipants || 0);
      formData.append('StartTime', new Date(newEvent.startTime).toISOString());
      formData.append('EndTime', newEvent.endTime ? new Date(newEvent.endTime).toISOString() : new Date(newEvent.startTime).toISOString());
      // Đính kèm files nếu có
      if (newEvent.files && newEvent.files.length > 0) {
        Array.from(newEvent.files).forEach(file => {
          formData.append('Files', file);
        });
      }

      await createEvent(formData);
      triggerNotification(`✅ Đã tạo kế hoạch sự kiện: ${newEvent.eventName}`, 'success');
      setNewEvent({
        eventName: '',
        startTime: '',
        endTime: '',
        location: '',
        planBudget: '',
        targetParticipants: '',
        description: '',
        files: []
      });
      // Reload danh sách sự kiện sau khi tạo
      await loadEvents();
    } catch (err) {
      console.error('[EventManager] Lỗi tạo sự kiện:', err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.title;
      if (status === 400) {
        triggerNotification(`❌ Dữ liệu không hợp lệ: ${serverMsg || 'Kiểm tra lại các trường nhập liệu!'}`, 'error');
      } else if (status === 401) {
        triggerNotification('❌ Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại!', 'error');
      } else if (status === 403) {
        triggerNotification('❌ Bạn không có quyền tạo sự kiện cho CLB này!', 'error');
      } else {
        triggerNotification(`❌ Tạo sự kiện thất bại: ${serverMsg || 'Lỗi máy chủ, vui lòng thử lại!'}`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // NOTE: BE chưa có API điểm danh. Placeholder cho đến khi BE bổ sung:
  //   POST /api/events/{eventId}/attendance
  //   GET  /api/events/{eventId}/participants
  const eventParticipants = [];

  const handleCancelEvent = async () => {
    if (!cancelTargetId) return;
    setIsCancelling(true);
    try {
      await cancelEvent(cancelTargetId);
      triggerNotification('Sự kiện đã được hủy thành công!', 'success');
      setCancelTargetId(null);
      await loadEvents();
    } catch (err) {
      triggerNotification(err?.response?.data?.message || 'Hủy sự kiện thất bại!', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsUpdating(true);
    try {
      await updateEvent(editingEvent.id || editingEvent.eventId, {
        eventName: editingEvent.eventName,
        description: editingEvent.description || '',
        location: editingEvent.location || '',
        planBudget: editingEvent.planBudget || '0',
        targetParticipants: Number(editingEvent.targetParticipants) || 0,
        startTime: new Date(editingEvent.startTime).toISOString(),
        endTime: editingEvent.endTime ? new Date(editingEvent.endTime).toISOString() : new Date(editingEvent.startTime).toISOString()
      });
      triggerNotification(`Cập nhật sự kiện: ${editingEvent.eventName} thành công!`, 'success');
      setShowEditModal(false);
      setEditingEvent(null);
      await loadEvents();
    } catch (err) {
      triggerNotification(err?.response?.data?.message || 'Cập nhật sự kiện thất bại!', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="event-manager-container">
      <div className="dashboard-grid-2col">
        {/* Left Side: Schedule and Event List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Create Event Form */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Plus size={18} /> Lập kế hoạch sự kiện mới</h3>
            </div>
            
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Tên chương trình / sự kiện <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
                <input
                  type="text"
                  className="input-field"
                  value={newEvent.eventName}
                  onChange={e => setNewEvent({ ...newEvent, eventName: e.target.value })}
                  placeholder="Workshop, Đại hội, Teambuilding..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời gian bắt đầu <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newEvent.startTime}
                    onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                  {!newEvent.startTime && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>Bắt buộc — chọn ngày giờ bắt đầu sự kiện</span>}
                </div>
                <div className="form-group">
                  <label>Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newEvent.endTime}
                    min={newEvent.startTime || undefined}
                    onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                  {newEvent.endTime && newEvent.endTime <= newEvent.startTime && (
                    <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>Thời gian kết thúc phải sau thời gian bắt đầu!</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngân sách dự trù (VNĐ)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={newEvent.planBudget}
                    onChange={e => setNewEvent({ ...newEvent, planBudget: e.target.value })}
                    placeholder="1,500,000"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Số lượng tham gia dự kiến</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newEvent.targetParticipants}
                    onChange={e => setNewEvent({ ...newEvent, targetParticipants: e.target.value })}
                    placeholder="50"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Địa điểm tổ chức <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
                <input
                  type="text"
                  className="input-field"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Phòng họp Alpha, Sân thượng Gamma..."
                />
              </div>

              <div className="form-group">
                <label>Mô tả ngắn gọn chương trình</label>
                <textarea
                  className="textarea-field"
                  value={newEvent.description}
                  onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Nội dung, kế hoạch chạy truyền thông..."
                  rows={2}
                />
              </div>

              <div className="form-group">
                <label>Đính kèm tài liệu (Files, tuỳ chọn)</label>
                <input
                  type="file"
                  className="input-field"
                  multiple
                  onChange={e => setNewEvent({ ...newEvent, files: e.target.files })}
                  style={{ padding: '8px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="login-spinner" />
                ) : (
                  <><Calendar size={16} /> Lên lịch &amp; Đăng ký sự kiện</>
                )}
              </button>
            </form>
          </div>

          {/* Events Directory */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Calendar size={18} /> Danh sách Sự kiện của CLB</h3>
            </div>

            {loadingEvents ? (
              <div className="empty-state-view">
                <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
                <p style={{ marginTop: '10px' }}>Đang tải...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="empty-state-view"><p>Chưa có sự kiện nào được tạo.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {events.map(e => {
                  const eId = e.id || e.eventId;
                  const eName = e.name || e.eventName;
                  const eLocation = e.venue || e.location;
                  const eTime = e.dateTime || e.startTime;
                  const eBudget = e.budget || e.planBudget;
                  const eStatus = e.status || '';
                  const isCancelled = eStatus === 'Cancelled' || eStatus === 'Đã hủy';
                  return (
                    <div
                      key={eId}
                      className={`nav-item ${selectedEventId === eId ? 'active' : ''}`}
                      onClick={() => setSelectedEventId(eId)}
                      style={{ border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', padding: '12px 16px', alignItems: 'center' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: isCancelled ? 'var(--text-muted)' : 'var(--text-heading)', textDecoration: isCancelled ? 'line-through' : 'none' }}>{eName}</div>
                        <div style={{ fontSize: '11px', display: 'flex', gap: '12px', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {eLocation}</span>
                          {eTime && <span>{new Date(eTime).toLocaleString('vi-VN')}</span>}
                          {eStatus && <span className={`badge ${isCancelled ? 'badge-blocked' : eStatus === 'Approved' || eStatus === 'Đã duyệt' ? 'badge-active' : 'badge-pending'}`} style={{ fontSize: '10px', padding: '1px 6px' }}>{eStatus}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0, marginLeft: '8px' }} onClick={ev => ev.stopPropagation()}>
                        {eBudget && (
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', fontSize: '11px' }}>
                            {typeof eBudget === 'number' ? eBudget.toLocaleString('vi-VN') : eBudget}đ
                          </span>
                        )}
                        {!isCancelled && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Sửa sự kiện"
                              style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              onClick={() => {
                                const st = e.startTime ? e.startTime.slice(0,16) : '';
                                const et = e.endTime ? e.endTime.slice(0,16) : '';
                                setEditingEvent({ ...e, eventName: eName, location: eLocation, startTime: st, endTime: et, planBudget: eBudget || '' });
                                setShowEditModal(true);
                              }}
                            >
                              <Edit size={11} /> Sửa
                            </button>
                            <button
                              className="btn btn-sm"
                              title="Hủy sự kiện"
                              style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
                              onClick={() => setCancelTargetId(eId)}
                            >
                              <XCircle size={11} /> Hủy
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Attendance Sheets */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title"><UserCheck size={18} /> Điểm danh Tham gia Sự kiện</h3>
          </div>

          {!selectedEvent ? (
            <div className="empty-state-view">
              <UserCheck className="empty-state-icon" />
              <p>Chọn một sự kiện từ danh sách bên trái để mở trang điểm danh.</p>
            </div>
          ) : (
            <div>
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.15)', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '16px', color: 'var(--primary)' }}>{selectedEvent.name || selectedEvent.eventName}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Địa điểm: {selectedEvent.venue || selectedEvent.location} | Khởi động: {new Date(selectedEvent.dateTime || selectedEvent.startTime).toLocaleString('vi-VN')}
                </p>
                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-main)' }}>
                  Tổng số đăng ký: <strong>{eventParticipants.length}</strong> |{' '}
                  Có mặt: <strong style={{ color: 'var(--success)' }}>{eventParticipants.filter(p => p.attendanceStatus === 'Present').length}</strong> |{' '}
                  Vắng mặt: <strong style={{ color: 'var(--error)' }}>{eventParticipants.filter(p => p.attendanceStatus === 'Absent' || p.attendanceStatus === 'Registered').length}</strong>
                </div>
              </div>

              <div className="empty-state-view">
                <AlertTriangle className="empty-state-icon" style={{ color: 'var(--warning)' }} />
                <p>Chức năng điểm danh đang chờ BE bổ sung API.</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Yêu cầu BE bổ sung: <code>GET /api/events/&#123;eventId&#125;/participants</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: SỬA SỰ KIỆN */}
      {showEditModal && editingEvent && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit size={16} style={{ marginRight: '6px' }} /> Sửa Sự kiện</h3>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingEvent(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div className="form-group">
                <label>Tên sự kiện *</label>
                <input type="text" className="input-field" value={editingEvent.eventName || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, eventName: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Thời gian bắt đầu</label>
                  <input type="datetime-local" className="input-field" value={editingEvent.startTime || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Thời gian kết thúc</label>
                  <input type="datetime-local" className="input-field" value={editingEvent.endTime || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, endTime: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ngân sách (VNĐ)</label>
                  <input type="text" className="input-field" value={editingEvent.planBudget || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, planBudget: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Số người tham gia dự kiến</label>
                  <input type="number" className="input-field" value={editingEvent.targetParticipants || ''}
                    onChange={e => setEditingEvent({ ...editingEvent, targetParticipants: e.target.value })} min="1" />
                </div>
              </div>
              <div className="form-group">
                <label>Địa điểm</label>
                <input type="text" className="input-field" value={editingEvent.location || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea className="textarea-field" rows={2} value={editingEvent.description || ''}
                  onChange={e => setEditingEvent({ ...editingEvent, description: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isUpdating}>
                  <Save size={14} /> {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowEditModal(false); setEditingEvent(null); }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM: HỦY SỰ KIỆN */}
      {cancelTargetId && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--error)' }}><XCircle size={16} style={{ marginRight: '6px' }} /> Xác nhận Hủy Sự kiện</h3>
              <button className="modal-close" onClick={() => setCancelTargetId(null)}><X size={18} /></button>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, margin: '16px 0' }}>
              Bạn có chắc chắn muốn hủy sự kiện này không? Hành động này <strong>không thể hoàn tác</strong>.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={handleCancelEvent}
                disabled={isCancelling}
              >
                {isCancelling ? 'Đang hủy...' : 'Đồng ý Hủy sự kiện'}
              </button>
              <button className="btn btn-secondary" onClick={() => setCancelTargetId(null)}>Không</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
