import React, { useState, useEffect, useCallback } from 'react';
import { getAllEvents, approveEvent, rejectEvent, requestEditEvent } from '../../services/eventService';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, Building, Search, RefreshCw, Edit3 } from 'lucide-react';

const statusConfig = {
  Approved: { label: 'Đã duyệt', className: 'badge-active', icon: <CheckCircle size={12} /> },
  Rejected: { label: 'Từ chối', className: 'badge-blocked', icon: <XCircle size={12} /> },
  Pending:  { label: 'Chờ duyệt', className: 'badge-member', icon: <Clock size={12} /> },
};

const statusMapFEtoBE = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Bị từ chối',
};

const statusMapBEtoFE = {
  'Chờ duyệt': 'Pending',
  'Đã duyệt': 'Approved',
  'Bị từ chối': 'Rejected',
  'Đã hủy': 'Cancelled',
  'Pending': 'Pending',
  'Approved': 'Approved',
  'Rejected': 'Rejected',
};

export default function EventApproval({ triggerNotification, selectedClubId, mode = 'approval' }) {
  const clubs = React.useMemo(() => {
    try {
      const stored = sessionStorage.getItem('fpt_available_clubs');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(c => ({
          id: String(c.clubId || c.id || ''),
          name: c.clubName || c.name || `CLB #${c.clubId || c.id}`,
          logo: c.logoImage || c.logo || '',
        }));
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, []);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState(mode === 'monitoring' ? 'ALL' : 'Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarkMap, setRemarkMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // eventId đang xử lý

  // Load events từ API
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Tải toàn bộ sự kiện để tính số lượng chính xác ở các thẻ stats
      const data = await getAllEvents();
      // BE có thể trả về array hoặc { data: [...] }
      const rawEvents = Array.isArray(data) ? data : (data?.data ?? []);
      
      // Chuẩn hóa status từ tiếng Việt sang tiếng Anh để hiển thị đúng badge
      const normalized = rawEvents.map(e => ({
        ...e,
        status: statusMapBEtoFE[e.status] || e.status || 'Pending'
      }));
      
      setEvents(normalized);
    } catch (err) {
      console.error('[EventApproval] Lỗi tải sự kiện:', err);
      triggerNotification('Không tải được danh sách sự kiện!', 'error');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = events.filter(ev => {
    // 1. Lọc theo trạng thái phê duyệt
    const matchesStatus = filterStatus === 'ALL' || ev.status === filterStatus;

    // 2. Lọc theo ô tìm kiếm
    const q = searchQuery.toLowerCase();
    const club = clubs.find(c => c.id === ev.clubId || c.id === String(ev.clubId));
    const matchesSearch = !q || (ev.name || ev.eventName || '').toLowerCase().includes(q) || (club?.name.toLowerCase().includes(q));

    // 3. Lọc theo selectedClubId
    const matchesClub = !selectedClubId || String(ev.clubId) === String(selectedClubId);

    return matchesStatus && matchesSearch && matchesClub;
  });

  const getClub = (clubId) => clubs.find(c => c.id === clubId || c.id === String(clubId));

  const handleApprove = async (ev) => {
    const eventId = ev.id || ev.eventId;
    setActionLoading(eventId);
    try {
      await approveEvent(eventId);
      triggerNotification(`Đã duyệt sự kiện: ${ev.name || ev.eventName}`, 'success');
      setExpandedId(null);
      await loadEvents();
    } catch (err) {
      console.error('[EventApproval] Lỗi duyệt sự kiện:', err);
      triggerNotification(
        err?.response?.data?.message || 'Duyệt sự kiện thất bại!',
        'error'
      );
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
      triggerNotification(`Đã từ chối sự kiện: ${ev.name || ev.eventName}`, 'error');
      setExpandedId(null);
      await loadEvents();
    } catch (err) {
      console.error('[EventApproval] Lỗi từ chối sự kiện:', err);
      triggerNotification(
        err?.response?.data?.message || 'Từ chối sự kiện thất bại!',
        'error'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestEdit = async (ev) => {
    const eventId = ev.id || ev.eventId;
    const remark = remarkMap[eventId] || '';
    if (!remark.trim()) {
      triggerNotification('Vui lòng nhập lý do yêu cầu chỉnh sửa!', 'warning');
      return;
    }
    setActionLoading(eventId);
    try {
      await requestEditEvent(eventId, { rejectReason: remark });
      triggerNotification(`Đã yêu cầu chỉnh sửa sự kiện: ${ev.name || ev.eventName}`, 'info');
      setExpandedId(null);
      await loadEvents();
    } catch (err) {
      if (err?.response?.status === 404) {
        // Fallback: Sử dụng API reject thực tế trong Swagger kèm tiền tố [Yêu cầu chỉnh sửa] để trả sự kiện về cho Leader chỉnh sửa
        try {
          await rejectEvent(eventId, { rejectReason: `[Yêu cầu chỉnh sửa] ${remark}` });
          triggerNotification(`Đã yêu cầu chỉnh sửa sự kiện: ${ev.name || ev.eventName}`, 'info');
          setExpandedId(null);
          await loadEvents();
        } catch (fallbackErr) {
          console.error('[EventApproval] Lỗi gửi yêu cầu chỉnh sửa:', fallbackErr);
          triggerNotification(fallbackErr?.response?.data?.message || 'Yêu cầu chỉnh sửa thất bại!', 'error');
        }
      } else {
        console.error('[EventApproval] Lỗi yêu cầu chỉnh sửa sự kiện:', err);
        triggerNotification(err?.response?.data?.message || 'Yêu cầu chỉnh sửa thất bại!', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount  = events.filter(e => 
    (e.approvalStatus || e.status || 'Pending') === 'Pending' && 
    (!selectedClubId || String(e.clubId) === String(selectedClubId))
  ).length;
  const approvedCount = events.filter(e => 
    (e.approvalStatus || e.status) === 'Approved' && 
    (!selectedClubId || String(e.clubId) === String(selectedClubId))
  ).length;
  const rejectedCount = events.filter(e => 
    (e.approvalStatus || e.status) === 'Rejected' && 
    (!selectedClubId || String(e.clubId) === String(selectedClubId))
  ).length;

  return (
    <div className="user-management-container">
      {/* Stats */}
      <div className="stats-grid">
        <div className="stats-card" onClick={() => setFilterStatus('Pending')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--warning, #f59e0b)' }}><Clock size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Chờ duyệt</span>
            <span className="stats-value">{pendingCount} sự kiện</span>
          </div>
        </div>
        <div className="stats-card" onClick={() => setFilterStatus('Approved')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã duyệt</span>
            <span className="stats-value">{approvedCount} sự kiện</span>
          </div>
        </div>
        <div className="stats-card" onClick={() => setFilterStatus('Rejected')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--error)' }}><XCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Từ chối</span>
            <span className="stats-value">{rejectedCount} sự kiện</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <h3 className="glass-card-title"><Calendar size={18} /> Duyệt Sự kiện CLB</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadEvents}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>
        </div>

        <div className="search-filter-row">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm theo tên sự kiện, tên CLB..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <select className="select-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '160px' }}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Pending">Chờ duyệt</option>
              <option value="Approved">Đã duyệt</option>
              <option value="Rejected">Từ chối</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '32px', height: '32px' }} />
            <p style={{ marginTop: '12px' }}>Đang tải danh sách sự kiện...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state-view">
            <Calendar className="empty-state-icon" />
            <p>Không có sự kiện nào phù hợp.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {filteredEvents.map(ev => {
              const eventId = ev.id || ev.eventId;
              const eventName = ev.name || ev.eventName;
              const club = getClub(ev.clubId);
              const approvalStatus = ev.approvalStatus || ev.status || 'Pending';
              const cfg = statusConfig[approvalStatus] || statusConfig.Pending;
              const isExpanded = expandedId === eventId;
              const isProcessing = actionLoading === eventId;

              // Chuẩn hóa thời gian (BE có thể trả dateTime hoặc startTime)
              const eventTime = ev.dateTime || ev.startTime;

              return (
                <div key={eventId} className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                  {/* Event Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '15px', color: 'var(--text-heading)', margin: 0 }}>{eventName}</h4>
                        <span className={`badge ${cfg.className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {club && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Building size={12} />
                            <img src={club.logo} alt={club.name} style={{ width: '14px', height: '14px', borderRadius: '3px', objectFit: 'cover' }} />
                            {club.name.split(' - ')[0]}
                          </span>
                        )}
                        {eventTime && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} />
                            {new Date(eventTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        )}
                        {(ev.venue || ev.location) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} /> {ev.venue || ev.location}
                          </span>
                        )}
                        {(ev.budget || ev.planBudget) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <DollarSign size={12} />
                            {typeof (ev.budget || ev.planBudget) === 'number'
                              ? (ev.budget || ev.planBudget).toLocaleString('vi-VN')
                              : (ev.budget || ev.planBudget)} đ
                          </span>
                        )}
                      </div>
                    </div>

                    {mode !== 'monitoring' && approvalStatus === 'Pending' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setExpandedId(isExpanded ? null : eventId)}
                        disabled={isProcessing}
                      >
                        {isExpanded ? 'Đóng' : 'Xem xét'}
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: '12px 0 0', lineHeight: 1.6 }}>
                    {ev.description}
                  </p>

                  {/* Remark if already decided */}
                  {(ev.approvalRemark || ev.rejectReason) && (
                    <div style={{ marginTop: '10px', padding: '10px', background: approvalStatus === 'Approved' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '8px', border: `1px solid ${approvalStatus === 'Approved' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: '12px', color: 'var(--text-muted)' }}>
                      <strong>Ghi chú:</strong> {ev.approvalRemark || ev.rejectReason}
                    </div>
                  )}

                  {/* Action Panel (expand) */}
                  {isExpanded && approvalStatus === 'Pending' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Lý do từ chối / Yêu cầu chỉnh sửa (bắt buộc nếu từ chối hoặc yêu cầu sửa):
                        </label>
                        <textarea
                          className="textarea-field"
                          rows={2}
                          placeholder="Nhập lý do..."
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
                          className="btn btn-warning btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff' }}
                          onClick={() => handleRequestEdit(ev)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? <span className="login-spinner" /> : <><Edit3 size={14} /> Yêu cầu chỉnh sửa</>}
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
    </div>
  );
}
