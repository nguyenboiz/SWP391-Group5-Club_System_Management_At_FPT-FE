import React, { useState, useEffect, useCallback } from 'react';
import { getAllEvents, approveEvent, rejectEvent, getEventDetail } from '../../services/eventService';
import { getManagerDashboard } from '../../services/dashboardService';
import { getClubReports } from '../../services/clubReportService';
import apiClient from '../../utils/apiClient';
import { Landmark, Users, TrendingUp, RefreshCw, Info, CheckCircle, XCircle, Clock, Calendar, Search, AlertTriangle, FileText, CheckSquare } from 'lucide-react';
import { parseDateVN } from '../../utils/validator';

const statusMapBEtoFE = {
  'Chờ duyệt': 'Pending', 'Đã duyệt': 'Approved', 'Bị từ chối': 'Rejected',
  'Đã hủy': 'Cancelled', 'Pending': 'Pending', 'Approved': 'Approved', 'Rejected': 'Rejected',
};



export default function ManagerDashboard({ triggerNotification }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarkMap, setRemarkMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Stats state from GET /api/dashboard/manager
  const [stats, setStats] = useState({
    totalClubs: 0,
    activeClubs: 0,
    pendingEvents: 0,
    pendingEvidences: 0,
    pendingReports: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Cache for event details
  const [eventDetails, setEventDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await getManagerDashboard();
      const data = res?.data || res || {};
      setStats({
        totalClubs: data.totalClubs || 0,
        activeClubs: data.activeClubs || 0,
        pendingEvents: data.pendingEvents || 0,
        pendingEvidences: data.pendingEvidences || 0,
        pendingReports: data.pendingReports || 0
      });
    } catch (err) {
      console.error('[ManagerDashboard] Lỗi tải thống kê dashboard:', err);
      triggerNotification('Không tải được số liệu thống kê!', 'error');
    } finally {
      setLoadingStats(false);
    }
  }, [triggerNotification]);

  // Club Monitoring state
  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [clubsLoaded, setClubsLoaded] = useState(false);

  const loadClubs = useCallback(async () => {
    setLoadingClubs(true);
    try {
      const res = await apiClient.get('/api/clubs');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      
      // Load stats for each club to display real metrics
      const clubsWithStats = await Promise.all(data.map(async (club) => {
        const cId = club.id || club.clubId;
        try {
          const statsRes = await apiClient.get(`/api/clubs/${cId}/stats`);
          const statsData = statsRes.data?.data ?? statsRes.data ?? {};
          return { ...club, stats: statsData };
        } catch (err) {
          console.error(`Error loading stats for club ${cId}:`, err);
          return club;
        }
      }));

      setClubs(clubsWithStats);
      setClubsLoaded(true);
    } catch (err) {
      console.error('[ManagerDashboard] Lỗi tải CLB:', err);
      triggerNotification('Không tải được danh sách câu lạc bộ!', 'error');
      setClubs([]);
      setClubsLoaded(true);
    } finally {
      setLoadingClubs(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    if (activeTab === 'club-monitoring' && !clubsLoaded) {
      loadClubs();
    }
  }, [activeTab, clubsLoaded, loadClubs]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllEvents();
      const rawEvents = Array.isArray(data) ? data : (data?.data ?? []);
      const normalized = rawEvents.map(e => ({
        ...e,
        status: statusMapBEtoFE[e.status] || e.status || 'Pending'
      }));
      setEvents(normalized);
    } catch (err) {
      console.error('[ManagerDashboard] Lỗi tải sự kiện:', err);
      triggerNotification('Không tải được danh sách sự kiện!', 'error');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    loadEvents();
    loadStats();
  }, [loadEvents, loadStats]);

  const handleExpandEvent = async (eventId) => {
    if (expandedId === eventId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(eventId);

    if (!eventDetails[eventId]) {
      setLoadingDetails(prev => ({ ...prev, [eventId]: true }));
      try {
        const data = await getEventDetail(eventId);
        setEventDetails(prev => ({ ...prev, [eventId]: data?.data ?? data }));
      } catch (err) {
        console.error('[ManagerDashboard] Lỗi tải chi tiết sự kiện:', err);
      } finally {
        setLoadingDetails(prev => ({ ...prev, [eventId]: false }));
      }
    }
  };

  const handleApprove = async (ev) => {
    const eventId = ev.id || ev.eventId;
    setActionLoading(eventId);
    try {
      await approveEvent(eventId);
      triggerNotification(`Đã duyệt sự kiện: ${ev.eventName || ev.name}`, 'success');
      setExpandedId(null);
      await loadEvents();
    } catch (err) {
      triggerNotification(err?.response?.data?.message || 'Duyệt sự kiện thất bại!', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (ev) => {
    const eventId = ev.id || ev.eventId;
    const remark = remarkMap[eventId] || '';
    if (!remark.trim()) {
      triggerNotification('Vui lòng nhập lý do từ chối!', 'warning');
      return;
    }
    setActionLoading(eventId);
    try {
      await rejectEvent(eventId, { rejectReason: remark });
      triggerNotification(`Đã từ chối sự kiện: ${ev.eventName || ev.name}`, 'success');
      setExpandedId(null);
      await loadEvents();
    } catch (err) {
      triggerNotification(err?.response?.data?.message || 'Từ chối sự kiện thất bại!', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = events.filter(e => e.status === 'Pending').length;
  const approvedCount = events.filter(e => e.status === 'Approved').length;
  const rejectedCount = events.filter(e => e.status === 'Rejected').length;

  const filteredEvents = events.filter(ev => {
    const matchesStatus = filterStatus === 'ALL' || ev.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (ev.eventName || ev.name || '').toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const tabs = [
    { key: 'overview', label: 'Tổng quan', icon: <TrendingUp size={14} /> },
    { key: 'club-monitoring', label: 'Theo dõi CLB', icon: <Landmark size={14} /> },
  ];

  return (
    <div>
      {/* Tab switcher */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '6px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              className={`role-switch-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--primary, #f26f21)' }}><Landmark size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">CLB hoạt động</span>
                <span className="stats-value">
                  {loadingStats ? '...' : stats.activeClubs}
                </span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--warning, #f59e0b)' }}><Clock size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Kế hoạch chờ duyệt</span>
                <span className="stats-value" style={{ color: stats.pendingEvents > 0 ? 'var(--warning)' : undefined }}>
                  {loadingStats ? '...' : stats.pendingEvents}
                </span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: '#3b82f6' }}><CheckSquare size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Minh chứng chờ duyệt</span>
                <span className="stats-value" style={{ color: stats.pendingEvidences > 0 ? '#3b82f6' : undefined }}>
                  {loadingStats ? '...' : stats.pendingEvidences}
                </span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: '#10b981' }}><FileText size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Báo cáo chờ duyệt</span>
                <span className="stats-value" style={{ color: stats.pendingReports > 0 ? '#10b981' : undefined }}>
                  {loadingStats ? '...' : stats.pendingReports}
                </span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--success, #22c55e)' }}><CheckCircle size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Sự kiện hệ thống</span>
                <span className="stats-value">
                  {loading ? '...' : `${approvedCount} đã duyệt`}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Calendar size={18} /> Sự kiện chờ duyệt gần đây</h3>
            </div>
            {loading ? (
              <div className="empty-state-view">
                <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
              </div>
            ) : pendingCount === 0 ? (
              <div className="empty-state-view">
                <CheckCircle className="empty-state-icon" style={{ color: 'var(--success)' }} />
                <p>Không có sự kiện nào đang chờ duyệt!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                {events.filter(e => e.status === 'Pending').slice(0, 5).map(ev => (
                  <div key={ev.id || ev.eventId} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{ev.eventName || ev.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {ev.club?.clubName || ev.club?.name || `CLB #${ev.clubId}`} · {ev.startTime ? parseDateVN(ev.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    </div>
                    <div style={{ paddingBottom: '4px' }}></div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}



      {/* Club Monitoring tab */}
      {activeTab === 'club-monitoring' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '24px' }}>
            <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="glass-card-title"><Landmark size={18} /> Theo dõi Câu lạc bộ</h3>
              <button className="btn btn-secondary btn-sm" onClick={loadClubs} disabled={loadingClubs} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} className={loadingClubs ? 'spin' : ''} /> Làm mới
              </button>
            </div>

            {loadingClubs ? (
              <div className="empty-state-view"><span className="login-spinner" style={{ width: '28px', height: '28px' }} /></div>
            ) : clubs.length === 0 ? (
              <div className="empty-state-view">
                <Landmark className="empty-state-icon" />
                <p>Không tải được danh sách câu lạc bộ hoặc danh sách trống.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Tên CLB</th>
                      <th>Mã CLB</th>
                      <th style={{ textAlign: 'center' }}>Thành viên</th>
                      <th style={{ textAlign: 'center' }}>Sự kiện đã chạy</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clubs.map((club, idx) => {
                      const cId = club.id || club.clubId;
                      const cName = club.clubName || club.name;
                      const cCode = club.clubCode || club.code;
                      const status = club.status || 'Active';
                      const isActive = status === 'Active' || status === 'Hoạt động' || status === 'Đang hoạt động' || status === 'active';
                      
                      // Thống kê hoạt động thực tế từ Backend cho từng CLB
                      const membersCount = club.stats?.totalMembers ?? club.stats?.memberCount ?? 0;
                      const eventsCount = club.stats?.approvedEvents ?? club.stats?.totalApprovedEvents ?? 0;

                      return (
                        <tr key={cId}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{cName}</div>
                            {club.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{club.description.substring(0, 70)}...</div>}
                          </td>
                          <td>{cCode && <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>{cCode}</span>}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{membersCount} sinh viên</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{eventsCount} sự kiện</td>
                          <td><span className={`badge ${isActive ? 'badge-active' : 'badge-blocked'}`}>{isActive ? 'Đang hoạt động' : 'Tạm dừng'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
