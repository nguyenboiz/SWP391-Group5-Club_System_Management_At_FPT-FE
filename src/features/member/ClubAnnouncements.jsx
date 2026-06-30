import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockDb } from '../../utils/mockDb';
import { Bell, Megaphone, PlusSquare, Search, Calendar, User, Clock, AlertTriangle, Send } from 'lucide-react';

export default function ClubAnnouncements({ selectedClubId, triggerNotification, isLeader }) {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [importance, setImportance] = useState('Normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync data from mockDb
  const syncData = useCallback(() => {
    const db = mockDb.getData();
    // Lấy thông tin thông báo:
    // 1. Thông báo hệ thống (không có clubId)
    // 2. Thông báo nội bộ của CLB này (clubId === selectedClubId)
    const list = (db.announcements || []).filter(
      ann => !ann.clubId || String(ann.clubId) === String(selectedClubId)
    );
    
    // Sắp xếp theo ngày mới nhất lên đầu
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setAnnouncements(list);
  }, [selectedClubId]);

  useEffect(() => {
    syncData();
    window.addEventListener('mockDbUpdate', syncData);
    return () => window.removeEventListener('mockDbUpdate', syncData);
  }, [syncData]);

  // Handle post new announcement
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      triggerNotification('Vui lòng nhập đầy đủ tiêu đề và nội dung!', 'warning');
      return;
    }

    setIsSubmitting(true);
    // Giả lập độ trễ mạng
    await new Promise(r => setTimeout(r, 600));

    try {
      const author = currentUser?.fullName || currentUser?.username || 'Trưởng CLB';
      mockDb.addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        importance,
        clubId: selectedClubId,
        authorName: `${author} (Trưởng CLB)`
      });

      triggerNotification('Phát hành thông báo nội bộ CLB thành công!', 'success');
      setTitle('');
      setContent('');
      setImportance('Normal');
    } catch (err) {
      triggerNotification('Đăng thông báo thất bại!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter list
  const filteredList = announcements.filter(ann => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = (ann.title || '').toLowerCase().includes(q);
    const matchesContent = (ann.content || '').toLowerCase().includes(q);
    return matchesTitle || matchesContent;
  });

  return (
    <div className="club-announcements-container">

      {/* ⚠ BE MISSING API BANNER */}
      <div style={{
        marginBottom: '20px', padding: '16px 20px', borderRadius: '10px',
        background: 'rgba(234,179,8,0.08)',
        border: '1.5px solid rgba(234,179,8,0.4)',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <AlertTriangle size={18} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#eab308', fontSize: '13px', marginBottom: '6px' }}>
            ⚠ [BE CẦN BỔ SUNG API] — Thông báo nội bộ CLB đang lưu cục bộ (Local Storage)
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.8' }}>
            Thông báo hệ thống từ Admin đã hiển thị thật. Thông báo nội bộ CLB cần BE bổ sung:
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px' }}>
              <li><code>POST /api/announcements</code> — Phát hành thông báo nội bộ CLB <code>{'{ clubId, title, content, importance }'}</code></li>
              <li><code>GET  /api/announcements?clubId={'{clubId}'}</code> — Lấy danh sách thông báo của CLB</li>
              <li><code>DELETE /api/announcements/{'{id}'}</code> — Xóa thông báo</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 1. Leader-only Announcement Creator */}
      {isLeader && (
        <div className="glass-card" style={{ marginBottom: '28px' }}>
          <div className="glass-card-header">
            <h3 className="glass-card-title">
              <Megaphone size={18} style={{ color: 'var(--primary)' }} /> Phát hành Thông báo CLB
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
            Đăng tin tức, lịch họp hoặc nhắc nhở công việc tới toàn thể thành viên trong câu lạc bộ.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-row">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Tiêu đề thông báo *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nhập tiêu đề ngắn gọn..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Độ quan trọng</label>
                <select
                  className="select-field"
                  value={importance}
                  onChange={e => setImportance(e.target.value)}
                >
                  <option value="Normal">Thường</option>
                  <option value="High">Quan trọng 🚨</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: 600 }}>Nội dung thông báo *</label>
              <textarea
                className="textarea-field"
                placeholder="Nhập nội dung chi tiết gửi tới thành viên..."
                rows={4}
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ minWidth: '160px' }}
              >
                {isSubmitting ? (
                  <span className="login-spinner" />
                ) : (
                  <><Send size={15} /> Đăng thông báo</>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Search & Announcements List */}
      <div className="glass-card">
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="glass-card-title"><Bell size={18} /> Bảng tin Thông báo</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            CLB #{selectedClubId} · {filteredList.length} thông báo
          </span>
        </div>

        <div className="search-filter-row" style={{ marginTop: '16px' }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search className="search-icon" size={18} />
            <input
              type="text"
              className="input-field"
              placeholder="Tìm kiếm thông báo..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <div className="empty-state-view" style={{ padding: '40px 0' }}>
            <Bell className="empty-state-icon" style={{ opacity: 0.3 }} />
            <p>Không có thông báo nào được tìm thấy.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '18px' }}>
            {filteredList.map(ann => {
              const isSystem = !ann.clubId;
              const isHighImportance = ann.importance === 'High' || ann.importance === 'Quan trọng';
              return (
                <div
                  key={ann.id}
                  className="glass-card"
                  style={{
                    padding: '18px',
                    marginBottom: 0,
                    borderLeft: isSystem 
                      ? '4px solid #a855f7' // Purple for System/Admin
                      : isHighImportance 
                      ? '4px solid var(--error)' // Red for High importance
                      : '4px solid var(--primary)', // Orange for normal club
                    background: 'rgba(255, 255, 255, 0.01)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)', margin: 0 }}>
                          {ann.title}
                        </h4>
                        {isSystem ? (
                          <span className="badge badge-admin" style={{ fontSize: '9px' }}>HỆ THỐNG</span>
                        ) : (
                          <span className="badge badge-member" style={{ fontSize: '9px' }}>NỘI BỘ CLB</span>
                        )}
                        {isHighImportance && (
                          <span className="badge badge-blocked" style={{ fontSize: '9px', fontWeight: 700 }}>QUAN TRỌNG</span>
                        )}
                      </div>
                      
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--text-main)',
                        margin: '10px 0',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line'
                      }}>
                        {ann.content}
                      </p>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        marginTop: '12px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                        paddingTop: '8px'
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> {ann.authorName || 'Ban Quản Trị'}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(ann.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
