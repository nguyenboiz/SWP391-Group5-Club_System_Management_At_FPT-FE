import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Eye, FileText, CheckCircle, Image as ImageIcon, AlertCircle, AlertTriangle, Clock, Search, RefreshCw } from 'lucide-react';
import { reviewEvidence, getAllEvents, getEventDetail, getEventsByClub, getPendingEvidences } from '../../services/eventService';

export default function EvidenceApproval({ triggerNotification, selectedClubId }) {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [remarkMap, setRemarkMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const loadEvidences = useCallback(async () => {
    setLoading(true);
    try {
      let allEvs = [];

      if (selectedClubId) {
        // Leader: workaround loop vì API /pending trả về toàn hệ thống (sẽ bị 403)
        const res = await getEventsByClub(selectedClubId);
        const eventsList = Array.isArray(res) ? res : (res?.data ?? []);
        await Promise.all(eventsList.map(async (e) => {
          try {
            const detail = await getEventDetail(e.id || e.eventId);
            const detailData = detail?.data ?? detail ?? {};
            if (String(detailData.clubId) !== String(selectedClubId)) return;
            const evList = detailData.evidences || detailData.evidenceFiles || [];
            if (Array.isArray(evList)) {
              evList.forEach(ev => {
                allEvs.push({
                  id: ev.id || ev.evidenceId,
                  userId: ev.studentId || ev.userId || 'N/A',
                  userFullName: ev.studentName || ev.userFullName || 'Sinh viên',
                  clubId: detailData.clubId,
                  clubName: detailData.clubName || 'CLB',
                  eventName: detailData.eventName || detailData.name,
                  evidenceType: ev.evidenceType || 'Check-in Photo',
                  fileUrl: ev.fileUrl || ev.url || '',
                  description: ev.feedback || ev.description || '',
                  submittedAt: ev.submittedAt || detailData.submittedAt || new Date().toISOString(),
                  status: ev.status || 'Pending'
                });
              });
            }
          } catch (detailErr) {
            console.error(`Error loading detail for event ${e.id}:`, detailErr);
          }
        }));
      } else {
        // Admin/Manager: dùng API mới GET /api/events/evidences/pending (trả về toàn hệ thống)
        // Fallback về workaround cũ nếu API mới chưa sẵn sàng
        try {
          const res = await getPendingEvidences();
          const rawList = Array.isArray(res) ? res : (res?.data ?? []);
          allEvs = rawList.map(ev => ({
            id: ev.id || ev.evidenceId,
            userId: ev.studentId || ev.userId || 'N/A',
            userFullName: ev.studentName || ev.userFullName || 'Sinh viên',
            clubId: ev.clubId,
            clubName: ev.clubName || 'CLB',
            eventName: ev.eventName || ev.name || 'Sự kiện',
            evidenceType: ev.evidenceType || 'Check-in Photo',
            fileUrl: ev.fileUrl || ev.url || '',
            description: ev.feedback || ev.description || '',
            submittedAt: ev.submittedAt || new Date().toISOString(),
            status: ev.status || 'Pending'
          }));
        } catch (pendingErr) {
          // Fallback: nếu API /pending chưa sẵn sàng, dùng workaround cũ
          console.warn('[EvidenceApproval] API /evidences/pending chưa sẵn sàng, fallback workaround:', pendingErr?.response?.status);
          const res = await getAllEvents();
          const eventsList = Array.isArray(res) ? res : (res?.data ?? []);
          await Promise.all(eventsList.map(async (e) => {
            try {
              const detail = await getEventDetail(e.id || e.eventId);
              const detailData = detail?.data ?? detail ?? {};
              const evList = detailData.evidences || detailData.evidenceFiles || [];
              if (Array.isArray(evList)) {
                evList.forEach(ev => {
                  allEvs.push({
                    id: ev.id || ev.evidenceId,
                    userId: ev.studentId || ev.userId || 'N/A',
                    userFullName: ev.studentName || ev.userFullName || 'Sinh viên',
                    clubId: detailData.clubId,
                    clubName: detailData.clubName || 'CLB',
                    eventName: detailData.eventName || detailData.name,
                    evidenceType: ev.evidenceType || 'Check-in Photo',
                    fileUrl: ev.fileUrl || ev.url || '',
                    description: ev.feedback || ev.description || '',
                    submittedAt: ev.submittedAt || new Date().toISOString(),
                    status: ev.status || 'Pending'
                  });
                });
              }
            } catch (detailErr) {
              console.error(`Error loading detail for event ${e.id}:`, detailErr);
            }
          }));
        }
      }

      setEvidences(allEvs);
    } catch (err) {
      console.error('[EvidenceApproval] Lỗi tải minh chứng:', err);
      triggerNotification('Không tải được danh sách minh chứng!', 'error');
      setEvidences([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId, triggerNotification]);

  useEffect(() => {
    loadEvidences();
  }, [loadEvidences]);


  const handleApprove = async (ev) => {
    try {
      await reviewEvidence(ev.id, { status: 'Hợp lệ' });
      triggerNotification(`✅ Đã duyệt chứng nhận của ${ev.userFullName}!`, 'success');
      await loadEvidences();
    } catch (err) {
      console.error('[EvidenceApproval] Lỗi duyệt chứng nhận:', err);
      triggerNotification(err?.response?.data?.message || 'Xét duyệt chứng nhận thất bại!', 'error');
    }
    setExpandedId(null);
  };

  const handleReject = async (ev) => {
    const remark = remarkMap[ev.id] || '';
    if (!remark.trim()) {
      triggerNotification('Vui lòng nhập lý do từ chối!', 'warning');
      return;
    }
    try {
      await reviewEvidence(ev.id, { status: 'Không hợp lệ', rejectReason: remark });
      triggerNotification(`❌ Đã từ chối chứng nhận của ${ev.userFullName}!`, 'success');
      await loadEvidences();
    } catch (err) {
      console.error('[EvidenceApproval] Lỗi từ chối chứng nhận:', err);
      triggerNotification(err?.response?.data?.message || 'Xét duyệt chứng nhận thất bại!', 'error');
    }
    setExpandedId(null);
  };

  const filtered = evidences.filter(ev => {
    const matchClub = !selectedClubId || String(ev.clubId) === String(selectedClubId);
    const matchStatus = filterStatus === 'ALL' || ev.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || ev.userFullName.toLowerCase().includes(q) || ev.userId.toLowerCase().includes(q) || ev.eventName.toLowerCase().includes(q);
    return matchClub && matchStatus && matchSearch;
  });

  const pendingCount = evidences.filter(e => e.status === 'Pending').length;
  const approvedCount = evidences.filter(e => e.status === 'Approved').length;
  const rejectedCount = evidences.filter(e => e.status === 'Rejected').length;

  return (
    <div className="evidence-approval-container">

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stats-card" onClick={() => setFilterStatus('Pending')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--warning)' }}><AlertCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Chờ duyệt</span>
            <span className="stats-value" style={{ color: pendingCount > 0 ? 'var(--warning)' : undefined }}>{pendingCount}</span>
          </div>
        </div>
        <div className="stats-card" onClick={() => setFilterStatus('Approved')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã duyệt</span>
            <span className="stats-value">{approvedCount}</span>
          </div>
        </div>
        <div className="stats-card" onClick={() => setFilterStatus('Rejected')} style={{ cursor: 'pointer' }}>
          <div className="stats-icon-box" style={{ color: 'var(--error)' }}><X size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã từ chối</span>
            <span className="stats-value">{rejectedCount}</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title"><FileText size={18} /> Duyệt Chứng nhận Tham gia</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setFilterStatus('Pending')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Làm mới
          </button>
        </div>

        <div className="search-filter-row">
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input type="text" className="input-field" placeholder="Tìm theo tên, MSSV, tên sự kiện..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <select className="select-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '150px' }}>
            <option value="ALL">Tất cả</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Từ chối</option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
            <p style={{ marginTop: '10px' }}>Đang tải danh sách minh chứng...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-view">
            <FileText className="empty-state-icon" />
            <p>Không có chứng nhận nào phù hợp.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {filtered.map(ev => {
              return (
                <div key={ev.id} className="glass-card" style={{ padding: '16px', marginBottom: 0, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }} onClick={() => setExpandedId(ev.id)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>{ev.userFullName}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({ev.userId})</span>
                        {ev.status === 'Pending' && <span className="badge badge-member"><Clock size={10} /> Chờ duyệt</span>}
                        {ev.status === 'Approved' && <span className="badge badge-active"><CheckCircle size={10} /> Đã duyệt</span>}
                        {ev.status === 'Rejected' && <span className="badge badge-blocked"><X size={10} /> Từ chối</span>}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-main)', marginBottom: '4px' }}>
                        <strong>Sự kiện:</strong> {ev.eventName} · <strong>Loại:</strong> {ev.evidenceType}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Nộp lúc: {new Date(ev.submittedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(ev.id)}>
                        {ev.status === 'Pending' ? 'Xem xét' : 'Chi tiết'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: CHI TIẾT & PHÊ DUYỆT MINH CHỨNG */}
      {expandedId && (() => {
        const ev = filtered.find(e => e.id === expandedId);
        if (!ev) return null;
        return (
          <div className="modal-backdrop">
            <div className="modal-content glass-card" style={{ maxWidth: '540px', width: '90%' }}>
              <div className="modal-header">
                <h3 className="modal-title"><FileText size={18} style={{ marginRight: '6px' }} /> Chi tiết &amp; Phê duyệt Minh chứng</h3>
                <button className="modal-close" onClick={() => setExpandedId(null)}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                <h4 style={{ fontSize: '16px', color: 'var(--text-heading)', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                  Sinh viên: {ev.userFullName} ({ev.userId})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['Sự kiện', ev.eventName],
                    ['Loại minh chứng', ev.evidenceType],
                    ['Thời điểm nộp', new Date(ev.submittedAt).toLocaleString('vi-VN')],
                    ['Trạng thái', (() => {
                      if (ev.status === 'Pending') return <span className="badge badge-member"><Clock size={10} /> Chờ duyệt</span>;
                      if (ev.status === 'Approved') return <span className="badge badge-active"><CheckCircle size={10} /> Đã duyệt</span>;
                      return <span className="badge badge-blocked"><X size={10} /> Từ chối</span>;
                    })()]
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <span style={{ minWidth: '150px', fontSize: '12px', color: 'var(--text-muted)' }}>{label}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-main)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {ev.description && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    <strong>Mô tả của sinh viên:</strong> {ev.description}
                  </div>
                )}

                {ev.rejectReason && (
                  <div style={{ padding: '8px', background: 'rgba(239,68,68,0.08)', borderRadius: '6px', fontSize: '12px', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <strong>Lý do từ chối trước đó:</strong> {ev.rejectReason}
                  </div>
                )}

                {ev.fileUrl && (
                  <div style={{ textCenter: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Hình ảnh minh chứng: (Click để xem kích thước lớn)</div>
                    <img
                      src={ev.fileUrl}
                      alt="Evidence"
                      style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => setPreviewUrl(ev.fileUrl)}
                    />
                  </div>
                )}

                {ev.status === 'Pending' ? (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lý do từ chối (bắt buộc nếu từ chối):</label>
                      <textarea
                        className="textarea-field"
                        rows={2}
                        placeholder="Nhập lý do từ chối..."
                        value={remarkMap[ev.id] || ''}
                        onChange={e => setRemarkMap(m => ({ ...m, [ev.id]: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="btn btn-success btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => { handleApprove(ev); setExpandedId(null); }}>
                        <Check size={14} /> Phê duyệt
                      </button>
                      <button className="btn btn-danger btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} onClick={() => { handleReject(ev); setExpandedId(null); }}>
                        <X size={14} /> Từ chối
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(null)}>Đóng</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(null)}>Đóng</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image Preview Modal */}
      {previewUrl && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
          onClick={() => setPreviewUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={previewUrl} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', objectFit: 'contain' }} />
            <button
              onClick={() => setPreviewUrl(null)}
              style={{ position: 'absolute', top: '-12px', right: '-12px', background: 'var(--error)', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}
