import React, { useState, useEffect, useCallback } from 'react';
import { createEvent, getEventsByClub, cancelEvent, updateEvent } from '../../services/eventService';
import { Calendar, Plus, MapPin, AlertTriangle, Edit, X, Save, XCircle } from 'lucide-react';

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
  
  // Validation errors state
  const [errors, setErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});

  const backendClubId = selectedClubId;

  // Regex helper for special characters
  const validateNoSpecialChars = (text) => {
    if (!text) return true;
    // Allow unicode letters, digits, whitespace, and basic punctuation: - . , ( ) / + ? ! : # ' " @ _
    const regex = /^[\p{L}\p{N}\s\-.,()\/+?!:#$'"@_]*$/u;
    return regex.test(text);
  };

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
    const newErrors = {};

    // --- Validation logic ---
    if (!newEvent.eventName.trim()) {
      newErrors.eventName = 'Vui lòng nhập Tên chương trình / sự kiện!';
    } else if (!validateNoSpecialChars(newEvent.eventName)) {
      newErrors.eventName = 'Tên chương trình không được chứa ký tự lạ!';
    }

    if (!newEvent.startTime) {
      newErrors.startTime = 'Vui lòng chọn Thời gian bắt đầu!';
    } else if (new Date(newEvent.startTime) <= now) {
      newErrors.startTime = 'Thời gian bắt đầu phải là thời điểm trong tương lai!';
    }

    if (newEvent.endTime && new Date(newEvent.endTime) <= new Date(newEvent.startTime)) {
      newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu!';
    }

    if (!newEvent.location.trim()) {
      newErrors.location = 'Vui lòng nhập Địa điểm tổ chức!';
    } else if (!validateNoSpecialChars(newEvent.location)) {
      newErrors.location = 'Địa điểm tổ chức không được chứa ký tự lạ!';
    }

    if (newEvent.description && !validateNoSpecialChars(newEvent.description)) {
      newErrors.description = 'Mô tả chương trình không được chứa ký tự lạ!';
    }

    const budgetNum = Number(String(newEvent.planBudget).replace(/,/g, ''));
    if (!newEvent.planBudget) {
      newErrors.planBudget = 'Vui lòng nhập Ngân sách dự trù!';
    } else if (isNaN(budgetNum) || budgetNum < 0) {
      newErrors.planBudget = 'Ngân sách không hợp lệ (phải là số không âm)!';
    }

    const participantsNum = Number(newEvent.targetParticipants);
    if (newEvent.targetParticipants && (isNaN(participantsNum) || participantsNum <= 0)) {
      newErrors.targetParticipants = 'Số người dự kiến phải là số nguyên lớn hơn 0!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerNotification('❌ Vui lòng sửa các lỗi nhập liệu dưới đây!', 'warning');
      return;
    }

    setErrors({});
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
    const now = new Date();
    const newErrors = {};

    if (!editingEvent.eventName?.trim()) {
      newErrors.eventName = 'Vui lòng nhập Tên chương trình / sự kiện!';
    } else if (!validateNoSpecialChars(editingEvent.eventName)) {
      newErrors.eventName = 'Tên chương trình không được chứa ký tự lạ!';
    }

    if (!editingEvent.startTime) {
      newErrors.startTime = 'Vui lòng chọn Thời gian bắt đầu!';
    }

    if (editingEvent.endTime && new Date(editingEvent.endTime) <= new Date(editingEvent.startTime)) {
      newErrors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu!';
    }

    if (!editingEvent.location?.trim()) {
      newErrors.location = 'Vui lòng nhập Địa điểm!';
    } else if (!validateNoSpecialChars(editingEvent.location)) {
      newErrors.location = 'Địa điểm không được chứa ký tự lạ!';
    }

    if (editingEvent.description && !validateNoSpecialChars(editingEvent.description)) {
      newErrors.description = 'Mô tả không được chứa ký tự lạ!';
    }

    const budgetNum = Number(String(editingEvent.planBudget).replace(/,/g, ''));
    if (!editingEvent.planBudget) {
      newErrors.planBudget = 'Vui lòng nhập Ngân sách!';
    } else if (isNaN(budgetNum) || budgetNum < 0) {
      newErrors.planBudget = 'Ngân sách không hợp lệ!';
    }

    const participantsNum = Number(editingEvent.targetParticipants);
    if (editingEvent.targetParticipants && (isNaN(participantsNum) || participantsNum <= 0)) {
      newErrors.targetParticipants = 'Số người dự kiến phải là số lớn hơn 0!';
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      triggerNotification('❌ Vui lòng sửa các lỗi nhập liệu dưới đây!', 'warning');
      return;
    }

    setEditErrors({});
    setIsUpdating(true);
    try {
      await updateEvent(editingEvent.id || editingEvent.eventId, {
        eventName: editingEvent.eventName.trim(),
        description: editingEvent.description || '',
        location: editingEvent.location.trim(),
        planBudget: String(editingEvent.planBudget).replace(/,/g, ''),
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Create Event Form */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Plus size={18} /> Lập kế hoạch sự kiện mới</h3>
            </div>
            
            <form onSubmit={handleCreateEvent} noValidate>
              <div className="form-group">
                <label>Tên chương trình / sự kiện <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
                <input
                  type="text"
                  className="input-field"
                  value={newEvent.eventName}
                  onChange={e => {
                    setNewEvent({ ...newEvent, eventName: e.target.value });
                    if (errors.eventName) setErrors(prev => ({ ...prev, eventName: null }));
                  }}
                  placeholder="Workshop, Đại hội, Teambuilding..."
                />
                {errors.eventName && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.eventName}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời gian bắt đầu <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newEvent.startTime}
                    onChange={e => {
                      setNewEvent({ ...newEvent, startTime: e.target.value });
                      if (errors.startTime) setErrors(prev => ({ ...prev, startTime: null }));
                    }}
                  />
                  {errors.startTime && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.startTime}</span>}
                </div>
                <div className="form-group">
                  <label>Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newEvent.endTime}
                    min={newEvent.startTime || undefined}
                    onChange={e => {
                      setNewEvent({ ...newEvent, endTime: e.target.value });
                      if (errors.endTime) setErrors(prev => ({ ...prev, endTime: null }));
                    }}
                  />
                  {errors.endTime && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.endTime}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Ngân sách dự trù (VNĐ) <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
                  <input
                    type="text"
                    className="input-field"
                    value={newEvent.planBudget}
                    onChange={e => {
                      setNewEvent({ ...newEvent, planBudget: e.target.value });
                      if (errors.planBudget) setErrors(prev => ({ ...prev, planBudget: null }));
                    }}
                    placeholder="1,500,000"
                  />
                  {errors.planBudget && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.planBudget}</span>}
                </div>
                <div className="form-group">
                  <label>Số lượng tham gia dự kiến</label>
                  <input
                    type="number"
                    className="input-field"
                    value={newEvent.targetParticipants}
                    onChange={e => {
                      setNewEvent({ ...newEvent, targetParticipants: e.target.value });
                      if (errors.targetParticipants) setErrors(prev => ({ ...prev, targetParticipants: null }));
                    }}
                    placeholder="50"
                    min="1"
                  />
                  {errors.targetParticipants && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.targetParticipants}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Địa điểm tổ chức <span style={{ color: 'var(--error, #ef4444)' }}>*</span></label>
                <input
                  type="text"
                  className="input-field"
                  value={newEvent.location}
                  onChange={e => {
                    setNewEvent({ ...newEvent, location: e.target.value });
                    if (errors.location) setErrors(prev => ({ ...prev, location: null }));
                  }}
                  placeholder="Phòng họp Alpha, Sân thượng Gamma..."
                />
                {errors.location && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.location}</span>}
              </div>

              <div className="form-group">
                <label>Mô tả ngắn gọn chương trình</label>
                <textarea
                  className="textarea-field"
                  value={newEvent.description}
                  onChange={e => {
                    setNewEvent({ ...newEvent, description: e.target.value });
                    if (errors.description) setErrors(prev => ({ ...prev, description: null }));
                  }}
                  placeholder="Nội dung, kế hoạch chạy truyền thông..."
                  rows={2}
                />
                {errors.description && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.description}</span>}
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
              <div className="empty-state-view">
                <Calendar className="empty-state-icon" />
                <p>Chưa có sự kiện nào được tạo.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {events.map(e => {
                  const eId = e.id || e.eventId;
                  const eName = e.eventName || e.name;
                  const eLocation = e.location || 'Chưa cập nhật';
                  const eBudget = e.planBudget;
                  const eStatus = e.status || e.approvalStatus || 'Pending';
                  
                  const isPending = eStatus === 'Pending' || eStatus === 'Chờ duyệt';
                  const isApproved = eStatus === 'Approved' || eStatus === 'Đã duyệt';
                  const isRejected = eStatus === 'Rejected' || eStatus === 'Từ chối';
                  const isCancelled = eStatus === 'Cancelled' || eStatus === 'Đã hủy';

                  return (
                    <div key={eId} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: 'var(--text-heading)' }}>{eName}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin size={12} /> {eLocation}
                            </span>
                            {eBudget && (
                              <span>💰 Ngân sách: {Number(eBudget).toLocaleString('vi-VN')} VNĐ</span>
                            )}
                          </div>
                          {e.startTime && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              ⏱ {new Date(e.startTime).toLocaleString('vi-VN')}
                              {e.endTime && ` - ${new Date(e.endTime).toLocaleString('vi-VN')}`}
                            </div>
                          )}
                        </div>

                        <div>
                          {isPending && <span className="badge badge-pending">CHỜ DUYỆT</span>}
                          {isApproved && <span className="badge badge-success">ĐÃ DUYỆT</span>}
                          {isRejected && <span className="badge badge-blocked">BỊ TỪ CHỐI</span>}
                          {isCancelled && <span className="badge badge-blocked" style={{ filter: 'grayscale(0.6)' }}>ĐÃ HỦỶ</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '12px', paddingTop: '8px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => setSelectedEventId(eId)}
                          disabled={selectedEventId === eId}
                        >
                          Xem chi tiết
                        </button>
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
                                setEditErrors({});
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

      {/* MODAL: SỬA SỰ KIỆN */}
      {showEditModal && editingEvent && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit size={16} style={{ marginRight: '6px' }} /> Sửa Sự kiện</h3>
              <button className="modal-close" onClick={() => { setShowEditModal(false); setEditingEvent(null); }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateEvent} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
              <div className="form-group">
                <label>Tên sự kiện *</label>
                <input type="text" className="input-field" value={editingEvent.eventName || ''}
                  onChange={e => {
                    setEditingEvent({ ...editingEvent, eventName: e.target.value });
                    if (editErrors.eventName) setEditErrors(prev => ({ ...prev, eventName: null }));
                  }} />
                {editErrors.eventName && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{editErrors.eventName}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Thời gian bắt đầu *</label>
                  <input type="datetime-local" className="input-field" value={editingEvent.startTime || ''}
                    onChange={e => {
                      setEditingEvent({ ...editingEvent, startTime: e.target.value });
                      if (editErrors.startTime) setEditErrors(prev => ({ ...prev, startTime: null }));
                    }} />
                  {editErrors.startTime && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{editErrors.startTime}</span>}
                </div>
                <div className="form-group">
                  <label>Thời gian kết thúc</label>
                  <input type="datetime-local" className="input-field" value={editingEvent.endTime || ''}
                    onChange={e => {
                      setEditingEvent({ ...editingEvent, endTime: e.target.value });
                      if (editErrors.endTime) setEditErrors(prev => ({ ...prev, endTime: null }));
                    }} />
                  {editErrors.endTime && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{editErrors.endTime}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Ngân sách (VNĐ) *</label>
                  <input type="text" className="input-field" value={editingEvent.planBudget || ''}
                    onChange={e => {
                      setEditingEvent({ ...editingEvent, planBudget: e.target.value });
                      if (editErrors.planBudget) setEditErrors(prev => ({ ...prev, planBudget: null }));
                    }} />
                  {editErrors.planBudget && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{editErrors.planBudget}</span>}
                </div>
                <div className="form-group">
                  <label>Số người tham gia dự kiến</label>
                  <input type="number" className="input-field" value={editingEvent.targetParticipants || ''}
                    onChange={e => {
                      setEditingEvent({ ...editingEvent, targetParticipants: e.target.value });
                      if (editErrors.targetParticipants) setEditErrors(prev => ({ ...prev, targetParticipants: null }));
                    }} min="1" />
                  {editErrors.targetParticipants && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{editErrors.targetParticipants}</span>}
                </div>
              </div>
              <div className="form-group">
                <label>Địa điểm *</label>
                <input type="text" className="input-field" value={editingEvent.location || ''}
                  onChange={e => {
                    setEditingEvent({ ...editingEvent, location: e.target.value });
                    if (editErrors.location) setEditErrors(prev => ({ ...prev, location: null }));
                  }} />
                {editErrors.location && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{editErrors.location}</span>}
              </div>
              <div className="form-group">
                <label>Mô tả</label>
                <textarea className="textarea-field" rows={2} value={editingEvent.description || ''}
                  onChange={e => {
                    setEditingEvent({ ...editingEvent, description: e.target.value });
                    if (editErrors.description) setEditErrors(prev => ({ ...prev, description: null }));
                  }} />
                {editErrors.description && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{editErrors.description}</span>}
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
