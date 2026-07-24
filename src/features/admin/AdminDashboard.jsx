import React, { useState, useEffect } from 'react';
import { Users, Landmark, Calendar, FileText, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import * as semesterService from '../../services/semesterService';
import * as eventService from '../../services/eventService';
import * as dashboardService from '../../services/dashboardService';
import { getReportsPendingCount } from '../../services/reportPeriodService';
import { parseDateVN } from '../../utils/validator';

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
      // 1. Lấy dữ liệu thống kê từ dashboard API
      let dashboardData = null;
      try {
        const res = await dashboardService.getAdminDashboard();
        dashboardData = res?.data || res;
      } catch (dashErr) {
        console.error('[AdminDashboard] Lỗi tải thống kê từ BE:', dashErr);
      }

      // 2. Lấy tổng sự kiện từ API đếm chính xác
      let totalEventsCount = 0;
      let pendingEventsCount = 0;
      try {
        const totalRes = await eventService.getEventsCountTotal();
        totalEventsCount = typeof totalRes === 'number' ? totalRes : (totalRes?.data ?? totalRes?.count ?? 0);
      } catch {}
      try {
        const pendingRes = await eventService.getEventsCountPending();
        pendingEventsCount = typeof pendingRes === 'number' ? pendingRes : (pendingRes?.data ?? pendingRes?.count ?? 0);
      } catch {}

      // 3. Lấy số báo cáo chờ duyệt từ API đếm chính xác
      let pendingReportsCount = 0;
      try {
        const reportsRes = await getReportsPendingCount();
        pendingReportsCount = typeof reportsRes === 'number' ? reportsRes : (reportsRes?.data ?? reportsRes?.count ?? 0);
      } catch {}

      // 4. Lấy sự kiện thật từ BE cho bảng danh sách
      const eventsData = await eventService.getAllEvents();
      const allEvents = Array.isArray(eventsData) ? eventsData : (eventsData?.data ?? []);

      // 5. Lấy học kỳ thật
      let activeSemesterName = 'N/A';
      try {
        const semData = await semesterService.getSemesters();
        const semList = Array.isArray(semData) ? semData : (semData?.data ?? []);
        
        const active = semList.find(s => {
          const st = String(s.status || '').trim().toLowerCase();
          if (st === 'đang diễn ra' || st === 'active' || st === 'open') return true;
          if (s.startDate && s.endDate) {
            const now = new Date();
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            start.setHours(0,0,0,0);
            end.setHours(23,59,59,999);
            return now >= start && now <= end;
          }
          return false;
        }) || semList[0];
        activeSemesterName = active ? (active.semesterName || active.name) : 'N/A';
      } catch {}

      setStats({
        totalClubs: dashboardData?.totalClubs ?? 0,
        totalUsers: dashboardData?.totalUsers ?? 0,
        totalEvents: dashboardData?.totalEvents ?? totalEventsCount,
        pendingReports: dashboardData?.pendingReportsForAdmin ?? pendingReportsCount,
        pendingEvents: dashboardData?.upcomingOrOngoingEvents ?? pendingEventsCount,
        activeSemester: activeSemesterName,
      });

      // Lấy 5 sự kiện mới nhất
      const recent = [...allEvents]
        .sort((a, b) => new Date(b.createdAt || b.startTime || 0) - new Date(a.createdAt || a.startTime || 0))
        .slice(0, 5);
      setRecentEvents(recent);
    } catch (err) {
      console.error('[AdminDashboard] Lỗi tổng thể khi tải dashboard:', err);
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
              {loading ? '...' : stats.totalClubs}
            </span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><Users size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tổng User hệ thống</span>
            <span className="stats-value">
              {loading ? '...' : stats.totalUsers}
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
            <span className="stats-value">{loading ? '...' : stats.pendingReports}</span>
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
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {ev.club?.clubName || ev.club?.name || `CLB #${ev.clubId}`}
                      </td>
                      <td style={{ fontSize: '12px' }}>
                         {eTime ? parseDateVN(eTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
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
    </div>
  );
}
