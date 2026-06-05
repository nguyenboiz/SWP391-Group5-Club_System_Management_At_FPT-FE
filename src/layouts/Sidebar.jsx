import React from 'react';
import { 
  Calendar, FileCheck, ClipboardList, UserCheck, 
  Landmark, BookOpen, GraduationCap, Users, FolderOpen, User
} from 'lucide-react';

export default function Sidebar({ currentRole, activeTab, setActiveTab, currentUserProfile }) {
  // Navigation render helpers
  const renderAdminNav = () => (
    <>
      <div 
        className={`nav-item ${activeTab === 'semester-config' ? 'active' : ''}`}
        onClick={() => setActiveTab('semester-config')}
      >
        <Calendar size={18} />
        <span>Cấu hình Học kỳ</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'evidence-approval' ? 'active' : ''}`}
        onClick={() => setActiveTab('evidence-approval')}
      >
        <FileCheck size={18} />
        <span>Duyệt Minh chứng</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'report-appraisal' ? 'active' : ''}`}
        onClick={() => setActiveTab('report-appraisal')}
      >
        <ClipboardList size={18} />
        <span>Thẩm định Báo cáo</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'user-management' ? 'active' : ''}`}
        onClick={() => setActiveTab('user-management')}
      >
        <UserCheck size={18} />
        <span>Quản lý Tài khoản</span>
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
        className={`nav-item ${activeTab === 'member-management' ? 'active' : ''}`}
        onClick={() => setActiveTab('member-management')}
      >
        <Users size={18} />
        <span>Quản lý Thành viên</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'event-manager' ? 'active' : ''}`}
        onClick={() => setActiveTab('event-manager')}
      >
        <Calendar size={18} />
        <span>Quản lý Sự kiện</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'document-archive' ? 'active' : ''}`}
        onClick={() => setActiveTab('document-archive')}
      >
        <FolderOpen size={18} />
        <span>Kho tài liệu</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'submit-report' ? 'active' : ''}`}
        onClick={() => setActiveTab('submit-report')}
      >
        <ClipboardList size={18} />
        <span>Gửi Báo cáo kỳ</span>
      </div>
    </>
  );

  const renderMemberNav = () => (
    <>
      <div 
        className={`nav-item ${activeTab === 'club-directory' ? 'active' : ''}`}
        onClick={() => setActiveTab('club-directory')}
      >
        <Landmark size={18} />
        <span>Danh sách CLB</span>
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
        className={`nav-item ${activeTab === 'knowledge-sharing' ? 'active' : ''}`}
        onClick={() => setActiveTab('knowledge-sharing')}
      >
        <BookOpen size={18} />
        <span>Chia sẻ Tri thức</span>
      </div>
      <div 
        className={`nav-item ${activeTab === 'alumni-search' ? 'active' : ''}`}
        onClick={() => setActiveTab('alumni-search')}
      >
        <GraduationCap size={18} />
        <span>Tìm cựu thành viên</span>
      </div>
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
