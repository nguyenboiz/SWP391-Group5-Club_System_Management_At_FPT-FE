import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, DollarSign, Building, Search } from 'lucide-react';

const statusConfig = {
  Approved: { label: 'Đã duyệt', className: 'badge-active', icon: <CheckCircle size={12} /> },
  Rejected: { label: 'Từ chối', className: 'badge-blocked', icon: <XCircle size={12} /> },
  Pending:  { label: 'Chờ duyệt', className: 'badge-member', icon: <Clock size={12} /> },
};

export default function EventApproval({ dbData, triggerNotification }) {
  const { events, clubs } = dbData;
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarkMap, setRemarkMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const filteredEvents = events.filter(ev => {
    const matchStatus = filterStatus === 'ALL' || (ev.approvalStatus || 'Pending') === filterStatus;
    const q = searchQuery.toLowerCase();
    const club = clubs.find(c => c.id === ev.clubId);
    const matchSearch = !q || ev.name.toLowerCase().includes(q) || (club?.name.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const getClub = (clubId) => clubs.find(c => c.id === clubId);

  const handleApprove = (ev) => {
    const remark = remarkMap[ev.id] || '';
    mockDb.approveEvent(ev.id, remark);
    triggerNotification(`Đã duyệt sự kiện: ${ev.name}`, 'success');
    setExpandedId(null);
  };

  const handleReject = (ev) => {
    const remark = remarkMap[ev.id] || '';
    if (!remark.trim()) {
      triggerNotification('Vui lòng nhập lý do từ chối!', 'warning');
      return;
    }
    mockDb.rejectEvent(ev.id, remark);
    triggerNotification(`Đã từ chối sự kiện: ${ev.name}`, 'error');
    setExpandedId(null);
  };

  const pendingCount = events.filter(e => (e.approvalStatus || 'Pending') === 'Pending').length;
  const approvedCount = events.filter(e => e.approvalStatus === 'Approved').length;
  const rejectedCount = events.filter(e => e.approvalStatus === 'Rejected').length;

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

        {filteredEvents.length === 0 ? (
          <div className="empty-state-view">
            <Calendar className="empty-state-icon" />
            <p>Không có sự kiện nào phù hợp.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {filteredEvents.map(ev => {
              const club = getClub(ev.clubId);
              const approvalStatus = ev.approvalStatus || 'Pending';
              const cfg = statusConfig[approvalStatus] || statusConfig.Pending;
              const isExpanded = expandedId === ev.id;

              return (
                <div key={ev.id} className="glass-card" style={{ padding: '16px', marginBottom: 0 }}>
                  {/* Event Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '15px', color: 'var(--text-heading)', margin: 0 }}>{ev.name}</h4>
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
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {new Date(ev.dateTime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={12} /> {ev.venue}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={12} /> {ev.budget?.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    {approvalStatus === 'Pending' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                      >
                        {isExpanded ? 'Đóng' : 'Xem xét'}
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: '12px 0 0', lineHeight: 1.6 }}>{ev.description}</p>

                  {/* Remark if already decided */}
                  {ev.approvalRemark && (
                    <div style={{ marginTop: '10px', padding: '10px', background: approvalStatus === 'Approved' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: '8px', border: `1px solid ${approvalStatus === 'Approved' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: '12px', color: 'var(--text-muted)' }}>
                      <strong>Ghi chú:</strong> {ev.approvalRemark}
                    </div>
                  )}

                  {/* Action Panel (expand) */}
                  {isExpanded && approvalStatus === 'Pending' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Ghi chú / Lý do (bắt buộc nếu từ chối):
                        </label>
                        <textarea
                          className="textarea-field"
                          rows={2}
                          placeholder="Nhập nhận xét hoặc lý do từ chối..."
                          value={remarkMap[ev.id] || ''}
                          onChange={e => setRemarkMap(m => ({ ...m, [ev.id]: e.target.value }))}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleApprove(ev)}
                        >
                          <CheckCircle size={14} /> Phê duyệt
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleReject(ev)}
                        >
                          <XCircle size={14} /> Từ chối
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
