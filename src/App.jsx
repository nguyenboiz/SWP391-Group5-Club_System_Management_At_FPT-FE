import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { mockDb } from './utils/mockDb';
import { useAuth } from './contexts/AuthContext';

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

// Member Pages
import ClubDirectoryPage from './pages/member/ClubDirectoryPage';
import EventCalendarPage from './pages/member/EventCalendarPage';
import MemberWorkspacePage from './pages/member/MemberWorkspacePage';
import KnowledgeSharingPage from './pages/member/KnowledgeSharingPage';
import MemberSearchPage from './pages/member/MemberSearchPage';

// Shared Dashboard Layout
function DashboardLayout({ role, activeTab, setActiveTab, children, dbData, triggerNotification, selectedClubId, setSelectedClubId }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const getPageTitle = () => {
    if (role === 'ADMIN') {
      if (activeTab === 'semester-config') return 'Cài đặt học kỳ';
      if (activeTab === 'evidence-approval') return 'Duyệt tham gia';
      if (activeTab === 'create-club') return 'Quản lý CLB';
      if (activeTab === 'report-appraisal') return 'Chấm điểm báo cáo';
      if (activeTab === 'event-approval') return 'Duyệt sự kiện';
      return 'Quản lý người dùng';
    }
    if (role === 'MANAGER') {
      const c = dbData.clubs.find(club => club.id === selectedClubId);
      const cName = c ? c.name.split(' - ')[0] : (selectedClubId || '').toUpperCase();
      if (activeTab === 'club-info') return `Thông tin CLB ${cName}`;
      if (activeTab === 'member-management') return `Thành viên — ${cName}`;
      if (activeTab === 'event-manager') return `Sự kiện — ${cName}`;
      if (activeTab === 'document-archive') return `Tài liệu — ${cName}`;
      return `Nộp báo cáo — ${cName}`;
    }
    // MEMBER
    if (activeTab === 'club-directory') return 'CLB của tôi';
    if (activeTab === 'event-calendar') return 'Sự kiện';
    if (activeTab === 'member-workspace') return 'Hoạt động của tôi';
    if (activeTab === 'knowledge-sharing') return 'Tài nguyên & Đề xuất';
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
      />
      <main className="main-viewport">
        <Header
          currentRole={role}
          selectedClubId={selectedClubId}
          dbData={dbData}
          pageTitle={getPageTitle()}
          triggerNotification={triggerNotification}
          onSwitchClub={handleSwitchClub}
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

  const mapClubIdToMock = (id) => {
    if (id === 1 || id === '1') return 'js';
    if (id === 2 || id === '2') return 'fcode';
    if (id === 3 || id === '3') return 'melody';
    if (id === 4 || id === '4') return 'chess';
    if (id === 5 || id === '5') return 'fsa';
    if (id === 6 || id === '6') return 'dance';
    return id;
  };

  // Read selected club from sessionStorage (set by ClubSelectorPage)
  const savedClubId = sessionStorage.getItem('fpt_selected_club');
  
  // Find all active memberships where the user is a Leader
  let myLeaderMemberships = dbData.memberships.filter(
    m => m.userId === currentUser.id && m.role === 'Leader' && m.status === 'Active'
  );

  const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
  const availableClubs = availableClubsStr ? JSON.parse(availableClubsStr) : null;

  if (myLeaderMemberships.length === 0) {
    if (availableClubs && availableClubs.length > 0) {
      myLeaderMemberships = availableClubs
        .filter(c => (c.role || c.clubRole || '').toUpperCase() === 'MANAGER' || (c.role || c.clubRole || '').toUpperCase() === 'LEADER')
        .map((c, idx) => ({
          id: `dynamic-${mapClubIdToMock(c.clubId || c.id)}-${idx}`,
          userId: currentUser.id,
          clubId: mapClubIdToMock(c.clubId || c.id),
          role: 'Leader',
          status: 'Active'
        }));
    }
    if (myLeaderMemberships.length === 0 && currentUser.clubId) {
      const mockClubId = mapClubIdToMock(currentUser.clubId);
      myLeaderMemberships = [
        {
          id: `dynamic-${mockClubId}`,
          userId: currentUser.id,
          clubId: mockClubId,
          role: 'Leader',
          status: 'Active'
        }
      ];
    }
  }

  const isLeaderOfSaved = myLeaderMemberships.some(m => m.clubId === savedClubId);
  let resolvedClubId = savedClubId;
  if (!savedClubId || !isLeaderOfSaved) {
    resolvedClubId = myLeaderMemberships[0]?.clubId || null;
    if (resolvedClubId) {
      sessionStorage.setItem('fpt_selected_club', resolvedClubId);
    }
  }

  const [selectedClubId] = useState(resolvedClubId);

  if (!selectedClubId) {
    return <Navigate to="/select-club" replace />;
  }

  return (
    <DashboardLayout
      role="MANAGER"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dbData={dbData}
      triggerNotification={triggerNotification}
      selectedClubId={selectedClubId}
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

  const mapClubIdToMock = (id) => {
    if (id === 1 || id === '1') return 'js';
    if (id === 2 || id === '2') return 'fcode';
    if (id === 3 || id === '3') return 'melody';
    if (id === 4 || id === '4') return 'chess';
    if (id === 5 || id === '5') return 'fsa';
    if (id === 6 || id === '6') return 'dance';
    return id;
  };

  // Read selected club from sessionStorage (set by ClubSelectorPage)
  const savedClubId = sessionStorage.getItem('fpt_selected_club');

  // Find all clubs where this user has an active membership
  let myMemberships = dbData.memberships.filter(
    m => m.userId === currentUser.id && m.status === 'Active'
  );

  const availableClubsStr = sessionStorage.getItem('fpt_available_clubs');
  const availableClubs = availableClubsStr ? JSON.parse(availableClubsStr) : null;

  if (myMemberships.length === 0) {
    if (availableClubs && availableClubs.length > 0) {
      myMemberships = availableClubs.map((c, idx) => ({
        id: `dynamic-${mapClubIdToMock(c.clubId || c.id)}-${idx}`,
        userId: currentUser.id,
        clubId: mapClubIdToMock(c.clubId || c.id),
        role: (c.role || c.clubRole || '').toUpperCase() === 'MANAGER' || (c.role || c.clubRole || '').toUpperCase() === 'LEADER' ? 'Leader' : 'Member',
        status: 'Active'
      }));
    } else if (currentUser.clubId) {
      const mockClubId = mapClubIdToMock(currentUser.clubId);
      myMemberships = [
        {
          id: `dynamic-${mockClubId}`,
          userId: currentUser.id,
          clubId: mockClubId,
          role: currentUser.role === 'MANAGER' ? 'Leader' : 'Member',
          status: 'Active'
        }
      ];
    }
  }

  const isMemberOfSaved = myMemberships.some(m => m.clubId === savedClubId);
  let resolvedClubId = savedClubId;
  if (!savedClubId || !isMemberOfSaved) {
    resolvedClubId = myMemberships[0]?.clubId || null;
    if (resolvedClubId) {
      sessionStorage.setItem('fpt_selected_club', resolvedClubId);
    }
  }

  const [selectedClubId] = useState(resolvedClubId);

  if (!selectedClubId) {
    return <Navigate to="/select-club" replace />;
  }

  return (
    <DashboardLayout
      role="MEMBER"
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      dbData={dbData}
      triggerNotification={triggerNotification}
      selectedClubId={selectedClubId}
    >
      {activeTab === 'club-directory' && <ClubDirectoryPage dbData={dbData} currentUserId={currentUser.id} selectedClubId={selectedClubId} />}
      {activeTab === 'event-calendar' && <EventCalendarPage dbData={dbData} currentUserId={currentUser.id} triggerNotification={triggerNotification} selectedClubId={selectedClubId} />}
      {activeTab === 'member-workspace' && <MemberWorkspacePage dbData={dbData} currentUserId={currentUser.id} triggerNotification={triggerNotification} selectedClubId={selectedClubId} />}
      {activeTab === 'knowledge-sharing' && <KnowledgeSharingPage dbData={dbData} triggerNotification={triggerNotification} selectedClubId={selectedClubId} />}
      {activeTab === 'member-search' && <MemberSearchPage dbData={dbData} currentUserId={currentUser.id} selectedClubId={selectedClubId} />}
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
