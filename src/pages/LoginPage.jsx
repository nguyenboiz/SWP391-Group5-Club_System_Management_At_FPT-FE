import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { validateNoSpecialChars } from '../utils/validator';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!userId.trim()) {
      newErrors.userId = 'Vui lòng nhập MSSV / Mã cán bộ!';
    } else if (!validateNoSpecialChars(userId)) {
      newErrors.userId = 'Tài khoản không được chứa ký tự lạ!';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu!';
    }

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    setValidationErrors({});
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 600));

    const result = await login(userId.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.role === 'ADMIN') navigate('/admin');
    else if (result.role === 'MANAGER') navigate('/manager');
    else navigate('/select-club');
  };

  return (
    <div className="login-page">
      {/* Background decorations */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-container">
        {/* Left: Branding Panel */}
        <div className="login-brand-panel">
          <div className="login-brand-logo">
            <div className="logo-icon" style={{ width: '64px', height: '64px', fontSize: '28px' }}>F</div>
          </div>
          <h1 className="login-brand-title">FPT Clubs</h1>
          <p className="login-brand-subtitle">MANAGEMENT SYSTEM</p>
          <p className="login-brand-desc">
            Hệ thống quản lý câu lạc bộ Đại học FPT — nơi kết nối đam mê, tổ chức hoạt động và phát triển cộng đồng sinh viên.
          </p>
        </div>

        {/* Right: Login Form */}
        <div className="login-form-panel">
          <div className="login-form-card glass-card">

            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                Đăng nhập
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Dùng MSSV hoặc mã cán bộ để đăng nhập
              </p>
            </div>

             <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  MSSV / Mã cán bộ
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="VD: SE180001, PDP01..."
                  value={userId}
                  onChange={e => {
                    setUserId(e.target.value);
                    setError('');
                    if (validationErrors.userId) setValidationErrors(prev => ({ ...prev, userId: null }));
                  }}
                  autoFocus
                />
                {validationErrors.userId && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{validationErrors.userId}</span>}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Nhập mật khẩu..."
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setError('');
                      if (validationErrors.password) setValidationErrors(prev => ({ ...prev, password: null }));
                    }}
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {validationErrors.password && <span style={{ fontSize: '11px', color: 'var(--error, #ef4444)', marginTop: '4px', display: 'block' }}>{validationErrors.password}</span>}
              </div>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
                style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isLoading ? (
                  <span className="login-spinner" />
                ) : (
                  <><LogIn size={18} /> Đăng nhập</>
                )}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
