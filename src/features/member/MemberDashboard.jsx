import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEventsByClub } from '../../services/eventService';
import { getClubMembers } from '../../services/membershipService';
import { getUserActivityHistory } from '../../services/userService';
import { Users, Calendar, FileText, Clock, TrendingUp } from 'lucide-react';

export default function MemberDashboard({ triggerNotification, selectedClubId }) {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const [evData, memData] = await Promise.allSettled([
        getEventsByClub(selectedClubId),
        getClubMembers(selectedClubId),
      ]);

      if (evData.status === 'fulfilled') {
        const list = Array.isArray(evData.value) ? evData.value : (evData.value?.data ?? []);
        setEvents(list);
      }
      if (memData.status === 'fulfilled') {
        const list = Array.isArray(memData.value) ? memData.value : (memData.value?.data ?? []);
        setMembers(list);
      }
    } catch (err) {
      console.error('[MemberDashboard] Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId]);

  useEffect(() => { loadData(); }, [loadData]);

  const upcomingEvents = events.filter(e => {
    const status = e.status || e.approvalStatus || '';
    const normalized = status === 'Approved' || status === 'Đã duyệt';
    const upcoming = new Date(e.startTime || e.dateTime) >= new Date();
    return normalized && upcoming;
  });

  const totalEvents = events.length;
  const approvedEvents = events.filter(e => {
    const s = e.status || e.approvalStatus || '';
    return s === 'Approved' || s === 'Đã duyệt';
  }).length;

  const userId = currentUser?.id || currentUser?.studentId;
  const displayName = currentUser?.fullName || userId || 'Sinh viên';

  return (
    <div>
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stats-card">
          <div className="stats-icon-box"><Calendar size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Sự kiện CLB</span>
            <span className="stats-value">{loading ? '...' : totalEvents}</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><TrendingUp size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Sự kiện đã duyệt</span>
            <span className="stats-value">{loading ? '...' : approvedEvents}</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><Users size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Thành viên CLB</span>
            <span className="stats-value">{loading ? '...' : members.length}</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--warning)' }}><Clock size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Sắp diễn ra</span>
            <span className="stats-value">{loading ? '...' : upcomingEvents.length}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col">
        {/* Upcoming Events */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Calendar size={18} /> Sự kiện sắp diễn ra</h3>
          </div>
          {loading ? (
            <div className="empty-state-view"><span className="login-spinner" style={{ width: '28px', height: '28px' }} /></div>
          ) : upcomingEvents.length === 0 ? (
            <div className="empty-state-view">
              <Calendar className="empty-state-icon" />
              <p>Chưa có sự kiện nào sắp diễn ra.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingEvents.slice(0, 5).map(ev => {
                const eId = ev.id || ev.eventId;
                const eName = ev.eventName || ev.name;
                const eTime = ev.startTime || ev.dateTime;
                return (
                  <div key={eId} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '13px' }}>{eName}</div>
                    {eTime && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <Clock size={10} style={{ marginRight: '4px' }} />
                      {new Date(eTime).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>}
                    {ev.location && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>📍 {ev.location}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Activities */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><FileText size={18} /> Hoạt động của tôi</h3>
          </div>
          <div className="empty-state-view" style={{ padding: '20px' }}>
            <FileText className="empty-state-icon" style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '13px' }}>Lịch sử tham gia sự kiện và chứng nhận của bạn sẽ hiển thị ở đây.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
