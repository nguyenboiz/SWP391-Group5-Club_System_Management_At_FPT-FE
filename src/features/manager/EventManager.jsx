import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { Calendar, Plus, UserCheck, DollarSign, MapPin, Search } from 'lucide-react';

export default function EventManager({ dbData, selectedClubId, triggerNotification }) {
  const { events, participants, users } = dbData;

  const [newEvent, setNewEvent] = useState({ name: '', dateTime: '', venue: '', budget: '', description: '' });
  const [selectedEventId, setSelectedEventId] = useState(null);

  const clubEvents = events.filter(e => e.clubId === selectedClubId);
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.dateTime || !newEvent.venue || !newEvent.budget) {
      triggerNotification('Vui lòng nhập đầy đủ thông tin sự kiện!', 'warning');
      return;
    }

    mockDb.addEvent({
      clubId: selectedClubId,
      name: newEvent.name,
      dateTime: newEvent.dateTime,
      venue: newEvent.venue,
      budget: Number(newEvent.budget),
      description: newEvent.description
    });

    triggerNotification(`Đã tạo kế hoạch sự kiện: ${newEvent.name}`, 'success');
    setNewEvent({ name: '', dateTime: '', venue: '', budget: '', description: '' });
  };

  const handleToggleAttendance = (userId, currentStatus) => {
    if (!selectedEventId) return;
    const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    mockDb.updateAttendance(selectedEventId, userId, nextStatus);
    triggerNotification(`Đã cập nhật điểm danh thành công!`, 'success');
  };

  // Get participants of selected event
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
                  value={newEvent.name}
                  onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="Workshop, Đại hội, Teambuilding..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời gian diễn ra</label>
                  <input 
                    type="datetime-local" 
                    className="input-field" 
                    value={newEvent.dateTime}
                    onChange={e => setNewEvent({ ...newEvent, dateTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ngân sách dự trù (VNĐ)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={newEvent.budget}
                    onChange={e => setNewEvent({ ...newEvent, budget: e.target.value })}
                    placeholder="1500000"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Địa điểm tổ chức</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newEvent.venue}
                  onChange={e => setNewEvent({ ...newEvent, venue: e.target.value })}
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Calendar size={16} /> Lên lịch & Đăng ký sự kiện
              </button>
            </form>
          </div>

          {/* Events Directory */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Calendar size={18} /> Danh sách Sự kiện của CLB</h3>
            </div>

            {clubEvents.length === 0 ? (
              <div className="empty-state-view"><p>Chưa có sự kiện nào được tạo.</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {clubEvents.map(e => (
                  <div 
                    key={e.id} 
                    className={`nav-item ${selectedEventId === e.id ? 'active' : ''}`}
                    onClick={() => setSelectedEventId(e.id)}
                    style={{ border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', padding: '12px 16px' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{e.name}</div>
                      <div style={{ fontSize: '11px', display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><MapPin size={10} /> {e.venue}</span>
                        <span>{new Date(e.dateTime).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div>
                      <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                        {e.budget.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                ))}
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
                <h4 style={{ fontSize: '16px', color: 'var(--primary)' }}>{selectedEvent.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Địa điểm: {selectedEvent.venue} | Khởi động: {new Date(selectedEvent.dateTime).toLocaleString('vi-VN')}
                </p>
                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-main)' }}>
                  Tổng số đăng ký: <strong>{eventParticipants.length}</strong> | 
                  Có mặt: <strong style={{ color: 'var(--success)' }}>{eventParticipants.filter(p => p.attendanceStatus === 'Present').length}</strong> | 
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
                                <span className={`badge ${
                                  p.attendanceStatus === 'Present' ? 'badge-active' : 'badge-blocked'
                                }`}>
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
