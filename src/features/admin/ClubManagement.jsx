import React, { useState } from 'react';
import { createClub, updateClub } from '../../services/clubService';
import { PlusCircle, Landmark, Image, Link, Tag, UserCheck, List, AlertTriangle, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

// NOTE: BE chưa có API:
//   GET /api/clubs - danh sách tất cả CLB  
//   PUT /api/clubs/{id}/status - đổi trạng thái CLB
// Danh sách CLB tạm dùng localStorage mock

export default function ClubManagement({ triggerNotification }) {
  const [activeView, setActiveView] = useState('list'); // 'list' | 'create'
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

  // Mock club list (vì BE chưa có GET /api/clubs)
  const [mockClubs, setMockClubs] = useState(() => {
    try {
      const stored = localStorage.getItem('fpt_mock_clubs');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.clubName.trim()) {
      triggerNotification('Vui lòng nhập tên câu lạc bộ!', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createClub({
        clubName: form.clubName,
        clubCode: form.clubCode || null,
        description: form.description || null,
        fanpageUrl: form.fanpageUrl || null,
        logoImage: form.logoImage || null,
        foundedDate: form.foundedDate || null,
        managerStudentId: form.managerStudentId || null,
      });

      const newClubId = result?.clubId || result?.id || result;
      const newClub = {
        id: newClubId || Date.now(),
        clubName: form.clubName,
        clubCode: form.clubCode,
        description: form.description,
        logoImage: form.logoImage,
        fanpageUrl: form.fanpageUrl,
        status: 'Active',
        createdAt: new Date().toISOString(),
      };

      setLastCreated(newClub);
      const updated = [...mockClubs, newClub];
      setMockClubs(updated);
      localStorage.setItem('fpt_mock_clubs', JSON.stringify(updated));

      triggerNotification(`Đã tạo câu lạc bộ "${form.clubName}" thành công!`, 'success');
      setForm({ clubName: '', clubCode: '', description: '', fanpageUrl: '', logoImage: '', foundedDate: '', managerStudentId: '' });
      setActiveView('list');
    } catch (err) {
      console.error('[ClubManagement] Lỗi tạo CLB:', err);
      triggerNotification(
        err?.response?.data?.message || 'Tạo câu lạc bộ thất bại. Vui lòng thử lại!',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (club) => {
    const newStatus = club.status === 'Active' ? 'Suspended' : 'Active';
    const updated = mockClubs.map(c => c.id === club.id ? { ...c, status: newStatus } : c);
    setMockClubs(updated);
    localStorage.setItem('fpt_mock_clubs', JSON.stringify(updated));
    triggerNotification(
      `Đã ${newStatus === 'Active' ? 'kích hoạt' : 'tạm dừng'} CLB "${club.clubName}"! (Mock - Chờ BE bổ sung API)`,
      'success'
    );
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
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Landmark size={18} /> Danh sách Câu lạc bộ</h3>
          </div>

          <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.15)', fontSize: '12px', color: 'var(--text-muted)' }}>
            <AlertTriangle size={12} style={{ marginRight: '4px', color: 'var(--warning)' }} />
            Danh sách dưới đây chỉ hiển thị CLB được tạo qua phiên làm việc này (mock).
            Yêu cầu BE bổ sung <code>GET /api/clubs</code> để hiển thị toàn bộ.
          </div>

          {mockClubs.length === 0 ? (
            <div className="empty-state-view">
              <Landmark className="empty-state-icon" />
              <p>Chưa có CLB nào được tạo qua giao diện này.</p>
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
                  {mockClubs.map(club => (
                    <tr key={club.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {club.logoImage ? (
                            <img src={club.logoImage} alt={club.clubName} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
                              {(club.clubName || 'C').charAt(0)}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{club.clubName}</div>
                            {club.description && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{club.description.substring(0, 60)}...</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        {club.clubCode && <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>{club.clubCode}</span>}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {club.createdAt ? new Date(club.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td>
                        <span className={`badge ${club.status === 'Active' ? 'badge-active' : 'badge-blocked'}`}>
                          {club.status === 'Active' ? 'Đang hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={`btn btn-sm ${club.status === 'Active' ? 'btn-secondary' : 'btn-success'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                          onClick={() => handleToggleStatus(club)}
                        >
                          {club.status === 'Active' ? <><ToggleLeft size={12} /> Tạm dừng</> : <><ToggleRight size={12} /> Kích hoạt</>}
                        </button>
                      </td>
                    </tr>
                  ))}
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
                <input type="text" className="input-field" placeholder="Ví dụ: SE170111" value={form.managerStudentId} onChange={e => handleChange('managerStudentId', e.target.value)} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Nhập MSSV của người sẽ được bổ nhiệm làm quản lý CLB.</span>
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
    </div>
  );
}
