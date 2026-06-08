import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockDb } from '../utils/mockDb';
import { LogIn, Eye, EyeOff, UserPlus, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Tab control
  const [isRegistering, setIsRegistering] = useState(false);

  // Login States
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register States
  const [regId, setRegId] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCohort, setRegCohort] = useState('K21');
  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

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

    // Admin thẳng vào dashboard, còn lại qua trang chọn CLB
    if (result.role === 'ADMIN') navigate('/admin');
    else navigate('/select-club');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');

    const formattedId = regId.trim().toUpperCase();
    const formattedEmail = regEmail.trim().toLowerCase();

    if (!formattedId.startsWith('SE') || formattedId.length < 5) {
      setRegError('Mã số sinh viên (MSSV) không hợp lệ! Ví dụ: SE180001');
      return;
    }

    if (!formattedEmail.endsWith('@fpt.edu.vn') && !formattedEmail.endsWith('@fe.edu.vn')) {
      setRegError('Vui lòng dùng Email Đại học FPT (@fpt.edu.vn hoặc @fe.edu.vn)!');
      return;
    }

    const success = mockDb.registerUser(
      formattedId,
      regFullName.trim(),
      formattedEmail,
      regCohort
    );

    if (!success) {
      setRegError('MSSV này đã được đăng ký trên hệ thống!');
      return;
    }

    setRegSuccessMsg('Đăng ký tài khoản thành công! Mật khẩu mặc định là 123456.');
    setUserId(formattedId);
    setPassword('123456');

    // Switch back to login screen after 1.5s
    setTimeout(() => {
      setIsRegistering(false);
      setRegSuccessMsg('');
      setRegId('');
      setRegFullName('');
      setRegEmail('');
    }, 1500);
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
        </div>

        {/* Right: Login / Register Form Panel */}
        <div className="login-form-panel">
          <div className="login-form-card glass-card">
            
            {!isRegistering ? (
              <>
                {/* LOGIN FORM */}
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

                  <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Chưa có tài khoản sinh viên? </span>
                    <button
                      type="button"
                      onClick={() => { setIsRegistering(true); setError(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      Đăng ký ngay
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                {/* REGISTER FORM */}
                <div style={{ marginBottom: '28px' }}>
                  <button
                    type="button"
                    onClick={() => setIsRegistering(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '12px' }}
                  >
                    <ArrowLeft size={14} /> Quay lại đăng nhập
                  </button>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-heading)', marginBottom: '6px' }}>
                    Đăng ký thành viên mới
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Tạo tài khoản sinh viên để đăng ký tham gia các CLB
                  </p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mã số sinh viên (MSSV)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ví dụ: SE180001"
                      value={regId}
                      onChange={e => { setRegId(e.target.value); setRegError(''); }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Họ và Tên
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={regFullName}
                      onChange={e => { setRegFullName(e.target.value); setRegError(''); }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Email Đại học FPT
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="Ví dụ: anv@fpt.edu.vn"
                      value={regEmail}
                      onChange={e => { setRegEmail(e.target.value); setRegError(''); }}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Khóa học
                    </label>
                    <select
                      className="select-field"
                      value={regCohort}
                      onChange={e => setRegCohort(e.target.value)}
                    >
                      <option value="K17">Khóa K17</option>
                      <option value="K18">Khóa K18</option>
                      <option value="K19">Khóa K19</option>
                      <option value="K20">Khóa K20</option>
                      <option value="K21">Khóa K21</option>
                    </select>
                  </div>

                  {regError && (
                    <div className="login-error">
                      {regError}
                    </div>
                  )}

                  {regSuccessMsg && (
                    <div className="badge badge-active" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', justifyContent: 'center' }}>
                      {regSuccessMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <UserPlus size={18} /> Đăng ký tài khoản
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
