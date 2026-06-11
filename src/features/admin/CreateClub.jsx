import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { createClub } from '../../services/clubService';
import { PlusCircle, Landmark, Image, Link, Tag, UserCheck, ChevronRight, UserPlus, Users } from 'lucide-react';

export default function CreateClub({ dbData, triggerNotification }) {
  const { clubs, users, memberships } = dbData;

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
  const [createdClubId, setCreatedClubId] = useState(null);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // For Assign Manager to existing club
  const [assignClubId, setAssignClubId] = useState('');
  const [assignManagerId, setAssignManagerId] = useState('');
  const [isAssigningExisting, setIsAssigningExisting] = useState(false);

  // Users eligible to be manager (not admin, not already a leader of this club)
  const eligibleUsers = users.filter(u =>
    u.status === 'Active' && (u.role === 'MEMBER' || u.role === 'MANAGER')
  );

  const getClubManager = (clubId) => {
    const leaderMembership = memberships.find(
      m => m.clubId === clubId && m.role === 'Leader' && m.status === 'Active'
    );
    if (leaderMembership) {
      const u = users.find(user => user.id === leaderMembership.userId);
      return u ? `${u.fullName} (${u.id})` : leaderMembership.userId;
    }
    return 'Chưa có';
  };

  const handleAssignExistingClubManager = async (e) => {
    e.preventDefault();
    if (!assignClubId || !assignManagerId) {
      triggerNotification('Vui lòng chọn đầy đủ CLB và người dùng!', 'warning');
      return;
    }
    setIsAssigningExisting(true);
    await new Promise(r => setTimeout(r, 300));
    mockDb.assignManager(assignClubId, assignManagerId);
    const club = clubs.find(c => c.id === assignClubId);
    const user = users.find(u => u.id === assignManagerId);
    triggerNotification(`Đã gán ${user?.fullName} làm Manager cho CLB ${club?.name.split(' - ')[0]}!`, 'success');
    setAssignClubId('');
    setAssignManagerId('');
    setIsAssigningExisting(false);
  };

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

      // Lấy clubId từ response BE (tuỳ BE trả về dạng nào)
      const newClubId = result?.clubId || result?.id || result;
      setCreatedClubId(newClubId);
      triggerNotification(`Đã tạo câu lạc bộ "${form.clubName}" thành công!`, 'success');
      setForm({
        clubName: '',
        clubCode: '',
        description: '',
        fanpageUrl: '',
        logoImage: '',
        foundedDate: '',
        managerStudentId: ''
      });
    } catch (err) {
      console.error('[CreateClub] Lỗi tạo CLB:', err);
      triggerNotification(
        err?.response?.data?.message || 'Tạo câu lạc bộ thất bại. Vui lòng thử lại!',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedManagerId) {
      triggerNotification('Vui lòng chọn người dùng để gán làm Manager!', 'warning');
      return;
    }
    setIsAssigning(true);
    await new Promise(r => setTimeout(r, 300));
    mockDb.assignManager(createdClubId, selectedManagerId);
    const user = users.find(u => u.id === selectedManagerId);
    triggerNotification(`Đã gán ${user?.fullName || selectedManagerId} làm Manager!`, 'success');
    setSelectedManagerId('');
    setCreatedClubId(null);
    setIsAssigning(false);
  };

  const handleSkipAssign = () => {
    setCreatedClubId(null);
    setSelectedManagerId('');
  };

  return (
    <div className="club-info-management">
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
                <img
                  src={form.logoImage}
                  alt="Preview"
                  style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--primary)', objectFit: 'cover', flexShrink: 0 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexShrink: 0 }}>
                  <Image size={24} />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  <Image size={12} style={{ marginRight: '4px' }} /> URL Ảnh Logo CLB
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://example.com/logo.png"
                  value={form.logoImage}
                  onChange={e => handleChange('logoImage', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Landmark size={14} /> Tên Câu Lạc Bộ <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                type="text"
                className="input-field"
                placeholder="Ví dụ: FPT Guitar Club"
                value={form.clubName}
                onChange={e => handleChange('clubName', e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Tag size={14} /> Mã CLB (Club Code)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ví dụ: GUITAR"
                value={form.clubCode}
                onChange={e => handleChange('clubCode', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Link size={14} /> Link Fanpage Facebook</label>
              <input
                type="text"
                className="input-field"
                placeholder="https://facebook.com/club..."
                value={form.fanpageUrl}
                onChange={e => handleChange('fanpageUrl', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Ngày thành lập</label>
              <input
                type="date"
                className="input-field"
                value={form.foundedDate}
                onChange={e => handleChange('foundedDate', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><UserCheck size={14} /> MSSV Người quản lý (Student ID)</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ví dụ: SE170111"
                value={form.managerStudentId}
                onChange={e => handleChange('managerStudentId', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Mô tả / Giới thiệu CLB</label>
              <textarea
                className="textarea-field"
                rows={4}
                placeholder="Giới thiệu ngắn về tôn chỉ hoạt động, mục tiêu của CLB..."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
            >
              {isSubmitting ? (
                <span className="login-spinner" />
              ) : (
                <><PlusCircle size={16} /> Tạo Câu lạc bộ</>
              )}
            </button>
          </form>

          {/* Assign Manager Section – appears after club is created */}
          {createdClubId && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              background: 'rgba(var(--primary-rgb, 99, 102, 241), 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(var(--primary-rgb, 99, 102, 241), 0.3)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <UserCheck size={18} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 700, color: 'var(--text-heading)', fontSize: '14px' }}>
                  Gán Manager cho CLB vừa tạo
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Chọn người dùng để gán làm người quản lý (Leader) của câu lạc bộ này.
              </p>
              <select
                className="select-field"
                value={selectedManagerId}
                onChange={e => setSelectedManagerId(e.target.value)}
                style={{ marginBottom: '12px' }}
              >
                <option value="">-- Chọn người dùng --</option>
                {eligibleUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.id}) – {u.role}
                  </option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleAssignManager}
                  disabled={isAssigning}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 16px' }}
                >
                  {isAssigning ? <span className="login-spinner" /> : <><UserCheck size={14} /> Gán Manager</>}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleSkipAssign}
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  Bỏ qua
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Existing clubs list + Assign Manager panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Assign Manager to existing club */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><UserPlus size={18} /> Gán Manager cho CLB hiện có</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Chỉ định người dùng làm Leader quản lý một câu lạc bộ đang hoạt động.
            </p>
            <form onSubmit={handleAssignExistingClubManager} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Chọn Câu lạc bộ</label>
                <select
                  className="select-field"
                  value={assignClubId}
                  onChange={e => setAssignClubId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn CLB --</option>
                  {clubs.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name.split(' - ')[0]} — {getClubManager(c.id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Chọn Người dùng</label>
                <select
                  className="select-field"
                  value={assignManagerId}
                  onChange={e => setAssignManagerId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn người dùng --</option>
                  {eligibleUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.id}) – {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isAssigningExisting}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
              >
                {isAssigningExisting ? <span className="login-spinner" /> : <><UserPlus size={14} /> Gán Quyền &amp; Chỉ Định Leader</>}
              </button>
            </form>
          </div>

          {/* Existing clubs list */}
          <div className="glass-card">
            <div className="glass-card-header">
              <h3 className="glass-card-title"><Landmark size={18} /> CLB hiện có ({clubs.length})</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {clubs.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <img
                    src={c.logo}
                    alt={c.name}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid var(--border)', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '4px', alignItems: 'center' }}>
                      <span className="badge badge-manager" style={{ fontSize: '10px' }}>{c.category}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getClubManager(c.id)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
