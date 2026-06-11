import React, { useState, useEffect } from 'react';
import { mockDb } from '../../utils/mockDb';
import { updateClub } from '../../services/clubService';
import { Edit2, Save, X, Link, Users, Landmark, ExternalLink } from 'lucide-react';

export default function ClubInfo({ dbData, selectedClubId, triggerNotification }) {
  const { clubs, clubBoards, boardMembers, users } = dbData;
  const club = clubs.find(c => c.id === selectedClubId);

  // Edit mode toggle
  const [isEditing, setIsEditing] = useState(false);

  // Form states for club info
  const [clubName, setClubName] = useState('');
  const [logo, setLogo] = useState('');
  const [fanpage, setFanpage] = useState('');

  // Form states for board layout
  const [handoverDoc, setHandoverDoc] = useState('');
  const [presidentId, setPresidentId] = useState('');
  const [vicePresidentId, setVicePresidentId] = useState('');
  const [techLeadId, setTechLeadId] = useState('');
  const [isBoardEditing, setIsBoardEditing] = useState(false);

  // Load details whenever club ID changes
  useEffect(() => {
    if (club) {
      setClubName(club.name);
      setLogo(club.logo);
      setFanpage(club.fanpage);
      setIsEditing(false);
      setIsBoardEditing(false);

      const board = clubBoards.find(b => b.clubId === selectedClubId && b.term.includes('SU26'));
      if (board) {
        setHandoverDoc(board.handoverDoc || '');
        const members = boardMembers.filter(bm => bm.boardId === board.id);
        const pres = members.find(m => m.position === 'President' || m.position === 'Chủ nhiệm');
        const vp = members.find(m => m.position === 'Vice President' || m.position === 'Phó chủ nhiệm');
        const tech = members.find(m => m.position === 'Tech Lead' || m.position === 'Trưởng ban chuyên môn');
        setPresidentId(pres ? pres.userId : '');
        setVicePresidentId(vp ? vp.userId : '');
        setTechLeadId(tech ? tech.userId : '');
      } else {
        setHandoverDoc('');
        setPresidentId('');
        setVicePresidentId('');
        setTechLeadId('');
      }
    }
  }, [selectedClubId, club, clubBoards, boardMembers]);

  if (!club) {
    return <div className="empty-state-view"><p>Vui lòng chọn Câu lạc bộ để quản lý.</p></div>;
  }

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    try {
      await updateClub(selectedClubId, {
        clubName: clubName,
        description: club.intro || null,
        logoImage: logo || null,
        fanpageUrl: fanpage || null,
        foundedDate: null, // nếu cần thêm field thì bổ sung state
      });
      triggerNotification('Cập nhật thông tin CLB thành công!', 'success');
      setIsEditing(false);
    } catch (err) {
      console.error('[ClubInfo] Lỗi cập nhật CLB:', err);
      triggerNotification(
        err?.response?.data?.message || 'Cập nhật thất bại. Vui lòng thử lại!',
        'error'
      );
    }
  };

  const handleCancelEdit = () => {
    setClubName(club.name);
    setLogo(club.logo);
    setFanpage(club.fanpage);
    setIsEditing(false);
  };

  const handleUpdateBoard = (e) => {
    e.preventDefault();
    if (!presidentId) {
      triggerNotification('Vui lòng chọn vị trí Chủ nhiệm CLB!', 'warning');
      return;
    }
    const boardMembersList = [{ userId: presidentId, position: 'President' }];
    if (vicePresidentId) boardMembersList.push({ userId: vicePresidentId, position: 'Vice President' });
    if (techLeadId) boardMembersList.push({ userId: techLeadId, position: 'Tech Lead' });
    mockDb.updateClubBoard(selectedClubId, 'Học kỳ Summer 2026', handoverDoc, boardMembersList);
    triggerNotification('Thiết lập ban điều hành thành công!', 'success');
    setIsBoardEditing(false);
  };

  const clubMembers = dbData.memberships
    .filter(m => m.clubId === selectedClubId && m.status === 'Active')
    .map(m => users.find(u => u.id === m.userId))
    .filter(Boolean);

  // Find current board members for display
  const currentBoard = clubBoards.find(b => b.clubId === selectedClubId && b.term.includes('SU26'));
  const currentBoardMembers = currentBoard
    ? boardMembers.filter(bm => bm.boardId === currentBoard.id).map(bm => ({
        ...bm,
        user: users.find(u => u.id === bm.userId)
      }))
    : [];

  return (
    <div className="club-info-management">
      <div className="dashboard-grid-2col">
        {/* Left Side: Club Profile */}
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="glass-card-title"><Landmark size={18} /> Hồ sơ Câu lạc bộ</h3>
            {!isEditing ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsEditing(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit2 size={14} /> Chỉnh sửa
              </button>
            ) : (
              <button
                className="btn btn-sm"
                onClick={handleCancelEdit}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
              >
                <X size={14} /> Hủy
              </button>
            )}
          </div>

          {!isEditing ? (
            /* View Mode */
            <div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                <img
                  src={club.logo || 'https://via.placeholder.com/80'}
                  alt="Club Logo"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '18px', color: 'var(--text-heading)', marginBottom: '4px' }}>{club.name}</h4>
                  <span className="badge badge-manager">{club.category}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Fanpage</div>
                  <a href={club.fanpage} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {club.fanpage} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleUpdateClub}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                <img
                  src={logo || 'https://via.placeholder.com/80'}
                  alt="Club Logo"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>URL Ảnh Logo CLB</label>
                  <input type="text" className="input-field" value={logo} onChange={e => setLogo(e.target.value)} placeholder="https://example.com/logo.png" />
                </div>
              </div>

              <div className="form-group">
                <label>Tên Câu Lạc Bộ</label>
                <input type="text" className="input-field" value={clubName} onChange={e => setClubName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label>Link Fanpage Facebook</label>
                <input type="text" className="input-field" value={fanpage} onChange={e => setFanpage(e.target.value)} placeholder="https://facebook.com/club..." />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={14} /> Lưu thay đổi
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side: Board Layout */}
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="glass-card-title"><Users size={18} /> Ban Điều hành (SU26)</h3>
            {!isBoardEditing ? (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsBoardEditing(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Edit2 size={14} /> Chỉnh sửa
              </button>
            ) : (
              <button
                className="btn btn-sm"
                onClick={() => setIsBoardEditing(false)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
              >
                <X size={14} /> Hủy
              </button>
            )}
          </div>

          {!isBoardEditing ? (
            /* View Mode: Board members list */
            <div>
              {currentBoardMembers.length === 0 ? (
                <div className="empty-state-view" style={{ padding: '20px' }}>
                  <p style={{ fontSize: '13px' }}>Chưa thiết lập ban điều hành. Nhấn "Chỉnh sửa" để cấu hình.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentBoardMembers.map(bm => (
                    <div key={bm.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>
                        {bm.user?.fullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-heading)', fontSize: '14px' }}>{bm.user?.fullName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{bm.position} · {bm.user?.id}</div>
                      </div>
                    </div>
                  ))}
                  {currentBoard?.handoverDoc && (
                    <div style={{ padding: '10px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Tài liệu bàn giao:</div>
                      <a href={currentBoard.handoverDoc} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Link size={11} /> Mở tài liệu <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleUpdateBoard}>
              <div className="form-group">
                <label>Chủ nhiệm CLB (President)</label>
                <select className="select-field" value={presidentId} onChange={e => setPresidentId(e.target.value)} required>
                  <option value="">-- Chọn Chủ nhiệm --</option>
                  {clubMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phó chủ nhiệm (Vice President)</label>
                <select className="select-field" value={vicePresidentId} onChange={e => setVicePresidentId(e.target.value)}>
                  <option value="">-- Không bắt buộc --</option>
                  {clubMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Trưởng ban chuyên môn (Tech Lead)</label>
                <select className="select-field" value={techLeadId} onChange={e => setTechLeadId(e.target.value)}>
                  <option value="">-- Không bắt buộc --</option>
                  {clubMembers.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.id})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label><Link size={14} /> Tài liệu Bàn giao (Handover Link)</label>
                <input type="text" className="input-field" value={handoverDoc} onChange={e => setHandoverDoc(e.target.value)} placeholder="https://docs.google.com/..." />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={14} /> Lưu Ban Điều hành
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsBoardEditing(false)}>
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
