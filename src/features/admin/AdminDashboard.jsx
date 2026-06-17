import React, { useState, useEffect } from 'react';
import { Users, Landmark, Calendar, FileText, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import * as semesterService from '../../services/semesterService';
import * as eventService from '../../services/eventService';

// NOTE: BE chưa có các API sau, dùng mock data:
//   - GET /api/users/count
//   - GET /api/clubs (lấy danh sách tất cả CLB)
//   - GET /api/club-reports/pending-count

export default function AdminDashboard({ triggerNotification }) {
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalUsers: 0,
    totalEvents: 0,
    pendingReports: 0,
    pendingEvents: 0,
    activeSemester: null,
  });
  const [loading, setLoading] = useState(true);
  const [recentEvents, setRecentEvents] = useState([]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Lấy sự kiện thật từ BE
      const eventsData = await eventService.getAllEvents();
      const allEvents = Array.isArray(eventsData) ? eventsData : (eventsData?.data ?? []);

      // Lấy học kỳ thật
      let activeSemesterName = 'N/A';
      try {
        const semData = await semesterService.getSemesters();
        const semList = Array.isArray(semData) ? semData : (semData?.data ?? []);
        const active = semList.find(s => s.status === 'Active' || s.status === 'Open') || semList[0];
        activeSemesterName = active ? (active.semesterName || active.name) : 'N/A';
      } catch {}

      const pendingEvents = allEvents.filter(e => {
        const status = e.status || e.approvalStatus || '';
        return status === 'Pending' || status === 'Chờ duyệt';
      }).length;

      setStats({
        totalClubs: 0, // mock - BE chưa có GET /api/clubs
        totalUsers: 0, // mock - BE chưa có GET /api/users
        totalEvents: allEvents.length,
        pendingReports: 0, // mock - BE chưa có /api/club-reports
        pendingEvents,
        activeSemester: activeSemesterName,
      });

      // Lấy 5 sự kiện mới nhất
      const recent = [...allEvents]
        .sort((a, b) => new Date(b.createdAt || b.startTime || 0) - new Date(a.createdAt || a.startTime || 0))
        .slice(0, 5);
      setRecentEvents(recent);
    } catch (err) {
      console.error('[AdminDashboard] Lỗi tải dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const statusBadge = (ev) => {
    const status = ev.status || ev.approvalStatus || 'Pending';
    if (status === 'Approved' || status === 'Đã duyệt') return <span className="badge badge-active">Đã duyệt</span>;
    if (status === 'Rejected' || status === 'Bị từ chối') return <span className="badge badge-blocked">Từ chối</span>;
    return <span className="badge badge-member">Chờ duyệt</span>;
  };

  return (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stats-card">
          <div className="stats-icon-box"><Landmark size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tổng số CLB</span>
            <span className="stats-value">
              {loading ? '...' : stats.totalClubs > 0 ? stats.totalClubs : 'Chờ BE'}
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><Users size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tổng User hệ thống</span>
            <span className="stats-value">
              {loading ? '...' : stats.totalUsers > 0 ? stats.totalUsers : 'Chờ BE'}
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><Calendar size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tổng Sự kiện</span>
            <span className="stats-value">{loading ? '...' : stats.totalEvents}</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--warning)' }}><AlertCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Sự kiện chờ duyệt</span>
            <span className="stats-value" style={{ color: stats.pendingEvents > 0 ? 'var(--warning)' : undefined }}>
              {loading ? '...' : stats.pendingEvents}
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><FileText size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Báo cáo đang chờ</span>
            <span className="stats-value">{loading ? '...' : 'Chờ BE'}</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><TrendingUp size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Học kỳ hiện tại</span>
            <span className="stats-value" style={{ fontSize: '14px' }}>
              {loading ? '...' : stats.activeSemester}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="glass-card">
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title"><Calendar size={18} /> Sự kiện mới nhất trong hệ thống</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadDashboard}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>
        </div>

        {loading ? (
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
            <p style={{ marginTop: '10px' }}>Đang tải...</p>
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="empty-state-view">
            <Calendar className="empty-state-icon" />
            <p>Chưa có sự kiện nào trong hệ thống.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tên Sự kiện</th>
                  <th>CLB</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map(ev => {
                  const eId = ev.id || ev.eventId;
                  const eName = ev.eventName || ev.name;
                  const eTime = ev.startTime || ev.dateTime;
                  return (
                    <tr key={eId}>
                      <td><strong>{eName}</strong></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>CLB #{ev.clubId}</td>
                      <td style={{ fontSize: '12px' }}>
                        {eTime ? new Date(eTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td>{statusBadge(ev)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Missing APIs Notice */}
      <div className="glass-card" style={{ marginTop: '24px', padding: '16px', background: 'rgba(242,111,33,0.04)', border: '1px solid rgba(242,111,33,0.2)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <AlertCircle size={14} style={{ color: 'var(--warning)' }} />
          <strong style={{ fontSize: '12px', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Cần BE bổ sung API cho Dashboard Admin
          </strong>
        </div>
        <ul style={{ paddingLeft: '16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li><code>GET /api/clubs</code> — Lấy danh sách tất cả CLB (tổng số CLB)</li>
          <li><code>GET /api/users</code> — Lấy danh sách người dùng (tổng user)</li>
          <li><code>GET /api/club-reports</code> — Danh sách báo cáo từ Manager (báo cáo đang chờ)</li>
        </ul>
      </div>
    </div>
  );
}
