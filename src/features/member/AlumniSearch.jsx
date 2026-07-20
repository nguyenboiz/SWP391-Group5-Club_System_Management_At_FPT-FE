import React, { useState, useEffect, useCallback } from 'react';
import { getClubAlumni } from '../../services/clubService';
import { GraduationCap, Search, Mail, Phone, BookOpen, Clock, RefreshCw, User } from 'lucide-react';

export default function AlumniSearch({ selectedClubId }) {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAlumni = useCallback(async () => {
    if (!selectedClubId) return;
    setLoading(true);
    try {
      const data = await getClubAlumni(selectedClubId, searchQuery.trim());
      const list = Array.isArray(data) ? data : (data?.data ?? []);
      setAlumni(list);
    } catch (err) {
      console.error('[AlumniSearch] Lỗi tải cựu thành viên:', err);
      setAlumni([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClubId, searchQuery]);

  // Load when selected club changes or search changes (debounce / on enter / button or immediately on typings)
  useEffect(() => {
    loadAlumni();
  }, [selectedClubId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAlumni();
  };

  if (!selectedClubId) {
    return (
      <div className="glass-card">
        <div className="empty-state-view">
          <GraduationCap className="empty-state-icon" />
          <p>Vui lòng chọn câu lạc bộ để xem danh sách cựu thành viên.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alumni-search-container">
      {/* Header + Search box */}
      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title">
            <GraduationCap size={18} style={{ marginRight: '6px' }} /> 
            Mạng lưới Cựu thành viên & Kết nối Thế hệ (Alumni Network)
          </h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadAlumni}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Tìm kiếm các anh/chị cựu thành viên xuất sắc đã tốt nghiệp hoặc rời CLB để học tập kinh nghiệm.
        </p>

        <form onSubmit={handleSearchSubmit} className="search-input-wrapper" style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search className="search-icon" size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm theo tên, MSSV, ngành học..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Tìm kiếm
          </button>
        </form>
      </div>

      {/* Grid Danh sách cựu thành viên */}
      {loading ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <span className="login-spinner" style={{ width: '28px', height: '28px' }} />
            <p style={{ marginTop: '10px' }}>Đang tải danh sách cựu thành viên...</p>
          </div>
        </div>
      ) : alumni.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state-view">
            <GraduationCap className="empty-state-icon" />
            <p>Không tìm thấy cựu thành viên nào trong CLB này.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {alumni.map(alumnus => (
            <div 
              key={alumnus.membershipId || alumnus.userId} 
              className="glass-card" 
              style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', border: '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-dark, #2b3945)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  {alumnus.avatar ? (
                    <img src={alumnus.avatar} alt={alumnus.fullName} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={22} style={{ color: 'var(--primary, #f97316)' }} />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading, #fff)', marginBottom: '2px' }}>
                    {alumnus.fullName}
                  </h4>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>MSSV: {alumnus.studentId}</span>
                    <span>•</span>
                    <span>{alumnus.academicBatch}</span>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-main, #d1d5db)', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={14} style={{ color: 'var(--primary, #f97316)' }} />
                  <span>Chuyên ngành: <strong>{alumnus.major}</strong></span>
                </div>
                {alumnus.schoolEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} style={{ color: '#3b82f6' }} />
                    <span style={{ wordBreak: 'break-all' }}>
                      Email: <a href={`mailto:${alumnus.schoolEmail}`} style={{ color: 'var(--primary, #f97316)', textDecoration: 'none' }}>{alumnus.schoolEmail}</a>
                    </span>
                  </div>
                )}
                {alumnus.phoneNumber && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} style={{ color: 'var(--success, #22c55e)' }} />
                    <span>SĐT: {alumnus.phoneNumber}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} style={{ color: 'var(--warning, #eab308)' }} />
                  <span>Trạng thái: <span className="badge badge-blocked" style={{ fontSize: '10px', padding: '2px 6px' }}>{alumnus.currentPosition || 'Cựu thành viên'}</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
