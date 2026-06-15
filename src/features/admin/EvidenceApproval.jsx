import React, { useState } from 'react';
import { Check, X, Eye, FileText, CheckCircle, Image as ImageIcon, AlertCircle, AlertTriangle } from 'lucide-react';

// NOTE: BE chưa có API cho minh chứng (Evidence). Giữ placeholder.
// Yêu cầu BE bổ sung:
//   - GET  /api/evidences?clubId={clubId}&status={status}
//   - PUT  /api/evidences/{id}/approve
//   - PUT  /api/evidences/{id}/reject

export default function EvidenceApproval({ triggerNotification, selectedClubId }) {
  return (
    <div className="evidence-approval-container">
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box"><AlertCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Chờ duyệt</span>
            <span className="stats-value">—</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><CheckCircle size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Đã duyệt</span>
            <span className="stats-value">—</span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <h3 className="glass-card-title"><FileText size={18} /> Duyệt Minh chứng Tham gia</h3>
        </div>
        <div className="empty-state-view">
          <AlertTriangle className="empty-state-icon" style={{ color: 'var(--warning)' }} />
          <p>Chức năng duyệt minh chứng đang chờ BE bổ sung API.</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Yêu cầu BE bổ sung:
            <br /><code>GET /api/evidences?clubId=&#123;clubId&#125;</code>
            <br /><code>PUT /api/evidences/&#123;id&#125;/approve</code>
            <br /><code>PUT /api/evidences/&#123;id&#125;/reject</code>
          </p>
        </div>
      </div>
    </div>
  );
}
