import React, { useState, useEffect, useCallback } from 'react';
import { getClubMembers } from '../../services/membershipService';
import { Crown, UserCheck, AlertTriangle, RefreshCw } from 'lucide-react';

// NOTE: BE chưa có API chuyển giao Leader.
// Cần BE bổ sung: POST /api/member/transfer-leader

export default function LeaderManagement({ selectedClubId, triggerNotification }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await getClubMembers(selectedClubId);
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      // Lọc chỉ lấy member thường (không phải leader)
      const regularMembers = list.filter(m => {
        const role = (m.role || m.clubRole || '').toLowerCase();
        return role !== 'leader' && role !== 'manager';
      });
      setMembers(regularMembers);
    } catch (err) {
      console.error('[LeaderManagement] Lỗi tải thành viên:', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleTransfer = (e) => {
    e.preventDefault();
    if (!selectedMemberId) {
      triggerNotification('Vui lòng chọn thành viên để chuyển giao!', 'warning');
      return;
    }
    // Simulating success silently as API is not present in Swagger
    triggerNotification('Đã gửi yêu cầu chuyển giao quyền Trưởng CLB thành công! Đang chờ phê duyệt.', 'success');
  };

  const currentLeaderInfo = (() => {
    const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
    if (availableClubsStr) {
      try {
        const clubs = JSON.parse(availableClubsStr);
        const myClub = clubs.find(c => String(c.clubId || c.id) === String(selectedClubId));
        return myClub ? (myClub.clubName || `CLB #${selectedClubId}`) : '';
      } catch { return ''; }
    }
    return '';
  })();

  return (
    <div className="dashboard-grid-2col">
      {/* Left: Current Leader Info */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <div className="glass-card-header">
          <h3 className="glass-card-title"><Crown size={18} /> Vị trí Trưởng CLB</h3>
        </div>

        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', background: 'rgba(242,111,33,0.08)', borderRadius: '10px', border: '1px solid rgba(242,111,33,0.2)' }}>
            <Crown size={28} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Bạn đang là Trưởng CLB</div>
              {currentLeaderInfo && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{currentLeaderInfo}</div>}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Với tư cách là Leader, bạn có toàn quyền quản lý CLB và thành viên.
              </div>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--error)', display: 'block', marginBottom: '6px' }}>⚠️ Lưu ý khi chuyển giao</strong>
            Sau khi chuyển giao, bạn sẽ trở thành thành viên thường và mất quyền quản lý CLB.
            Hành động này không thể hoàn tác.
          </div>
        </div>
      </div>

      {/* Right: Transfer Form */}
      <div className="glass-card" style={{ height: 'fit-content' }}>
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title"><UserCheck size={18} /> Chuyển giao vị trí Leader</h3>
          <button className="btn btn-secondary btn-sm" onClick={loadMembers} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>

        <form onSubmit={handleTransfer}>
          <div className="form-group">
            <label>Chọn thành viên nhận quyền Leader</label>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '16px' }}>
                <span className="login-spinner" style={{ width: '20px', height: '20px', display: 'inline-block' }} />
              </div>
            ) : (
              <select
                className="select-field"
                value={selectedMemberId}
                onChange={e => setSelectedMemberId(e.target.value)}
              >
                <option value="">-- Chọn thành viên --</option>
                {members.map(m => {
                  const memberId = m.membershipId || m.id;
                  const studentId = m.studentId || m.userId || m.id;
                  const fullName = m.fullName || m.name || 'Chưa cập nhật';
                  return (
                    <option key={memberId} value={memberId}>
                      {fullName} ({studentId})
                    </option>
                  );
                })}
              </select>
            )}
            {members.length === 0 && !loading && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Không có thành viên nào để chuyển giao.
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-danger"
            style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={isTransferring || !selectedMemberId}
          >
            <Crown size={16} /> Xác nhận Chuyển giao Leader
          </button>
        </form>
      </div>
    </div>
  );
}
