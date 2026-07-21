import React, { useState, useEffect, useCallback } from 'react';
import { getClubMembers } from '../../services/membershipService';
import { Search, Users, Landmark, Mail, Phone, RefreshCw } from 'lucide-react';

export default function MemberSearch({ currentUserId, selectedClubId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadMembers = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await getClubMembers(selectedClubId);
      const memberList = Array.isArray(data) ? data : (data?.members ?? data?.data ?? []);
      setMembers(memberList);
    } catch (err) {
      console.error('[MemberSearch] Lỗi tải thành viên:', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = members.filter(m => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (m.fullName || m.name || '').toLowerCase();
    const id = (m.studentId || m.userId || m.id || '').toLowerCase();
    const email = (m.email || '').toLowerCase();
    return name.includes(q) || id.includes(q) || email.includes(q);
  });

  if (!selectedClubId) {
    return (
      <div className="glass-card">
        <div className="empty-state-view">
          <Users className="empty-state-icon" />
          <p>Vui lòng chọn câu lạc bộ để xem danh sách thành viên.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alumni-search-container">
      {/* Header + Search */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title"><Users size={18} /> Tìm thành viên CLB</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadMembers}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Xem danh sách thành viên đang sinh hoạt trong CLB của bạn.
        </p>

        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="input-field"
            placeholder="Tìm theo tên, MSSV, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <Landmark size={14} />
          <span>CLB #{selectedClubId} · {members.length} thành viên</span>
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
            <p style={{ marginTop: '10px' }}>Đang tải danh sách thành viên...</p>
          </div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <Users className="empty-state-icon" />
            <p>Không tìm thấy thành viên nào phù hợp.</p>
          </div>
        </div>
      ) : (
        <div className="cards-grid">
          {filteredMembers.map((m, idx) => {
            const name = m.fullName || m.name || 'Chưa cập nhật';
            const studentId = m.studentId || m.userId || m.id || 'N/A';
            const email = m.email || '';
            const role = m.role || m.clubRole || 'Member';
            const cohort = m.cohort || '';
            const isThisLeader = role === 'Leader' || role === 'Trưởng CLB';
            return (
              <div key={m.membershipId || m.id || idx} className="alumni-card">
                <div className="alumni-header">
                  <div className="alumni-title-group">
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0
                    }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ marginLeft: '12px' }}>
                      <span className="alumni-name">{name}</span>
                      <div className="alumni-meta-row" style={{ marginTop: '4px' }}>
                        <span className={`badge ${isThisLeader || role === 'Manager' ? 'badge-manager' : 'badge-member'}`}>
                          {isThisLeader ? 'Trưởng CLB' : role === 'Manager' ? 'Cán bộ quản lý' : 'Thành viên'}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>MSSV: {studentId}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {cohort && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Khóa <strong style={{ color: 'var(--text-main)' }}>{cohort}</strong>
                  </div>
                )}

                {email && (
                  <div className="alumni-contacts">
                    <div className="alumni-contact-item">
                      <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                      <a href={`mailto:${email}`}>{email}</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
