import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockDb } from '../utils/mockDb';
import { LogIn, Eye, EyeOff, ShieldCheck, Users, Landmark } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const allUsers = mockDb.getData().users;
  // Quick-select accounts grouped by role
  const adminUsers = allUsers.filter(u => u.role === 'ADMIN');
  const managerUsers = allUsers.filter(u => u.role === 'MANAGER');
  const memberUsers = allUsers.filter(u => u.role === 'MEMBER' && !u.isAlumni);

  const handleQuickLogin = (id) => {
    setUserId(id);
    setPassword('123456');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 600)); // simulate loading

    const result = login(userId.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    // Redirect based on role
    if (result.role === 'ADMIN') navigate('/admin');
    else if (result.role === 'MANAGER') navigate('/manager');
    else navigate('/member');
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
            Hệ thống Quản lý Câu lạc bộ Đại học FPT — nơi kết nối đam mê, tổ chức hoạt động và phát triển cộng đồng sinh viên.
          </p>

          <div className="login-features">
            <div className="login-feature-item">
              <ShieldCheck size={16} style={{ color: 'var(--primary)' }} />
              <span>Phân quyền đa cấp: Admin · Manager · Member</span>
            </div>
            <div className="login-feature-item">
              <Landmark size={16} style={{ color: 'var(--primary)' }} />
              <span>Quản lý toàn diện hoạt động CLB</span>
            </div>
            <div className="login-feature-item">
              <Users size={16} style={{ color: 'var(--primary)' }} />
              <span>Theo dõi thành viên &amp; sự kiện thời gian thực</span>
            </div>
          </div>
        </div>

        {/* Right: Login Form */}
        <div className="login-form-panel">
          <div className="login-form-card glass-card">
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                Đăng nhập hệ thống
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Dùng MSSV hoặc Mã cán bộ để đăng nhập
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  MSSV / Mã cán bộ
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ví dụ: SE180001, PDP01..."
                  value={userId}
                  onChange={e => { setUserId(e.target.value); setError(''); }}
                  required
                  autoFocus
                />
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
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    required
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

              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
                🔑 Mật khẩu demo cho tất cả tài khoản: <strong style={{ color: 'var(--primary)' }}>123456</strong>
              </p>
            </form>

            {/* Quick login shortcuts */}
            <div className="login-quick-section">
              <div className="login-quick-label">Đăng nhập nhanh để demo:</div>
              <div className="login-quick-groups">
                <div className="login-quick-group">
                  <span className="badge badge-admin" style={{ marginBottom: '8px', display: 'inline-block' }}>ADMIN</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {adminUsers.map(u => (
                      <button key={u.id} className="login-quick-btn" onClick={() => handleQuickLogin(u.id)}>
                        <strong>{u.id}</strong> — {u.fullName.split(' ').slice(-2).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="login-quick-group">
                  <span className="badge badge-manager" style={{ marginBottom: '8px', display: 'inline-block' }}>MANAGER</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {managerUsers.slice(0, 3).map(u => (
                      <button key={u.id} className="login-quick-btn" onClick={() => handleQuickLogin(u.id)}>
                        <strong>{u.id}</strong> — {u.fullName.split(' ').slice(-2).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="login-quick-group">
                  <span className="badge badge-member" style={{ marginBottom: '8px', display: 'inline-block' }}>MEMBER</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {memberUsers.slice(0, 3).map(u => (
                      <button key={u.id} className="login-quick-btn" onClick={() => handleQuickLogin(u.id)}>
                        <strong>{u.id}</strong> — {u.fullName.split(' ').slice(-2).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
