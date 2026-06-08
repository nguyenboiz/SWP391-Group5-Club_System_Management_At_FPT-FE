import React, { useState } from 'react';
import { mockDb } from '../../utils/mockDb';
import { PlusCircle, Landmark, Image, Link, Tag } from 'lucide-react';

export default function CreateClub({ dbData, triggerNotification }) {
  const { clubs } = dbData;

  const [form, setForm] = useState({
    name: '',
    category: 'Academic',
    logo: '',
    fanpage: '',
    intro: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      triggerNotification('Vui lòng nhập tên câu lạc bộ!', 'warning');
      return;
    }
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 400));
    mockDb.addClub({ ...form });
    triggerNotification(`Đã tạo câu lạc bộ "${form.name}" thành công!`, 'success');
    setForm({ name: '', category: 'Academic', logo: '', fanpage: '', intro: '' });
    setIsSubmitting(false);
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
              {form.logo ? (
                <img
                  src={form.logo}
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
                  value={form.logo}
                  onChange={e => handleChange('logo', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Landmark size={14} /> Tên Câu Lạc Bộ <span style={{ color: 'var(--error)' }}>*</span></label>
              <input
                type="text"
                className="input-field"
                placeholder="Ví dụ: FPT Guitar Club"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Tag size={14} /> Phân loại CLB <span style={{ color: 'var(--error)' }}>*</span></label>
              <select
                className="select-field"
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
              >
                <option value="Academic">Academic (Học thuật)</option>
                <option value="Arts">Arts (Nghệ thuật)</option>
                <option value="Sports">Sports (Thể thao)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label><Link size={14} /> Link Fanpage Facebook</label>
              <input
                type="text"
                className="input-field"
                placeholder="https://facebook.com/club..."
                value={form.fanpage}
                onChange={e => handleChange('fanpage', e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Mô tả / Giới thiệu CLB</label>
              <textarea
                className="textarea-field"
                rows={4}
                placeholder="Giới thiệu ngắn về tôn chỉ hoạt động, mục tiêu của CLB..."
                value={form.intro}
                onChange={e => handleChange('intro', e.target.value)}
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
        </div>

        {/* Right: Existing clubs list */}
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
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <span className="badge badge-manager" style={{ fontSize: '10px' }}>{c.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
