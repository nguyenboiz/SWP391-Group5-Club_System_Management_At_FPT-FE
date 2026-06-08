import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { mockDb } from './utils/mockDb';
import { useAuth } from './contexts/AuthContext';

import Sidebar from './layouts/Sidebar';
import Header from './layouts/Header';
import Toast from './components/Toast';
import ProtectedRoute from './routes/ProtectedRoute';
import LoginPage from './pages/LoginPage';

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

// Member Pages
import ClubDirectoryPage from './pages/member/ClubDirectoryPage';
import EventCalendarPage from './pages/member/EventCalendarPage';
import MemberWorkspacePage from './pages/member/MemberWorkspacePage';
import KnowledgeSharingPage from './pages/member/KnowledgeSharingPage';
import MemberSearchPage from './pages/member/MemberSearchPage';

// Shared Dashboard Layout
function DashboardLayout({ role, activeTab, setActiveTab, children, dbData, triggerNotification, selectedClubId, setSelectedClubId }) {
  const { currentUser } = useAuth();

  const getPageTitle = () => {
    if (role === 'ADMIN') {
      if (activeTab === 'semester-config') return 'Cấu hình Thời gian học kỳ & Báo cáo';
      if (activeTab === 'evidence-approval') return 'Phê duyệt Minh chứng Sinh viên';
      if (activeTab === 'report-appraisal') return 'Thẩm định Báo cáo & Lời phê';
      if (activeTab === 'event-approval') return 'Duyệt Sự kiện CLB';
      if (activeTab === 'create-club') return 'Tạo Câu lạc bộ mới';
      return 'Quản trị Tài khoản người dùng';
    }
    if (role === 'MANAGER') {
      const c = dbData.clubs.find(club => club.id === selectedClubId);
      const cName = c ? c.name.split(' - ')[0] : (selectedClubId || '').toUpperCase();
      if (activeTab === 'club-info') return `Thông tin CLB ${cName}`;
      if (activeTab === 'member-management') return `Quản lý Thành viên CLB ${cName}`;
      if (activeTab === 'event-manager') return `Quản lý Sự kiện CLB ${cName}`;
      if (activeTab === 'document-archive') return `Kho tài liệu CLB ${cName}`;
      return `Báo cáo hoạt động CLB ${cName}`;
    }
    // MEMBER
    if (activeTab === 'club-directory') return 'CLB của tôi';
    if (activeTab === 'event-calendar') return 'Đăng ký Tham gia Sự kiện';
    if (activeTab === 'member-workspace') return 'Không gian cá nhân & Minh chứng';
    if (activeTab === 'knowledge-sharing') return 'Chia sẻ Tài nguyên & Proposal mẫu';
    return 'Tìm thành viên CLB';
  };

  return (
    <div className="app-container">
      <Sidebar
        currentRole={role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUserProfile={currentUser}
      />
      <main className="main-viewport">
        <Header
          currentRole={role}
          selectedClubId={selectedClubId}
          setSelectedClubId={setSelectedClubId}
          dbData={dbData}
          pageTitle={getPageTitle()}
          triggerNotification={triggerNotification}
        />
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard({ dbData, triggerNotification }) {
  const [activeTab, setActiveTab] = useState('semester-config');
  return (
    <DashboardLayout role="ADMIN" activeTab={activeTab} setActiveTab={setActiveTab} dbData={dbData} triggerNotification={triggerNotification}>
      {activeTab === 'semester-config' && <SemesterConfigPage dbData={dbData} triggerNotification={triggerNotification} />}
      {activeTab === 'evidence-approval' && <EvidenceApprovalPage dbData={dbData} triggerNotification={triggerNotification} />}
      {activeTab === 'report-appraisal' && <ReportAppraisalPage dbData={dbData} triggerNotification={triggerNotification} />}
      {activeTab === 'user-management' && <UserManagementPage dbData={dbData} triggerNotification={triggerNotification} />}
      {activeTab === 'event-approval' && <EventApprovalPage dbData={dbData} triggerNotification={triggerNotification} />}
      {activeTab === 'create-club' && <CreateClubPage dbData={dbData} triggerNotification={triggerNotification} />}
    </DashboardLayout>
  );
}

// Manager Dashboard
function ManagerDashboard({ dbData, triggerNotification }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('club-info');

  // Find which club this manager manages
  const managerMembership = dbData.memberships.find(
    m => m.userId === currentUser.id && m.role === 'Leader' && m.status === 'Active'
  );
  const [selectedClubId, setSelectedClubId] = useState(managerMembership?.clubId || dbData.clubs[0]?.id);

  return (
    <DashboardLayout
      role="MANAGER"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dbData={dbData}
      triggerNotification={triggerNotification}
      selectedClubId={selectedClubId}
      setSelectedClubId={setSelectedClubId}
    >
      {activeTab === 'club-info' && <ClubInfoPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
      {activeTab === 'member-management' && <MemberManagementPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
      {activeTab === 'event-manager' && <EventManagerPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
      {activeTab === 'document-archive' && <DocumentArchivePage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
      {activeTab === 'submit-report' && <SubmitReportPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />}
    </DashboardLayout>
  );
}

// Member Dashboard
function MemberDashboard({ dbData, triggerNotification }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('club-directory');

  return (
    <DashboardLayout role="MEMBER" activeTab={activeTab} setActiveTab={setActiveTab} dbData={dbData} triggerNotification={triggerNotification}>
      {activeTab === 'club-directory' && <ClubDirectoryPage dbData={dbData} currentUserId={currentUser.id} />}
      {activeTab === 'event-calendar' && <EventCalendarPage dbData={dbData} currentUserId={currentUser.id} triggerNotification={triggerNotification} />}
      {activeTab === 'member-workspace' && <MemberWorkspacePage dbData={dbData} currentUserId={currentUser.id} triggerNotification={triggerNotification} />}
      {activeTab === 'knowledge-sharing' && <KnowledgeSharingPage dbData={dbData} triggerNotification={triggerNotification} />}
      {activeTab === 'member-search' && <MemberSearchPage dbData={dbData} currentUserId={currentUser.id} />}
    </DashboardLayout>
  );
}

export default function App() {
  const [dbData, setDbData] = useState(mockDb.getData());
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleUpdate = () => setDbData(mockDb.getData());
    window.addEventListener('mockDbUpdate', handleUpdate);
    return () => window.removeEventListener('mockDbUpdate', handleUpdate);
  }, []);

  const triggerNotification = (message, type = 'success') => {
    setToast({ message, type });
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/*" element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard dbData={dbData} triggerNotification={triggerNotification} />
          </ProtectedRoute>
        } />
        <Route path="/manager/*" element={
          <ProtectedRoute requiredRole="MANAGER">
            <ManagerDashboard dbData={dbData} triggerNotification={triggerNotification} />
          </ProtectedRoute>
        } />
        <Route path="/member/*" element={
          <ProtectedRoute requiredRole="MEMBER">
            <MemberDashboard dbData={dbData} triggerNotification={triggerNotification} />
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
