import React from 'react';
import { ShieldAlert } from 'lucide-react';

// Admin Pages
import SemesterConfigPage from '../pages/admin/SemesterConfigPage';
import EvidenceApprovalPage from '../pages/admin/EvidenceApprovalPage';
import ReportAppraisalPage from '../pages/admin/ReportAppraisalPage';
import UserManagementPage from '../pages/admin/UserManagementPage';

// Manager Pages
import ClubInfoPage from '../pages/manager/ClubInfoPage';
import MemberManagementPage from '../pages/manager/MemberManagementPage';
import EventManagerPage from '../pages/manager/EventManagerPage';
import DocumentArchivePage from '../pages/manager/DocumentArchivePage';
import SubmitReportPage from '../pages/manager/SubmitReportPage';

// Member Pages
import ClubDirectoryPage from '../pages/member/ClubDirectoryPage';
import EventCalendarPage from '../pages/member/EventCalendarPage';
import MemberWorkspacePage from '../pages/member/MemberWorkspacePage';
import KnowledgeSharingPage from '../pages/member/KnowledgeSharingPage';
import AlumniSearchPage from '../pages/member/AlumniSearchPage';

export default function AppRoutes({
  currentRole,
  activeTab,
  dbData,
  currentUserId,
  selectedClubId,
  currentUserProfile,
  triggerNotification
}) {
  // Check if account is blocked in the DB before rendering
  if (currentUserProfile?.status === 'Blocked') {
    return (
      <div className="glass-card" style={{ marginTop: '40px', padding: '40px', textAlign: 'center' }}>
        <ShieldAlert size={60} style={{ color: 'var(--error)', marginBottom: '16px' }} />
        <h2>TÀI KHOẢN CỦA BẠN ĐÃ BỊ KHÓA</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
          Hệ thống quản lý ghi nhận tài khoản này đang ở trạng thái bị khóa. Vui lòng liên hệ phòng PDP để được mở lại.
        </p>
      </div>
    );
  }

  switch (currentRole) {
    case 'ADMIN':
      switch (activeTab) {
        case 'semester-config':
          return <SemesterConfigPage dbData={dbData} triggerNotification={triggerNotification} />;
        case 'evidence-approval':
          return <EvidenceApprovalPage dbData={dbData} triggerNotification={triggerNotification} />;
        case 'report-appraisal':
          return <ReportAppraisalPage dbData={dbData} triggerNotification={triggerNotification} />;
        case 'user-management':
          return <UserManagementPage dbData={dbData} triggerNotification={triggerNotification} />;
        default:
          return <SemesterConfigPage dbData={dbData} triggerNotification={triggerNotification} />;
      }
      
    case 'MANAGER':
      switch (activeTab) {
        case 'club-info':
          return <ClubInfoPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />;
        case 'member-management':
          return <MemberManagementPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />;
        case 'event-manager':
          return <EventManagerPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />;
        case 'document-archive':
          return <DocumentArchivePage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />;
        case 'submit-report':
          return <SubmitReportPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />;
        default:
          return <ClubInfoPage dbData={dbData} selectedClubId={selectedClubId} triggerNotification={triggerNotification} />;
      }
      
    case 'MEMBER':
      switch (activeTab) {
        case 'club-directory':
          return <ClubDirectoryPage dbData={dbData} />;
        case 'event-calendar':
          return <EventCalendarPage dbData={dbData} currentUserId={currentUserId} triggerNotification={triggerNotification} />;
        case 'member-workspace':
          return <MemberWorkspacePage dbData={dbData} currentUserId={currentUserId} triggerNotification={triggerNotification} />;
        case 'knowledge-sharing':
          return <KnowledgeSharingPage dbData={dbData} triggerNotification={triggerNotification} />;
        case 'alumni-search':
          return <AlumniSearchPage dbData={dbData} />;
        default:
          return <ClubDirectoryPage dbData={dbData} />;
      }
      
    default:
      return <div>Page Not Found</div>;
  }
}
