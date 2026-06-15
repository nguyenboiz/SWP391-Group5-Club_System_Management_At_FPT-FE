import React from 'react';
import { 
  Calendar, FileCheck, ClipboardList, UserCheck, 
  Landmark, BookOpen, Users, FolderOpen, User,
  CheckSquare, PlusSquare, Search, Send, FileText, Bell
} from 'lucide-react';

export default function Sidebar({ currentRole, activeTab, setActiveTab, currentUserProfile, isLeader = false }) {
  const renderAdminNav = () => (
    <>
      <div 
        className={`nav-item ${activeTab === 'semester-config' ? 'active' : ''}`}
        onClick={() => setActiveTab('semester-config')}
      >
        <Calendar size={18} />
        <span>Cài đặt Kỳ học</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'report-appraisal' ? 'active' : ''}`}
        onClick={() => setActiveTab('report-appraisal')}
      >
        <ClipboardList size={18} />
        <span>Nhận báo cáo & Thông báo</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'user-management' ? 'active' : ''}`}
        onClick={() => setActiveTab('user-management')}
      >
        <UserCheck size={18} />
        <span>Quản lý Người dùng</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'create-club' ? 'active' : ''}`}
        onClick={() => setActiveTab('create-club')}
      >
        <PlusSquare size={18} />
        <span>Quản lý CLB</span>
      </div>
    </>
  );

  const renderManagerNav = () => (
    <>
      <div 
        className={`nav-item ${activeTab === 'club-info' ? 'active' : ''}`}
        onClick={() => setActiveTab('club-info')}
      >
        <Landmark size={18} />
        <span>Thông tin CLB</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'event-manager' ? 'active' : ''}`}
        onClick={() => setActiveTab('event-manager')}
      >
        <Calendar size={18} />
        <span>Quản lý Sự kiện</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'event-approval' ? 'active' : ''}`}
        onClick={() => setActiveTab('event-approval')}
      >
        <CheckSquare size={18} />
        <span>Duyệt Sự kiện</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'evidence-approval' ? 'active' : ''}`}
        onClick={() => setActiveTab('evidence-approval')}
      >
        <FileCheck size={18} />
        <span>Duyệt Minh chứng</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'member-management' ? 'active' : ''}`}
        onClick={() => setActiveTab('member-management')}
      >
        <Users size={18} />
        <span>Quản lý Thành viên</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'member-reports' ? 'active' : ''}`}
        onClick={() => setActiveTab('member-reports')}
      >
        <FileText size={18} />
        <span>Báo cáo Thành viên</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'submit-report' ? 'active' : ''}`}
        onClick={() => setActiveTab('submit-report')}
      >
        <Send size={18} />
        <span>Nộp Báo cáo</span>
      </div>
    </>
  );

  const renderMemberNav = () => (
    <>
      <div 
        className={`nav-item ${activeTab === 'club-info' ? 'active' : ''}`}
        onClick={() => setActiveTab('club-info')}
      >
        <Landmark size={18} />
        <span>Thông tin CLB</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'document-archive' ? 'active' : ''}`}
        onClick={() => setActiveTab('document-archive')}
      >
        <FolderOpen size={18} />
        <span>Tài liệu CLB</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'event-calendar' ? 'active' : ''}`}
        onClick={() => setActiveTab('event-calendar')}
      >
        <Calendar size={18} />
        <span>Danh sách Sự kiện</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'member-workspace' ? 'active' : ''}`}
        onClick={() => setActiveTab('member-workspace')}
      >
        <User size={18} />
        <span>Hoạt động của tôi</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'member-search' ? 'active' : ''}`}
        onClick={() => setActiveTab('member-search')}
      >
        <Search size={18} />
        <span>Tìm thành viên CLB</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'submit-member-report' ? 'active' : ''}`}
        onClick={() => setActiveTab('submit-member-report')}
      >
        <Send size={18} />
        <span>Nộp báo cáo cho Leader</span>
      </div>
      
      {/* Conditionally render Leader-only navigation tabs in Member dashboard */}
      {isLeader && (
        <>
          <div style={{ padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quyền hạn Trưởng CLB
          </div>
          <div 
            className={`nav-item ${activeTab === 'member-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('member-management')}
          >
            <Users size={18} />
            <span>Quản lý Thành viên (Leader)</span>
          </div>
          <div 
            className={`nav-item ${activeTab === 'review-member-reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('review-member-reports')}
          >
            <FileText size={18} />
            <span>Xem báo cáo Thành viên</span>
          </div>
        </>
      )}
    </>
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo-section">
        <div className="logo-icon">F</div>
        <div className="logo-text">
          <span className="logo-title">FPT Clubs</span>
          <span className="logo-subtitle">MANAGEMENT</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {currentRole === 'ADMIN' && renderAdminNav()}
        {currentRole === 'MANAGER' && renderManagerNav()}
        {currentRole === 'MEMBER' && renderMemberNav()}
      </nav>

      <div className="sidebar-footer">
        {currentUserProfile && (
          <div className="user-sidebar-card">
            <div className="user-avatar-initial">
              {currentUserProfile.fullName.charAt(0)}
            </div>
            <div className="user-sidebar-info">
              <span className="user-sidebar-name">{currentUserProfile.fullName}</span>
              <span className="user-sidebar-role">
                {currentRole === 'ADMIN' ? 'PDP Staff' : currentRole === 'MANAGER' ? 'Club Board' : 'Student'} ({currentUserProfile.id})
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
