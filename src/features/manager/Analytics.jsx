import React from 'react';
import { BarChart2, TrendingUp, Users, Award, Calendar, ChevronRight } from 'lucide-react';

export default function Analytics({ triggerNotification }) {
  // Mock performance metrics
  const topClubs = [
    { name: 'JS Club - Japanese SE', score: 92, status: 'Active', members: 45, events: 3 },
    { name: 'Melody Club - Music & Arts', score: 90, status: 'Active', members: 32, events: 2 },
    { name: 'F-Code Club', score: 88, status: 'Active', members: 28, events: 1 },
    { name: 'FPT Chess Club', score: 83, status: 'Active', members: 36, events: 2 },
  ];

  return (
    <div className="analytics-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Cards */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--success)' }}><TrendingUp size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">CLB Xuất sắc nhất</span>
            <span className="stats-value">JS Club (92/100)</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box" style={{ color: 'var(--primary)' }}><Users size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tổng Sinh viên CLB</span>
            <span className="stats-value">208 sinh viên</span>
          </div>
        </div>
        <div className="stats-card">
          <div className="stats-icon-box"><Calendar size={20} /></div>
          <div className="stats-info">
            <span className="stats-label">Tổng Sự kiện Học kỳ</span>
            <span className="stats-value">12 sự kiện</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-2col" style={{ gap: '24px' }}>
        {/* Left Side: Charts simulation using premium CSS/SVG bar layouts */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><BarChart2 size={18} /> Số sự kiện đã chạy theo CLB</h3>
          </div>
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Bar 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>JS Club</span>
                <strong>3 sự kiện</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '4px' }} />
              </div>
            </div>
            {/* Bar 2 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>Melody Club</span>
                <strong>2 sự kiện</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '4px' }} />
              </div>
            </div>
            {/* Bar 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>F-Code Club</span>
                <strong>1 sự kiện</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '25%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '4px' }} />
              </div>
            </div>
            {/* Bar 4 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span>FPT Chess Club</span>
                <strong>2 sự kiện</strong>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Top CLB leaderboard */}
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title"><Award size={18} /> Bảng xếp hạng Hiệu quả (KPI)</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {topClubs.map((club, idx) => (
              <div key={club.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx < 2 ? '#111' : 'inherit', fontWeight: 700, fontSize: '12px' }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{club.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{club.members} thành viên · {club.events} sự kiện</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px' }}>{club.score} đ</div>
                  <div style={{ fontSize: '10px', color: 'var(--success)' }}>Xếp loại A</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
