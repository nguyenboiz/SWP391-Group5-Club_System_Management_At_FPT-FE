import React, { useState, useEffect, useCallback } from 'react';
import * as clubService from '../../services/clubService';
import apiClient from '../../utils/apiClient';
import { PlusCircle, Landmark, Image, Link, Tag, UserCheck, List, Info, RefreshCw, Edit2, Lock, Unlock, X, Save } from 'lucide-react';

export default function ClubManagement({ triggerNotification }) {
  const [activeView, setActiveView] = useState('list');
  const [form, setForm] = useState({
    clubName: '',
    clubCode: '',
    description: '',
    fanpageUrl: '',
    logoImage: '',
    foundedDate: '',
    managerStudentId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState(null);

  // Clubs từ API thật / LocalStorage fallback
  const [clubs, setClubs] = useState([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [hasClubApi, setHasClubApi] = useState(null);

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [editForm, setEditForm] = useState({
    clubName: '',
    clubCode: '',
    description: '',
    fanpageUrl: '',
    logoImage: '',
    foundedDate: '',
  });

  const loadClubs = useCallback(async () => {
    setLoadingClubs(true);
    try {
      const res = await apiClient.get('/api/clubs');
      const data = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
      setClubs(data);
      setHasClubApi(true);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        setHasClubApi(false);
        let localClubs = localStorage.getItem('mock_clubs');
        if (!localClubs) {
          const defaultClubs = [
            { id: '1', clubName: 'JS Club - Japanese Software Engineering', clubCode: 'JS', logoImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80', fanpageUrl: 'https://facebook.com/jsclub.fptu', description: 'CLB Kỹ nghệ phần mềm Nhật Bản tại FPT University.', foundedDate: '2026-01-10', status: 'Active', createdAt: new Date().toISOString() },
            { id: '2', clubName: 'Melody Club - Music & Arts', clubCode: 'MELODY', logoImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=120&h=120&q=80', fanpageUrl: 'https://facebook.com/melodyclub.fptu', description: 'CLB Âm nhạc và biểu diễn nghệ thuật.', foundedDate: '2026-02-15', status: 'Active', createdAt: new Date().toISOString() },
            { id: '3', clubName: 'FPT Chess Club', clubCode: 'CHESS', logoImage: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=120&h=120&q=80', fanpageUrl: 'https://facebook.com/fptchess.fptu', description: 'CLB Cờ vua Đại học FPT.', foundedDate: '2026-03-05', status: 'Active', createdAt: new Date().toISOString() },
          ];
          localStorage.setItem('mock_clubs', JSON.stringify(defaultClubs));
          localClubs = JSON.stringify(defaultClubs);
        }
        setClubs(JSON.parse(localClubs));
      } else {
        console.error('[ClubManagement] Lỗi tải CLB:', err);
        setHasClubApi(false);
      }
    } finally {
      setLoadingClubs(false);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const syncLocalClubs = (updated) => {
    setClubs(updated);
    localStorage.setItem('mock_clubs', JSON.stringify(updated));
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // 1. Tạo CLB mới
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clubName.trim()) {
      triggerNotification('Vui lòng nhập tên câu lạc bộ!', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      if (hasClubApi) {
        const result = await clubService.createClub({
          clubName: form.clubName,
          clubCode: form.clubCode || null,
          description: form.description || null,
          fanpageUrl: form.fanpageUrl || null,
          logoImage: form.logoImage || null,
          foundedDate: form.foundedDate || null,
          managerStudentId: form.managerStudentId || null,
        });
        triggerNotification(`Đã tạo câu lạc bộ "${form.clubName}" thành công!`, 'success');
        setForm({ clubName: '', clubCode: '', description: '', fanpageUrl: '', logoImage: '', foundedDate: '', managerStudentId: '' });
        await loadClubs();
        setActiveView('list');
      } else {
        // Mock
        const newId = String(Date.now());
        const newClub = {
          id: newId,
          clubName: form.clubName,
          clubCode: form.clubCode || form.clubName.slice(0, 3).toUpperCase(),
          description: form.description || '',
          logoImage: form.logoImage || '',
          fanpageUrl: form.fanpageUrl || '',
          foundedDate: form.foundedDate || new Date().toISOString().split('T')[0],
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        const updated = [...clubs, newClub];
        syncLocalClubs(updated);
        triggerNotification(`Đã tạo câu lạc bộ "${form.clubName}" thành công! (Mock)`, 'success');
        setForm({ clubName: '', clubCode: '', description: '', fanpageUrl: '', logoImage: '', foundedDate: '', managerStudentId: '' });
        setActiveView('list');
      }
    } catch (err) {
      console.error('[ClubManagement] Lỗi tạo CLB:', err);
      triggerNotification(err?.response?.data?.message || 'Tạo câu lạc bộ thất bại!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Cập nhật thông tin CLB
  const handleEditClick = (club) => {
    setEditingClub(club);
    setEditForm({
      clubName: club.clubName || club.name || '',
      clubCode: club.clubCode || club.code || '',
      description: club.description || '',
      fanpageUrl: club.fanpageUrl || '',
      logoImage: club.logoImage || '',
      foundedDate: club.foundedDate || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    if (!editForm.clubName.trim()) {
      triggerNotification('Vui lòng nhập tên câu lạc bộ!', 'warning');
      return;
    }

    const cId = editingClub.id || editingClub.clubId;
    setIsSubmitting(true);
    try {
      if (hasClubApi) {
        await clubService.updateClub(cId, editForm);
        triggerNotification(`Cập nhật thông tin CLB "${editForm.clubName}" thành công!`, 'success');
        setShowEditModal(false);
        loadClubs();
      } else {
        // Mock
        const updated = clubs.map(c => {
          const currentId = c.id || c.clubId;
          return String(currentId) === String(cId) ? { ...c, ...editForm } : c;
        });
        syncLocalClubs(updated);
        triggerNotification(`Cập nhật thông tin CLB "${editForm.clubName}" thành công! (Mock)`, 'success');
        setShowEditModal(false);
      }
    } catch (err) {
      triggerNotification(err?.response?.data?.message || 'Cập nhật CLB thất bại!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Đổi trạng thái Đang hoạt động / Tạm dừng
  const handleToggleStatus = async (club) => {
    const cId = club.id || club.clubId;
    const nextStatus = club.status === 'Active' ? 'Suspended' : 'Active';

    try {
      if (hasClubApi) {
        // Nếu BE chưa có API status riêng, thử gửi update qua PUT updateClub
        await clubService.updateClub(cId, { ...club, status: nextStatus });
        triggerNotification(`Cập nhật trạng thái CLB sang: ${nextStatus === 'Active' ? 'Hoạt động' : 'Tạm dừng'}`, 'success');
        loadClubs();
      } else {
        // Mock
        const updated = clubs.map(c => {
          const currentId = c.id || c.clubId;
          return String(currentId) === String(cId) ? { ...c, status: nextStatus } : c;
        });
        syncLocalClubs(updated);
        triggerNotification(`Đã chuyển trạng thái CLB thành: ${nextStatus === 'Active' ? 'Đang hoạt động' : 'Tạm dừng'}! (Mock)`, 'success');
      }
    } catch (err) {
      triggerNotification('Thay đổi trạng thái CLB thất bại!', 'error');
    }
  };

  return (
    <div>
      {/* View Switcher */}
      <div className="glass-card" style={{ marginBottom: '24px', padding: '6px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className={`role-switch-btn ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
          >
            <List size={14} /> Danh sách CLB
          </button>
          <button
            className={`role-switch-btn ${activeView === 'create' ? 'active' : ''}`}
            onClick={() => setActiveView('create')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
          >
            <PlusCircle size={14} /> Tạo CLB mới
          </button>
        </div>
      </div>

      {/* List View */}
      {activeView === 'list' && (
        <div className="glass-card">
          <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="glass-card-title"><Landmark size={18} /> Danh sách Câu lạc bộ</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={loadClubs}
              disabled={loadingClubs}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={14} className={loadingClubs ? 'spin' : ''} /> Làm mới
            </button>
          </div>

          {/* No API notice */}
          {hasClubApi === false && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Info size={15} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '1px' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong style={{ color: '#3b82f6' }}>Đang sử dụng dữ liệu mô phỏng LocalStorage.</strong><br />
                Server BE chưa có API: <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>GET /api/clubs</code>. Bạn vẫn chỉnh sửa và tạo CLB cục bộ bình thường.
              </div>
            </div>
          )}

          {loadingClubs ? (
            <div className="empty-state-view">
              <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
            </div>
          ) : clubs.length === 0 ? (
            <div className="empty-state-view">
              <Landmark className="empty-state-icon" />
              <p>Chưa có câu lạc bộ nào trong hệ thống.</p>
              <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => setActiveView('create')}>
                <PlusCircle size={14} /> Tạo CLB đầu tiên
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Tên CLB</th>
                    <th>Mã CLB</th>
                    <th>Ngày tạo</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map(club => {
                    const cId = club.id || club.clubId;
                    const cName = club.clubName || club.name;
                    const cCode = club.clubCode || club.code;
                    const status = club.status || 'Active';
                    return (
                      <tr key={cId}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {club.logoImage ? (
                              <img src={club.logoImage} alt={cName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                                {(cName || 'C').charAt(0)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{cName}</div>
                              {club.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{club.description.substring(0, 60)}...</div>}
                            </div>
                          </div>
                        </td>
                        <td>{cCode && <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>{cCode}</span>}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {club.createdAt ? new Date(club.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td>
                          <span className={`badge ${status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>
                            {status === 'Active' ? 'Đang hoạt động' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Thay đổi Trạng thái"
                              onClick={() => handleToggleStatus(club)}
                              style={{ padding: '6px' }}
                            >
                              {status === 'Active' ? <Lock size={12} style={{ color: 'var(--error)' }} /> : <Unlock size={12} style={{ color: 'var(--success)' }} />}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Chỉnh sửa thông tin"
                              onClick={() => handleEditClick(club)}
                              style={{ padding: '6px' }}
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create View */}
      {activeView === 'create' && (
        <div className="dashboard-grid-2col">
          {/* Left: Create Form */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><PlusCircle size={18} /> Tạo Câu lạc bộ mới</h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Logo preview */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {form.logoImage ? (
                  <img src={form.logoImage} alt="Preview" style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                    <Image size={24} />
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}><Image size={12} style={{ marginRight: '4px' }} /> URL Ảnh Logo CLB</label>
                  <input type="text" className="input-field" placeholder="https://example.com/logo.png" value={form.logoImage} onChange={e => handleChange('logoImage', e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label><Landmark size={14} /> Tên Câu Lạc Bộ <span style={{ color: 'var(--error)' }}>*</span></label>
                <input type="text" className="input-field" placeholder="Ví dụ: FPT Guitar Club" value={form.clubName} onChange={e => handleChange('clubName', e.target.value)} required />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label><Tag size={14} /> Mã CLB (Club Code)</label>
                <input type="text" className="input-field" placeholder="Ví dụ: GUITAR" value={form.clubCode} onChange={e => handleChange('clubCode', e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label><Link size={14} /> Link Fanpage Facebook</label>
                <input type="text" className="input-field" placeholder="https://facebook.com/club..." value={form.fanpageUrl} onChange={e => handleChange('fanpageUrl', e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Ngày thành lập</label>
                <input type="date" className="input-field" value={form.foundedDate} onChange={e => handleChange('foundedDate', e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label><UserCheck size={14} /> MSSV Người quản lý (Student ID)</label>
                <input type="text" className="input-field" placeholder="Ví dụ: se180001" value={form.managerStudentId} onChange={e => handleChange('managerStudentId', e.target.value)} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Nhập username của người sẽ được bổ nhiệm làm quản lý CLB.</span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mô tả / Giới thiệu CLB</label>
                <textarea className="textarea-field" rows={4} placeholder="Giới thiệu ngắn về tôn chỉ hoạt động, mục tiêu của CLB..." value={form.description} onChange={e => handleChange('description', e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {isSubmitting ? <span className="login-spinner" /> : <><PlusCircle size={16} /> Tạo Câu lạc bộ</>}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setActiveView('list')}>Hủy</button>
              </div>
            </form>
          </div>

          {/* Right: Info Panel */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Landmark size={18} /> Hướng dẫn tạo CLB</h3>
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p>Điền đầy đủ thông tin bên trái để đăng ký một câu lạc bộ mới vào hệ thống.</p>
              <ul style={{ paddingLeft: '16px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Tên CLB</strong> là trường bắt buộc.</li>
                <li><strong>Mã CLB</strong> dùng để định danh ngắn (vd: GUITAR, FCODE).</li>
                <li><strong>MSSV Người quản lý</strong>: nếu để trống, CLB sẽ chưa có quản lý.</li>
              </ul>

              {lastCreated && (
                <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(34,197,94,0.08)', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '6px' }}>✓ CLB vừa tạo thành công</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-heading)' }}>{lastCreated.clubName}</div>
                  {lastCreated.id && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>ID: <strong>{lastCreated.id}</strong></div>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT CLUB MODAL */}
      {showEditModal && editingClub && (
        <div className="modal-backdrop">
          <div className="modal-content glass-card" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3 className="modal-title"><Edit2 size={18} style={{ marginRight: '6px' }} /> Chỉnh sửa thông tin CLB</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateClub} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                {editForm.logoImage ? (
                  <img src={editForm.logoImage} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}><Image size={20} /></div>
                )}
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>URL Logo CLB</label>
                  <input type="text" className="input-field" value={editForm.logoImage} onChange={e => setEditForm({ ...editForm, logoImage: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label>Tên Câu Lạc Bộ *</label>
                <input type="text" className="input-field" value={editForm.clubName} onChange={e => setEditForm({ ...editForm, clubName: e.target.value })} required />
              </div>

              <div className="form-group">
                <label>Mã CLB (Club Code)</label>
                <input type="text" className="input-field" value={editForm.clubCode} onChange={e => setEditForm({ ...editForm, clubCode: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Link Fanpage Facebook</label>
                <input type="text" className="input-field" value={editForm.fanpageUrl} onChange={e => setEditForm({ ...editForm, fanpageUrl: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Ngày thành lập</label>
                <input type="date" className="input-field" value={editForm.foundedDate} onChange={e => setEditForm({ ...editForm, foundedDate: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Mô tả hoạt động CLB</label>
                <textarea className="textarea-field" rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled={isSubmitting}>
                  <Save size={16} /> {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
