import React, { useState, useEffect, useCallback } from 'react';
import { getAllEvents, approveEvent, rejectEvent } from '../../services/eventService';
import { Landmark, Users, TrendingUp, RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, Calendar, Search } from 'lucide-react';

// NOTE: BE chưa có API:
//   GET /api/clubs - danh sách tất cả CLB
// Dùng mock data cho Club Monitoring

const MOCK_CLUBS = [
  { id: 1, name: 'FPT Guitar Club', code: 'GUITAR', memberCount: 24, status: 'Active', lastActivity: '2026-06-10' },
  { id: 2, name: 'FCode Club', code: 'FCODE', memberCount: 47, status: 'Active', lastActivity: '2026-06-15' },
  { id: 3, name: 'FPT Dance Club', code: 'DANCE', memberCount: 31, status: 'Active', lastActivity: '2026-06-12' },
];

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
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

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
    { key: 'event-approval', label: 'Duyệt sự kiện', icon: <CheckCircle size={14} /> },
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
              <div className="stats-icon-box" style={{ color: 'var(--warning)' }}><Clock size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Sự kiện chờ duyệt</span>
                <span className="stats-value" style={{ color: pendingCount > 0 ? 'var(--warning)' : undefined }}>
                  {loading ? '...' : pendingCount}
                </span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Đã duyệt</span>
                <span className="stats-value">{loading ? '...' : approvedCount}</span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--error)' }}><XCircle size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Đã từ chối</span>
                <span className="stats-value">{loading ? '...' : rejectedCount}</span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box"><Landmark size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Tổng số CLB</span>
                <span className="stats-value">Chờ BE</span>
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
                      CLB #{ev.clubId} · {ev.startTime ? new Date(ev.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '8px' }}
                      onClick={() => setActiveTab('event-approval')}
                    >
                      Xem xét duyệt →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card" style={{ marginTop: '24px', padding: '14px 16px', background: 'rgba(242,111,33,0.04)', border: '1px solid rgba(242,111,33,0.2)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <AlertTriangle size={13} style={{ color: 'var(--warning)' }} />
              <strong style={{ fontSize: '12px', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>BE cần bổ sung</strong>
            </div>
            <ul style={{ paddingLeft: '14px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <li><code>GET /api/clubs</code> — Danh sách tất cả CLB (Club Monitoring)</li>
              <li><code>GET /api/club-reports</code> — Nhận báo cáo từ Club Leader</li>
              <li><code>GET /api/notifications</code> — Quản lý thông báo gửi CLB</li>
              <li><code>GET /api/analytics</code> — Thống kê hiệu quả hoạt động CLB</li>
            </ul>
          </div>
        </div>
      )}

      {/* Event Approval tab */}
      {activeTab === 'event-approval' && (
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="glass-card-title"><CheckCircle size={18} /> Duyệt Sự kiện</h3>
            <button className="btn btn-secondary btn-sm" onClick={loadEvents} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-input-wrapper" style={{ flex: 1 }}>
              <Search className="search-icon" size={18} />
              <input type="text" className="input-field" placeholder="Tìm theo tên sự kiện..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <select className="select-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '160px' }}>
              <option value="ALL">Tất cả</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
            </select>
          </div>

          {loading ? (
            <div className="empty-state-view"><span className="login-spinner" style={{ width: '28px', height: '28px' }} /></div>
          ) : filteredEvents.length === 0 ? (
            <div className="empty-state-view"><Calendar className="empty-state-icon" /><p>Không có sự kiện nào phù hợp.</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {filteredEvents.map(ev => {
                const eventId = ev.id || ev.eventId;
                const eventName = ev.eventName || ev.name;
                const approvalStatus = ev.status || 'Pending';
                const isExpanded = expandedId === eventId;
                const isProcessing = actionLoading === eventId;

                return (
                  <div key={eventId} className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '15px', color: 'var(--text-heading)', margin: 0 }}>{eventName}</h4>
                          {approvalStatus === 'Approved' && <span className="badge badge-active"><CheckCircle size={10} /> Đã duyệt</span>}
                          {approvalStatus === 'Rejected' && <span className="badge badge-blocked"><XCircle size={10} /> Từ chối</span>}
                          {approvalStatus === 'Pending' && <span className="badge badge-member"><Clock size={10} /> Chờ duyệt</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {ev.location && <span>📍 {ev.location}</span>}
                          {ev.startTime && <span>🕐 {new Date(ev.startTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>}
                          {ev.planBudget && <span>💰 {ev.planBudget}đ</span>}
                        </div>
                        {ev.description && <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: '10px 0 0', lineHeight: 1.6 }}>{ev.description}</p>}
                      </div>
                      {approvalStatus === 'Pending' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(isExpanded ? null : eventId)} disabled={isProcessing}>
                          {isExpanded ? 'Đóng' : 'Xem xét'}
                        </button>
                      )}
                    </div>

                    {isExpanded && approvalStatus === 'Pending' && (
                      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lý do từ chối (bắt buộc nếu từ chối):</label>
                          <textarea
                            className="textarea-field"
                            rows={2}
                            placeholder="Nhập lý do từ chối..."
                            value={remarkMap[eventId] || ''}
                            onChange={e => setRemarkMap(m => ({ ...m, [eventId]: e.target.value }))}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-success btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleApprove(ev)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <span className="login-spinner" /> : <><CheckCircle size={14} /> Phê duyệt</>}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => handleReject(ev)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? <span className="login-spinner" /> : <><XCircle size={14} /> Từ chối</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Club Monitoring tab */}
      {activeTab === 'club-monitoring' && (
        <div>
          <div className="glass-card" style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.2)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <AlertTriangle size={12} style={{ marginRight: '4px', color: 'var(--warning)' }} />
            Dữ liệu mock - Yêu cầu BE bổ sung: <code>GET /api/clubs</code>
          </div>

          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            {MOCK_CLUBS.map(club => (
              <div key={club.id} className="glass-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px', flexShrink: 0 }}>
                    {club.code.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>{club.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Users size={10} style={{ marginRight: '4px' }} />{club.memberCount} thành viên
                    </div>
                    <span className="badge badge-active" style={{ fontSize: '10px', marginTop: '4px' }}>Đang hoạt động</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Landmark size={18} /> Chi tiết theo dõi CLB</h3>
            </div>
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Tên CLB</th>
                    <th>Mã CLB</th>
                    <th>Số thành viên</th>
                    <th>Hoạt động gần nhất</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_CLUBS.map(club => (
                    <tr key={club.id}>
                      <td><strong>{club.name}</strong></td>
                      <td><span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>{club.code}</span></td>
                      <td>{club.memberCount}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{club.lastActivity}</td>
                      <td><span className="badge badge-active">Đang hoạt động</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
