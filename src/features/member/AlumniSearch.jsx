import React from 'react';
import { GraduationCap, AlertTriangle } from 'lucide-react';

// NOTE: Chức năng tìm kiếm cựu thành viên (Alumni) chờ BE bổ sung API.
// Yêu cầu BE bổ sung:
//   - GET /api/users?isAlumni=true
//   - GET /api/memberships?userId={id}

export default function AlumniSearch() {
  return (
    <div className="alumni-search-container">
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header">
          <h3 className="glass-card-title"><GraduationCap size={18} /> Mạng lưới Cựu thành viên & Kết nối Thế hệ (Alumni Network)</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tìm kiếm các thế hệ cựu thành viên xuất sắc của các CLB để kết nối học hỏi kinh nghiệm lập nghiệp.
        </p>
      </div>

      <div className="glass-card">
        <div className="empty-state-view">
          <AlertTriangle className="empty-state-icon" style={{ color: 'var(--warning)' }} />
          <p>Chức năng tìm kiếm Cựu thành viên đang chờ BE bổ sung API.</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Yêu cầu BE bổ sung: <code>GET /api/users?isAlumni=true</code>
          </p>
        </div>
      </div>
    </div>
  );
}
