import React from 'react';
import { 
  LayoutDashboard, Calendar, FileCheck, ClipboardList, UserCheck, 
  Landmark, BookOpen, Users, FolderOpen, User,
  CheckSquare, PlusSquare, Search, Send, FileText, Bell,
  Crown, BarChart2, Eye, TrendingUp, GraduationCap
} from 'lucide-react';

export default function Sidebar({ currentRole, activeTab, setActiveTab, currentUserProfile, isLeader = false }) {
  const renderAdminNav = () => (
    <>
      <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </div>
      <div className={`nav-item ${activeTab === 'user-management' ? 'active' : ''}`} onClick={() => setActiveTab('user-management')}>
        <UserCheck size={18} />
        <span>Quản lý Người dùng</span>
      </div>
      <div className={`nav-item ${activeTab === 'club-management' ? 'active' : ''}`} onClick={() => setActiveTab('club-management')}>
        <Landmark size={18} />
        <span>Quản lý CLB</span>
      </div>
      <div className={`nav-item ${activeTab === 'semester-config' ? 'active' : ''}`} onClick={() => setActiveTab('semester-config')}>
        <Calendar size={18} />
        <span>Quản lý Học kỳ</span>
      </div>
      <div className={`nav-item ${activeTab === 'report-appraisal' ? 'active' : ''}`} onClick={() => setActiveTab('report-appraisal')}>
        <ClipboardList size={18} />
        <span>Report Review</span>
      </div>
      <div className={`nav-item ${activeTab === 'evidence-review' ? 'active' : ''}`} onClick={() => setActiveTab('evidence-review')}>
        <FileCheck size={18} />
        <span>Kiểm tra Chứng nhận</span>
      </div>
      <div className={`nav-item ${activeTab === 'notification-management' ? 'active' : ''}`} onClick={() => setActiveTab('notification-management')}>
        <Bell size={18} />
        <span>Gửi Thông báo</span>
      </div>
    </>
  );

  const renderManagerNav = () => (
    <>
      <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </div>
      <div className={`nav-item ${activeTab === 'event-approval' ? 'active' : ''}`} onClick={() => setActiveTab('event-approval')}>
        <CheckSquare size={18} />
        <span>Duyệt Sự kiện</span>
      </div>
      <div className={`nav-item ${activeTab === 'event-monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('event-monitoring')}>
        <Eye size={18} />
        <span>Theo dõi Sự kiện</span>
      </div>
      <div className={`nav-item ${activeTab === 'evidence-review' ? 'active' : ''}`} onClick={() => setActiveTab('evidence-review')}>
        <FileCheck size={18} />
        <span>Kiểm tra Chứng nhận</span>
      </div>
      <div className={`nav-item ${activeTab === 'club-report-review' ? 'active' : ''}`} onClick={() => setActiveTab('club-report-review')}>
        <FileText size={18} />
        <span>Kiểm tra Báo cáo CLB</span>
      </div>
      <div className={`nav-item ${activeTab === 'notification-management' ? 'active' : ''}`} onClick={() => setActiveTab('notification-management')}>
        <Bell size={18} />
        <span>Thông báo CLB</span>
      </div>
    </>
  );

  const renderMemberNav = () => (
    <>
      <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </div>
      <div className={`nav-item ${activeTab === 'club-info' ? 'active' : ''}`} onClick={() => setActiveTab('club-info')}>
        <Landmark size={18} />
        <span>Thông tin CLB</span>
      </div>
      <div className={`nav-item ${activeTab === 'document-archive' ? 'active' : ''}`} onClick={() => setActiveTab('document-archive')}>
        <FolderOpen size={18} />
        <span>Tài liệu CLB</span>
      </div>
      <div className={`nav-item ${activeTab === 'member-search' ? 'active' : ''}`} onClick={() => setActiveTab('member-search')}>
        <Search size={18} />
        <span>Thành viên CLB</span>
      </div>
      <div className={`nav-item ${activeTab === 'alumni-search' ? 'active' : ''}`} onClick={() => setActiveTab('alumni-search')}>
        <GraduationCap size={18} />
        <span>Cựu thành viên</span>
      </div>
      <div className={`nav-item ${activeTab === 'event-calendar' ? 'active' : ''}`} onClick={() => setActiveTab('event-calendar')}>
        <Calendar size={18} />
        <span>Sự kiện</span>
      </div>
      <div className={`nav-item ${activeTab === 'member-workspace' ? 'active' : ''}`} onClick={() => setActiveTab('member-workspace')}>
        <User size={18} />
        <span>Nộp minh chứng</span>
      </div>
      <div className={`nav-item ${activeTab === 'club-announcements' ? 'active' : ''}`} onClick={() => setActiveTab('club-announcements')}>
        <Bell size={18} />
        <span>Thông báo CLB</span>
      </div>

      {/* Leader-only section */}
      {isLeader && (
        <>
          <div style={{ padding: '10px 14px 4px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '8px', borderTop: '1px solid var(--border)' }}>
            Quyền hạn Trưởng CLB
          </div>
          <div className={`nav-item ${activeTab === 'member-management' ? 'active' : ''}`} onClick={() => setActiveTab('member-management')}>
            <Users size={18} />
            <span>Quản lý Thành viên</span>
          </div>
          <div className={`nav-item ${activeTab === 'event-manager' ? 'active' : ''}`} onClick={() => setActiveTab('event-manager')}>
            <PlusSquare size={18} />
            <span>Quản lý Sự kiện</span>
          </div>
          <div className={`nav-item ${activeTab === 'evidence-review' ? 'active' : ''}`} onClick={() => setActiveTab('evidence-review')}>
            <FileCheck size={18} />
            <span>Kiểm tra Chứng nhận</span>
          </div>
          <div className={`nav-item ${activeTab === 'club-report' ? 'active' : ''}`} onClick={() => setActiveTab('club-report')}>
            <ClipboardList size={18} />
            <span>Báo cáo Hoạt động</span>
          </div>
        </>
      )}
    </>
  );

  const getRoleLabel = () => {
    if (currentRole === 'ADMIN') return 'Quản trị viên';
    if (currentRole === 'MANAGER') return 'Quản lý hệ thống';
    return isLeader ? 'Trưởng CLB' : 'Thành viên';
  };

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
          <div 
            className={`user-sidebar-card ${activeTab === 'my-profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-profile')}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-avatar-initial">
              {currentUserProfile.fullName?.charAt(0) || '?'}
            </div>
            <div className="user-sidebar-info">
              <span className="user-sidebar-name">{currentUserProfile.fullName}</span>
              <span className="user-sidebar-role">
                {getRoleLabel()}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
