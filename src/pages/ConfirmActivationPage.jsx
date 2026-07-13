import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { confirmActivation } from '../services/membershipService';

/**
 * Trang xác nhận kích hoạt tài khoản thành viên CLB
 * Người dùng sẽ truy cập trang này từ link email:
 *   /confirm-activation?token=xxx
 * 
 * Gọi API: GET /api/member/confirm-activation?token={token}
 */
export default function ConfirmActivationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã kích hoạt (token) trong đường dẫn. Vui lòng kiểm tra lại email.');
      return;
    }

    const activate = async () => {
      try {
        const res = await confirmActivation(token);
        setStatus('success');
        setMessage(res?.message || 'Tài khoản thành viên của bạn đã được kích hoạt thành công!');
      } catch (err) {
        setStatus('error');
        const errMsg = err?.response?.data?.message || err?.message || 'Kích hoạt thất bại. Token có thể đã hết hạn hoặc không hợp lệ.';
        setMessage(errMsg);
      }
    };

    activate();
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-main, #0f0f23)',
      padding: '24px',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'var(--surface, #1a1a2e)',
        border: '1px solid var(--border, #2a2a4a)',
        borderRadius: '16px',
        padding: '40px 32px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        {/* Icon */}
        {status === 'loading' && (
          <div style={{ marginBottom: '20px' }}>
            <Loader size={48} style={{ color: 'var(--primary, #6366f1)', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
        {status === 'success' && (
          <div style={{ marginBottom: '20px' }}>
            <CheckCircle size={56} style={{ color: 'var(--success, #22c55e)' }} />
          </div>
        )}
        {status === 'error' && (
          <div style={{ marginBottom: '20px' }}>
            <XCircle size={56} style={{ color: 'var(--error, #ef4444)' }} />
          </div>
        )}

        {/* Title */}
        <h2 style={{
          fontSize: '22px',
          color: 'var(--text-heading, #fff)',
          marginBottom: '12px',
          fontWeight: 700,
        }}>
          {status === 'loading' && 'Đang xác nhận kích hoạt...'}
          {status === 'success' && 'Kích hoạt thành công! 🎉'}
          {status === 'error' && 'Kích hoạt thất bại'}
        </h2>

        {/* Message */}
        <p style={{
          fontSize: '14px',
          color: 'var(--text-muted, #9ca3af)',
          lineHeight: 1.7,
          marginBottom: '28px',
        }}>
          {status === 'loading'
            ? 'Hệ thống đang xác minh mã kích hoạt của bạn. Vui lòng chờ trong giây lát...'
            : message
          }
        </p>

        {/* Action button */}
        {status !== 'loading' && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 28px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
            }}
          >
            {status === 'success' ? '→ Đăng nhập ngay' : '← Quay về trang Đăng nhập'}
          </button>
        )}

        {/* FPT branding */}
        <div style={{
          marginTop: '32px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border, #2a2a4a)',
          fontSize: '11px',
          color: 'var(--text-muted, #6b7280)',
        }}>
          FPT University — Club System Management
        </div>
      </div>
    </div>
  );
}
