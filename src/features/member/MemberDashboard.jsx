import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getEventsByClub } from '../../services/eventService';
import { getClubMembers } from '../../services/membershipService';
import { Users, Calendar, FileText, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

// NOTE: BE chưa có API:
//   GET /api/evidences?userId={id} - lịch sử minh chứng
//   GET /api/activities?userId={id} - lịch sử hoạt động

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
      {/* Welcome Banner */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '24px', background: 'linear-gradient(135deg, rgba(242,111,33,0.12), rgba(30,144,255,0.08))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '22px', flexShrink: 0 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Xin chào,</div>
            <h3 style={{ fontSize: '20px', color: 'var(--text-heading)', margin: 0 }}>{displayName}</h3>
            {userId && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>MSSV: {userId}</div>}
          </div>
        </div>
      </div>

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

        {/* My Activities + Missing APIs notice */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><FileText size={18} /> Hoạt động của tôi</h3>
            </div>
            <div className="empty-state-view" style={{ padding: '20px' }}>
              <FileText className="empty-state-icon" style={{ color: 'var(--text-muted)' }} />
              <p style={{ fontSize: '13px' }}>Lịch sử tham gia sự kiện và minh chứng của bạn sẽ hiển thị ở đây.</p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '14px 16px', background: 'rgba(242,111,33,0.04)', border: '1px solid rgba(242,111,33,0.2)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
              <strong style={{ fontSize: '12px', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BE cần bổ sung</strong>
            </div>
            <ul style={{ paddingLeft: '14px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li><code>GET /api/evidences?userId={'{id}'}</code> — Lịch sử minh chứng</li>
              <li><code>POST /api/evidences</code> — Nộp minh chứng</li>
              <li><code>PUT /api/auth/profile</code> — Cập nhật hồ sơ cá nhân</li>
              <li><code>POST /api/events/{'{id}'}/register</code> — Đăng ký tham gia sự kiện</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
