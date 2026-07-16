import React, { useState } from 'react';
import { createClub } from '../../services/clubService';
import { PlusCircle, Landmark, Image, Link, Tag, UserCheck } from 'lucide-react';
import { validateNoSpecialChars } from '../../utils/validator';

export default function CreateClub({ triggerNotification }) {
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
  
  // Validation errors
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.clubName.trim()) {
      newErrors.clubName = 'Vui lòng nhập Tên câu lạc bộ!';
    } else if (form.clubName.trim().length < 3) {
      newErrors.clubName = 'Tên câu lạc bộ phải có ít nhất 3 ký tự!';
    } else if (!validateNoSpecialChars(form.clubName)) {
      newErrors.clubName = 'Tên câu lạc bộ không được chứa ký tự lạ!';
    }

    if (form.clubCode && !/^[A-Z0-9_-]{2,10}$/i.test(form.clubCode.trim())) {
      newErrors.clubCode = 'Mã CLB chỉ gồm chữ, số, gạch dưới, dài 2–10 ký tự!';
    }

    if (form.foundedDate && new Date(form.foundedDate) > new Date()) {
      newErrors.foundedDate = 'Ngày thành lập không thể là ngày trong tương lai!';
    }

    if (form.fanpageUrl && !/^https?:\/\//.test(form.fanpageUrl.trim())) {
      newErrors.fanpageUrl = 'Đường dẫn Fanpage không hợp lệ (phải bắt đầu bằng http:// hoặc https://)!';
    }

    if (form.logoImage && !/^https?:\/\//.test(form.logoImage.trim())) {
      newErrors.logoImage = 'Đường dẫn logo không hợp lệ!';
    }

    if (form.managerStudentId && !/^[a-zA-Z0-9_-]+$/.test(form.managerStudentId.trim())) {
      newErrors.managerStudentId = 'MSSV không được chứa ký tự lạ!';
    }

    if (form.description && !validateNoSpecialChars(form.description)) {
      newErrors.description = 'Mô tả không được chứa ký tự lạ!';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      triggerNotification('❌ Vui lòng sửa các lỗi nhập liệu dưới đây!', 'warning');
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await createClub({
        clubName: form.clubName.trim(),
        clubCode: form.clubCode?.trim() || null,
        description: form.description || null,
        fanpageUrl: form.fanpageUrl?.trim() || null,
        logoImage: form.logoImage || null,
        foundedDate: form.foundedDate || null,
        managerStudentId: form.managerStudentId?.trim() || null,
      });

      const newClubId = result?.clubId || result?.id || result;
      setLastCreated({ name: form.clubName, id: newClubId });
      triggerNotification(`✅ Đã tạo câu lạc bộ "${form.clubName}" thành công!`, 'success');
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
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message || err?.response?.data?.title;
      if (status === 409) triggerNotification('❌ Tên hoặc mã CLB đã tồn tại trong hệ thống!', 'error');
      else if (status === 400) triggerNotification(`❌ Dữ liệu không hợp lệ: ${serverMsg || 'Kiểm tra lại!'}`, 'error');
      else triggerNotification(`❌ Tạo câu lạc bộ thất bại: ${serverMsg || 'Lỗi máy chủ, vui lòng thử lại!'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="club-info-management">
      <div className="dashboard-grid-2col">
        {/* Left: Create Form */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><PlusCircle size={18} /> Tạo Câu lạc bộ mới</h3>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                {errors.logoImage && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.logoImage}</span>}
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
              />
              {errors.clubName && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.clubName}</span>}
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
              {errors.clubCode && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.clubCode}</span>}
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
              {errors.fanpageUrl && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.fanpageUrl}</span>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Ngày thành lập</label>
              <input
                type="date"
                className="input-field"
                value={form.foundedDate}
                onChange={e => handleChange('foundedDate', e.target.value)}
              />
              {errors.foundedDate && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.foundedDate}</span>}
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
              {errors.managerStudentId && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.managerStudentId}</span>}
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                Nhập MSSV của người sẽ được bổ nhiệm làm quản lý CLB.
              </span>
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
              {errors.description && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{errors.description}</span>}
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
              <div style={{
                marginTop: '8px',
                padding: '16px',
                background: 'rgba(34,197,94,0.08)',
                borderRadius: '10px',
                border: '1px solid rgba(34,197,94,0.25)'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '6px' }}>✓ CLB vừa tạo thành công</div>
                <div style={{ fontSize: '14px', color: 'var(--text-heading)' }}>{lastCreated.name}</div>
                {lastCreated.id && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    ID: <strong>{lastCreated.id}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
