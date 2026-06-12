import React, { useState, useEffect, useCallback } from 'react';
import { createEvent, getEventsByClub } from '../../services/eventService';
import { Calendar, Plus, UserCheck, MapPin } from 'lucide-react';

// Chuyển mock club ID (string) sang backend numeric ID
const toBackendClubId = (id) => {
  const map = { js: 1, fcode: 2, melody: 3, chess: 4, fsa: 5, dance: 6 };
  return map[id] ?? Number(id) ?? id;
};

export default function EventManager({ dbData, selectedClubId, triggerNotification }) {
  const { participants, users } = dbData;

  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const backendClubId = toBackendClubId(selectedClubId);

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
    if (!newEvent.eventName || !newEvent.startTime || !newEvent.location || !newEvent.planBudget) {
      triggerNotification('Vui lòng nhập đầy đủ thông tin sự kiện!', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build multipart/form-data
      const formData = new FormData();
      formData.append('ClubId', backendClubId);
      formData.append('EventName', newEvent.eventName);
      formData.append('Description', newEvent.description || '');
      formData.append('Location', newEvent.location);
      formData.append('PlanBudget', newEvent.planBudget);
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
      triggerNotification(`Đã tạo kế hoạch sự kiện: ${newEvent.eventName}`, 'success');
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
      triggerNotification(
        err?.response?.data?.message || 'Tạo sự kiện thất bại. Vui lòng thử lại!',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Điểm danh vẫn dùng mockDb (chưa có API riêng)
  const handleToggleAttendance = (userId, currentStatus) => {
    if (!selectedEventId) return;
    const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    // mockDb.updateAttendance(selectedEventId, userId, nextStatus);
    triggerNotification(`Đã cập nhật điểm danh thành công!`, 'success');
  };

  // Get participants of selected event (vẫn từ mockDb cho đến khi có API)
  const eventParticipants = selectedEventId
    ? participants.filter(p => p.eventId === selectedEventId)
    : [];

  const getUsername = (userId) => {
    const u = users.find(user => user.id === userId);
    return u ? u.fullName : userId;
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
                <label>Tên chương trình / sự kiện</label>
                <input
                  type="text"
                  className="input-field"
                  value={newEvent.eventName}
                  onChange={e => setNewEvent({ ...newEvent, eventName: e.target.value })}
                  placeholder="Workshop, Đại hội, Teambuilding..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời gian bắt đầu</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newEvent.startTime}
                    onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={newEvent.endTime}
                    onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
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
                <label>Địa điểm tổ chức</label>
                <input
                  type="text"
                  className="input-field"
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Phòng họp Alpha, Sân thượng Gamma..."
                  required
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
                  return (
                    <div
                      key={eId}
                      className={`nav-item ${selectedEventId === eId ? 'active' : ''}`}
                      onClick={() => setSelectedEventId(eId)}
                      style={{ border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{eName}</div>
                        <div style={{ fontSize: '11px', display: 'flex', gap: '12px', marginTop: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {eLocation}</span>
                          {eTime && <span>{new Date(eTime).toLocaleString('vi-VN')}</span>}
                        </div>
                      </div>
                      <div>
                        {eBudget && (
                          <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                            {typeof eBudget === 'number' ? eBudget.toLocaleString('vi-VN') : eBudget}đ
                          </span>
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

              {eventParticipants.length === 0 ? (
                <div className="empty-state-view">
                  <p>Chưa có sinh viên nào đăng ký tham gia sự kiện này.</p>
                  <p style={{ fontSize: '12px' }}>Sinh viên có thể đăng ký trực tiếp ở vai trò MEMBER.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>MSSV</th>
                        <th>Họ tên sinh viên</th>
                        <th>Ngày đăng ký</th>
                        <th style={{ textAlign: 'center' }}>Điểm danh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventParticipants.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.userId}</strong></td>
                          <td>{getUsername(p.userId)}</td>
                          <td>{p.registeredAt}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <input
                                type="checkbox"
                                checked={p.attendanceStatus === 'Present'}
                                onChange={() => handleToggleAttendance(p.userId, p.attendanceStatus)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                                id={`check-${p.userId}`}
                              />
                              <label htmlFor={`check-${p.userId}`} style={{ cursor: 'pointer' }}>
                                <span className={`badge ${p.attendanceStatus === 'Present' ? 'badge-active' : 'badge-blocked'}`}>
                                  {p.attendanceStatus === 'Present' ? 'Có mặt' : 'Vắng mặt'}
                                </span>
                              </label>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
