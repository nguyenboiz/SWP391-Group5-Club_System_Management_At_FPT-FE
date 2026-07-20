import React, { useState, useEffect, useCallback } from 'react';
import { BarChart2, TrendingUp, Users, Award, Calendar, RefreshCw } from 'lucide-react';
import { getClubs, getClubStats } from '../../services/clubService';

export default function Analytics({ triggerNotification }) {
  const [clubsData, setClubsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const clubsRes = await getClubs();
      const list = Array.isArray(clubsRes) ? clubsRes : (clubsRes?.data ?? []);
      
      const detailed = await Promise.all(list.map(async (club) => {
        const cId = club.id || club.clubId;
        try {
          const stats = await getClubStats(cId);
          const statsData = stats?.data ?? stats ?? {};
          return {
            ...club,
            members: statsData.totalMembers ?? statsData.memberCount ?? 0,
            events: statsData.approvedEvents ?? statsData.totalApprovedEvents ?? 0,
            pendingEvents: statsData.pendingEvents ?? statsData.totalPendingEvents ?? 0,
            pendingEvidences: statsData.pendingEvidences ?? statsData.totalPendingEvidences ?? 0,
          };
        } catch (err) {
          console.error(`Error loading stats for ${cId}:`, err);
          return {
            ...club,
            members: 0,
            events: 0
          };
        }
      }));
      
      // Sort by members count descending
      detailed.sort((a, b) => b.members - a.members);
      setClubsData(detailed);
    } catch (err) {
      console.error('[Analytics] Lỗi tải dữ liệu:', err);
      if (triggerNotification) {
        triggerNotification('Không tải được số liệu thống kê phân tích!', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const totalMembers = clubsData.reduce((acc, c) => acc + c.members, 0) || 0;
  const totalEvents = clubsData.reduce((acc, c) => acc + c.events, 0) || 0;
  const topClub = clubsData[0] || null;

  return (
    <div className="analytics-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 12px 0', borderBottom: '1px solid var(--border)' }}>
        <h3 className="glass-card-title"><BarChart2 size={18} /> Phân tích & Thống kê Hệ thống</h3>
        <button className="btn btn-secondary btn-sm" onClick={loadAnalytics} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
        </button>
      </div>

      {loading ? (
        <div className="empty-state-view" style={{ padding: '60px 0' }}>
          <span className="login-spinner" style={{ width: '32px', height: '32px' }} />
          <p style={{ marginTop: '12px' }}>Đang tải phân tích thống kê...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--success)' }}><TrendingUp size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">CLB Quy mô lớn nhất</span>
                <span className="stats-value" style={{ fontSize: '15px' }}>
                  {topClub ? `${topClub.clubName || topClub.name} (${topClub.members} mem)` : 'Chưa có dữ liệu'}
                </span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box" style={{ color: 'var(--primary)' }}><Users size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Tổng Sinh viên CLB</span>
                <span className="stats-value">{totalMembers} sinh viên</span>
              </div>
            </div>
            <div className="stats-card">
              <div className="stats-icon-box"><Calendar size={20} /></div>
              <div className="stats-info">
                <span className="stats-label">Tổng Sự kiện Đã chạy</span>
                <span className="stats-value">{totalEvents} sự kiện</span>
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
                {clubsData.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>Chưa có câu lạc bộ nào.</div>
                ) : (
                  clubsData.slice(0, 5).map(club => {
                    const cName = club.clubName || club.name;
                    const maxEvents = Math.max(...clubsData.map(c => c.events)) || 1;
                    const pct = (club.events / maxEvents) * 100;
                    return (
                      <div key={club.id || club.clubId}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                          <span>{cName}</span>
                          <strong>{club.events} sự kiện</strong>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(pct, 5)}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', borderRadius: '4px' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Side: Top CLB leaderboard */}
            <div className="glass-card">
              <div className="glass-card-header">
                <h3 className="glass-card-title"><Award size={18} /> Bảng xếp hạng Hiệu quả (KPI)</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {clubsData.length === 0 ? (
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>Chưa có câu lạc bộ nào.</div>
                ) : (
                  clubsData.slice(0, 4).map((club, idx) => {
                    const cName = club.clubName || club.name;
                    const score = 100 - idx * 5; // Rank score based on index
                    return (
                      <div key={club.id || club.clubId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? 'gold' : idx === 1 ? 'silver' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx < 2 ? '#111' : 'inherit', fontWeight: 700, fontSize: '12px' }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '13px' }}>{cName}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{club.members} thành viên · {club.events} sự kiện</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '14px' }}>{score} đ</div>
                          <div style={{ fontSize: '10px', color: 'var(--success)' }}>Xếp loại {score >= 90 ? 'A' : 'B'}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
