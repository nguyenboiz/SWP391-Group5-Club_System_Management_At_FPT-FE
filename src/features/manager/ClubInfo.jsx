import React, { useState, useEffect } from 'react';
import { mockDb } from '../../utils/mockDb';
import { Edit, Save, Link, Users, Landmark, FileText, CheckCircle } from 'lucide-react';

export default function ClubInfo({ dbData, selectedClubId, triggerNotification }) {
  const { clubs, clubBoards, boardMembers, users } = dbData;
  const club = clubs.find(c => c.id === selectedClubId);

  // Form states for club info
  const [clubName, setClubName] = useState('');
  const [intro, setIntro] = useState('');
  const [logo, setLogo] = useState('');
  const [fanpage, setFanpage] = useState('');

  // Form states for board layout
  const [handoverDoc, setHandoverDoc] = useState('');
  const [presidentId, setPresidentId] = useState('');
  const [vicePresidentId, setVicePresidentId] = useState('');
  const [techLeadId, setTechLeadId] = useState('');

  // Load details whenever club ID changes
  useEffect(() => {
    if (club) {
      setClubName(club.name);
      setIntro(club.intro);
      setLogo(club.logo);
      setFanpage(club.fanpage);

      // Find board for SU26 term
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

  const handleUpdateClub = (e) => {
    e.preventDefault();
    mockDb.updateClub(selectedClubId, clubName, intro, logo, fanpage);
    triggerNotification('Cập nhật thông tin CLB thành công!', 'success');
  };

  const handleUpdateBoard = (e) => {
    e.preventDefault();
    if (!presidentId) {
      triggerNotification('Vui lòng chọn vị trí Chủ nhiệm CLB!', 'warning');
      return;
    }

    const boardMembersList = [
      { userId: presidentId, position: 'President' }
    ];
    if (vicePresidentId) boardMembersList.push({ userId: vicePresidentId, position: 'Vice President' });
    if (techLeadId) boardMembersList.push({ userId: techLeadId, position: 'Tech Lead' });

    mockDb.updateClubBoard(selectedClubId, 'Học kỳ Summer 2026', handoverDoc, boardMembersList);
    triggerNotification('Thiết lập bộ máy lãnh đạo khóa mới và tài liệu bàn giao thành công!', 'success');
  };

  // Filter list of users who are members of this club to populate leadership selector
  const clubMembers = dbData.memberships
    .filter(m => m.clubId === selectedClubId && m.status === 'Active')
    .map(m => users.find(u => u.id === m.userId))
    .filter(Boolean);

  return (
    <div className="club-info-management">
      <div className="dashboard-grid-2col">
        {/* Left Side: General Profile Form */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Landmark size={18} /> Hồ sơ công khai của CLB</h3>
          </div>

          <form onSubmit={handleUpdateClub}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
              <img 
                src={logo || 'https://via.placeholder.com/120'} 
                alt="Club Logo" 
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover' }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>URL Ảnh Logo CLB</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={logo} 
                  onChange={e => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tên Câu Lạc Bộ</label>
              <input 
                type="text" 
                className="input-field" 
                value={clubName} 
                onChange={e => setClubName(e.target.value)}
                placeholder="Nhập tên câu lạc bộ"
                required
              />
            </div>

            <div className="form-group">
              <label>Link Fanpage Facebook</label>
              <input 
                type="text" 
                className="input-field" 
                value={fanpage} 
                onChange={e => setFanpage(e.target.value)}
                placeholder="https://facebook.com/club..."
              />
            </div>

            <div className="form-group">
              <label>Giới thiệu tóm tắt hoạt động</label>
              <textarea 
                className="textarea-field" 
                value={intro} 
                onChange={e => setIntro(e.target.value)}
                placeholder="Mô tả tôn chỉ hoạt động, thành tích..."
                rows={5}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Lưu thông tin giới thiệu
            </button>
          </form>
        </div>

        {/* Right Side: Board layout & handover documents */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Users size={18} /> Thiết lập Ban Điều hành khóa mới</h3>
          </div>

          <form onSubmit={handleUpdateBoard}>
            <div className="form-group">
              <label>Chủ nhiệm CLB (President)</label>
              <select 
                className="select-field" 
                value={presidentId} 
                onChange={e => setPresidentId(e.target.value)}
                required
              >
                <option value="">-- Chọn Chủ nhiệm --</option>
                {clubMembers.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Phó chủ nhiệm CLB (Vice President)</label>
              <select 
                className="select-field" 
                value={vicePresidentId} 
                onChange={e => setVicePresidentId(e.target.value)}
              >
                <option value="">-- Chọn Phó chủ nhiệm (Không bắt buộc) --</option>
                {clubMembers.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Trưởng ban chuyên môn (Tech Lead)</label>
              <select 
                className="select-field" 
                value={techLeadId} 
                onChange={e => setTechLeadId(e.target.value)}
              >
                <option value="">-- Chọn Trưởng ban CM (Không bắt buộc) --</option>
                {clubMembers.map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.id})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><Link size={14} /> Đường dẫn Tài liệu Bàn giao công việc (Handover Link)</label>
              <input 
                type="text" 
                className="input-field" 
                value={handoverDoc} 
                onChange={e => setHandoverDoc(e.target.value)}
                placeholder="https://docs.google.com/document/d/..."
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Đường dẫn liên kết tài liệu chi tiết chuyển giao kinh nghiệm cho khóa sau.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Save size={16} /> Lưu Cấu trúc & Tài liệu Bàn giao
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
