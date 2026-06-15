import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { mockDb } from './utils/mockDb';

import Sidebar from './layouts/Sidebar';
import Header from './layouts/Header';
import Toast from './components/Toast';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ClubSelectorPage from './pages/ClubSelectorPage';

// Admin Pages
import SemesterConfigPage from './pages/admin/SemesterConfigPage';
import EvidenceApprovalPage from './pages/admin/EvidenceApprovalPage';
import ReportAppraisalPage from './pages/admin/ReportAppraisalPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import EventApprovalPage from './pages/admin/EventApprovalPage';
import CreateClubPage from './pages/admin/CreateClubPage';

// Manager Pages
import ClubInfoPage from './pages/manager/ClubInfoPage';
import MemberManagementPage from './pages/manager/MemberManagementPage';
import EventManagerPage from './pages/manager/EventManagerPage';
import DocumentArchivePage from './pages/manager/DocumentArchivePage';
import SubmitReportPage from './pages/manager/SubmitReportPage';
import ReviewMemberReportsPage from './pages/manager/ReviewMemberReportsPage';

// Member Pages
import ClubDirectoryPage from './pages/member/ClubDirectoryPage';
import EventCalendarPage from './pages/member/EventCalendarPage';
import MemberWorkspacePage from './pages/member/MemberWorkspacePage';
import KnowledgeSharingPage from './pages/member/KnowledgeSharingPage';
import MemberSearchPage from './pages/member/MemberSearchPage';
import SubmitMemberReportPage from './pages/member/SubmitMemberReportPage';

import { Bell } from 'lucide-react';

// ─── Shared Dashboard Layout ─────────────────────────────────────────────────
function DashboardLayout({ role, activeTab, setActiveTab, children, triggerNotification, selectedClubId, isLeader = false }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const syncAnn = () => {
      const db = mockDb.getData();
      setAnnouncements(db.announcements || []);
    };
    syncAnn();
    window.addEventListener('mockDbUpdate', syncAnn);
    return () => window.removeEventListener('mockDbUpdate', syncAnn);
  }, []);

  const getPageTitle = () => {
    if (role === 'ADMIN') {
      if (activeTab === 'semester-config') return 'Cài đặt học kỳ';
      if (activeTab === 'create-club') return 'Quản lý CLB';
      if (activeTab === 'report-appraisal') return 'Nhận báo cáo & Thông báo';
      return 'Quản lý người dùng';
    }
    if (role === 'MANAGER') {
      if (activeTab === 'club-info') return 'Thông tin CLB';
      if (activeTab === 'member-management') return 'Quản lý thành viên';
      if (activeTab === 'event-manager') return 'Quản lý sự kiện';
      if (activeTab === 'event-approval') return 'Duyệt sự kiện';
      if (activeTab === 'evidence-approval') return 'Duyệt minh chứng';
      if (activeTab === 'member-reports') return 'Báo cáo thành viên';
      return 'Nộp báo cáo';
    }
    // MEMBER
    if (activeTab === 'club-info') return 'Thông tin CLB';
    if (activeTab === 'document-archive') return 'Tài liệu CLB';
    if (activeTab === 'event-calendar') return 'Lịch trình sự kiện';
    if (activeTab === 'member-workspace') return 'Hoạt động của tôi';
    if (activeTab === 'member-search') return 'Tìm thành viên CLB';
    if (activeTab === 'submit-member-report') return 'Nộp báo cáo cho Leader';
    if (activeTab === 'member-management') return 'Quản lý thành viên (Leader)';
    if (activeTab === 'review-member-reports') return 'Xem báo cáo thành viên';
    return 'Tìm thành viên';
  };

  const handleSwitchClub = () => {
    sessionStorage.removeItem('fpt_selected_club');
    navigate('/select-club');
  };

  return (
    <div className="app-container">
      <Sidebar
        currentRole={role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUserProfile={currentUser}
        isLeader={isLeader}
      />
      <main className="main-viewport">
        <Header
          currentRole={role}
          selectedClubId={selectedClubId}
          dbData={{ clubs: [], memberships: [] }}
          pageTitle={getPageTitle()}
          triggerNotification={triggerNotification}
          onSwitchClub={handleSwitchClub}
        />
        <div className="content-wrapper">
          {/* Announcements alert board from Admin */}
          {(role === 'MANAGER' || role === 'MEMBER') && announcements.length > 0 && (
            <div className="glass-card" style={{ marginBottom: '20px', padding: '16px', background: 'rgba(242,111,33,0.06)', border: '1px solid rgba(242,111,33,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--primary)' }}>
                <Bell size={16} />
                <strong style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bản tin thông báo mới từ PDP Staff</strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {announcements.map(ann => (
                  <div key={ann.id} style={{ fontSize: '13px', borderBottom: '1px dashed var(--border)', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-heading)' }}>{ann.title}: </span>
                    <span style={{ color: 'var(--text-main)' }}>{ann.content}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      ({new Date(ann.createdAt).toLocaleDateString('vi-VN')})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard({ triggerNotification }) {
  const [activeTab, setActiveTab] = useState('semester-config');
  return (
    <DashboardLayout role="ADMIN" activeTab={activeTab} setActiveTab={setActiveTab} triggerNotification={triggerNotification}>
      {activeTab === 'semester-config' && <SemesterConfigPage triggerNotification={triggerNotification} />}
      {activeTab === 'report-appraisal' && <ReportAppraisalPage triggerNotification={triggerNotification} />}
      {activeTab === 'user-management' && <UserManagementPage triggerNotification={triggerNotification} />}
      {activeTab === 'create-club' && <CreateClubPage triggerNotification={triggerNotification} />}
    </DashboardLayout>
  );
}

// ─── Manager Dashboard ────────────────────────────────────────────────────────
function ManagerDashboard({ triggerNotification }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('club-info');

  // Read selected club ID from session (numeric from BE)
  const savedClubId = sessionStorage.getItem('fpt_selected_club');

  // Try to resolve clubId from available clubs list saved after login
  const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
  const availableClubs = availableClubsStr ? JSON.parse(availableClubsStr) : null;

  let resolvedClubId = savedClubId;
  if (!resolvedClubId && availableClubs && availableClubs.length > 0) {
    const managerClub = availableClubs.find(c =>
      (c.role || c.clubRole || '').toUpperCase() === 'MANAGER' ||
      (c.role || c.clubRole || '').toUpperCase() === 'LEADER'
    );
    resolvedClubId = String(managerClub?.clubId || managerClub?.id || '');
    if (resolvedClubId) sessionStorage.setItem('fpt_selected_club', resolvedClubId);
  }
  if (!resolvedClubId && currentUser?.clubId) {
    resolvedClubId = String(currentUser.clubId);
    sessionStorage.setItem('fpt_selected_club', resolvedClubId);
  }

  const [selectedClubId] = useState(resolvedClubId);

  if (!selectedClubId) return <Navigate to="/select-club" replace />;

  // isLeader: manager always has leader privileges over their club
  const isLeader = true;

  return (
    <DashboardLayout
      role="MANAGER"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      triggerNotification={triggerNotification}
      selectedClubId={selectedClubId}
      isLeader={isLeader}
    >
      {activeTab === 'club-info' && <ClubInfoPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
      {activeTab === 'member-management' && <MemberManagementPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
      {activeTab === 'event-manager' && <EventManagerPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
      {activeTab === 'event-approval' && <EventApprovalPage triggerNotification={triggerNotification} selectedClubId={selectedClubId} />}
      {activeTab === 'evidence-approval' && <EvidenceApprovalPage triggerNotification={triggerNotification} selectedClubId={selectedClubId} />}
      {activeTab === 'member-reports' && <ReviewMemberReportsPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
      {activeTab === 'submit-report' && <SubmitReportPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
    </DashboardLayout>
  );
}

// ─── Member Dashboard ─────────────────────────────────────────────────────────
function MemberDashboard({ triggerNotification }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('club-info');

  const savedClubId = sessionStorage.getItem('fpt_selected_club');
  const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
  const availableClubs = availableClubsStr ? JSON.parse(availableClubsStr) : null;

  let resolvedClubId = savedClubId;
  if (!resolvedClubId && availableClubs && availableClubs.length > 0) {
    resolvedClubId = String(availableClubs[0]?.clubId || availableClubs[0]?.id || '');
    if (resolvedClubId) sessionStorage.setItem('fpt_selected_club', resolvedClubId);
  }
  if (!resolvedClubId && currentUser?.clubId) {
    resolvedClubId = String(currentUser.clubId);
    sessionStorage.setItem('fpt_selected_club', resolvedClubId);
  }

  const [selectedClubId] = useState(resolvedClubId);

  if (!selectedClubId) return <Navigate to="/select-club" replace />;

  // Determine isLeader from available clubs
  let isLeader = false;
  if (availableClubs) {
    const myClub = availableClubs.find(c => String(c.clubId || c.id) === String(selectedClubId));
    if (myClub) {
      const role = (myClub.role || myClub.clubRole || '').toUpperCase();
      isLeader = role === 'LEADER' || role === 'MANAGER';
    }
  }
  if (!isLeader && currentUser?.role === 'MANAGER') isLeader = true;

  return (
    <DashboardLayout
      role="MEMBER"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      triggerNotification={triggerNotification}
      selectedClubId={selectedClubId}
      isLeader={isLeader}
    >
      {activeTab === 'club-info' && <ClubInfoPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} readOnly={true} />}
      {activeTab === 'document-archive' && <DocumentArchivePage selectedClubId={selectedClubId} triggerNotification={triggerNotification} readOnly={!isLeader} />}
      {activeTab === 'event-calendar' && <EventCalendarPage currentUserId={currentUser.id} triggerNotification={triggerNotification} selectedClubId={selectedClubId} />}
      {activeTab === 'member-workspace' && <MemberWorkspacePage currentUserId={currentUser.id} triggerNotification={triggerNotification} selectedClubId={selectedClubId} />}
      {activeTab === 'member-search' && <MemberSearchPage currentUserId={currentUser.id} selectedClubId={selectedClubId} />}
      {activeTab === 'submit-member-report' && <SubmitMemberReportPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}

      {/* Leader-only tabs */}
      {isLeader && activeTab === 'member-management' && (
        <MemberManagementPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} />
      )}
      {isLeader && activeTab === 'review-member-reports' && (
        <ReviewMemberReportsPage selectedClubId={selectedClubId} triggerNotification={triggerNotification} />
      )}
    </DashboardLayout>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [toast, setToast] = useState(null);

  const triggerNotification = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/select-club" element={<ClubSelectorPage />} />
        <Route path="/admin/*" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard triggerNotification={triggerNotification} />
          </ProtectedRoute>
        } />
        <Route path="/manager/*" element={
          <ProtectedRoute requiredRole="MANAGER">
            <ManagerDashboard triggerNotification={triggerNotification} />
          </ProtectedRoute>
        } />
        <Route path="/member/*" element={
          <ProtectedRoute requiredRole="MEMBER">
            <MemberDashboard triggerNotification={triggerNotification} />
          </ProtectedRoute>
        } />
        {/* Default: redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {toast && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </>
  );
}
