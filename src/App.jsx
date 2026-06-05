import React, { useState, useEffect } from 'react';
import { mockDb } from './utils/mockDb';
import Sidebar from './layouts/Sidebar';
import Header from './layouts/Header';
import AppRoutes from './routes/AppRoutes';
import Toast from './components/Toast';

export default function App() {
  // DB Sync State
  const [dbData, setDbData] = useState(mockDb.getData());
  
  // Navigation States
  const [currentRole, setCurrentRole] = useState('ADMIN'); // ADMIN, MANAGER, MEMBER
  const [adminTab, setAdminTab] = useState('semester-config');
  const [managerTab, setManagerTab] = useState('club-info');
  const [memberTab, setMemberTab] = useState('club-directory');

  // Emulator Configs
  const [selectedClubId, setSelectedClubId] = useState('js'); // for manager role
  const [currentUserId, setCurrentUserId] = useState('SE180001'); // for member role

  // Toast Notification state
  const [toast, setToast] = useState(null);

  // Sync DB when other components trigger saves
  useEffect(() => {
    const handleUpdate = () => {
      setDbData(mockDb.getData());
    };
    window.addEventListener('mockDbUpdate', handleUpdate);
    return () => window.removeEventListener('mockDbUpdate', handleUpdate);
  }, []);

  const triggerNotification = (message, type = 'success') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Switch Active role resets or redirects
  const handleRoleSwitch = (newRole) => {
    setCurrentRole(newRole);
    triggerNotification(`Đã chuyển đổi sang vai trò: ${
      newRole === 'ADMIN' ? 'ADMIN (PDP Staff)' : newRole === 'MANAGER' ? 'MANAGER (Club Board)' : 'MEMBER (Sinh viên)'
    }`, 'info');
  };

  // Find user profile details for header displays
  const getLoggedInUser = () => {
    if (currentRole === 'ADMIN') {
      return dbData.users.find(u => u.id === 'PDP01');
    } else if (currentRole === 'MANAGER') {
      // Find the leader of the selected club to simulate login
      const clubBoardSU26 = dbData.clubBoards.find(b => b.clubId === selectedClubId);
      if (clubBoardSU26) {
        const pres = dbData.boardMembers.find(bm => bm.boardId === clubBoardSU26.id && bm.position === 'President');
        if (pres) return dbData.users.find(u => u.id === pres.userId);
      }
      // fallback to default manager
      return dbData.users.find(u => u.id === 'SE170111');
    } else {
      return dbData.users.find(u => u.id === currentUserId);
    }
  };

  const currentUserProfile = getLoggedInUser();

  const getActiveTab = () => {
    if (currentRole === 'ADMIN') return adminTab;
    if (currentRole === 'MANAGER') return managerTab;
    return memberTab;
  };

  const setActiveTab = (newTab) => {
    if (currentRole === 'ADMIN') setAdminTab(newTab);
    else if (currentRole === 'MANAGER') setManagerTab(newTab);
    else setMemberTab(newTab);
  };

  const getPageTitle = () => {
    const activeTab = getActiveTab();
    if (currentRole === 'ADMIN') {
      if (activeTab === 'semester-config') return 'Cấu hình Thời gian học kỳ & Báo cáo';
      if (activeTab === 'evidence-approval') return 'Phê duyệt Minh chứng Sinh viên';
      if (activeTab === 'report-appraisal') return 'Thẩm định Báo cáo & Lời phê';
      return 'Quản trị Tài khoản người dùng';
    }
    if (currentRole === 'MANAGER') {
      const c = dbData.clubs.find(club => club.id === selectedClubId);
      const cName = c ? c.name.split(' - ')[0] : selectedClubId.toUpperCase();
      if (activeTab === 'club-info') return `Hồ sơ & Ban điều hành CLB ${cName}`;
      if (activeTab === 'member-management') return `Danh sách Roster thành viên CLB ${cName}`;
      if (activeTab === 'event-manager') return `Quản lý Sự kiện & Điểm danh CLB ${cName}`;
      if (activeTab === 'document-archive') return `Kho tài liệu Kế thừa CLB ${cName}`;
      return `Báo cáo hoạt động CLB ${cName}`;
    }
    if (activeTab === 'club-directory') return 'Danh mục các CLB Đại học FPT';
    if (activeTab === 'event-calendar') return 'Đăng ký Tham gia Sự kiện trường';
    if (activeTab === 'member-workspace') return 'Không gian cá nhân & Minh chứng';
    if (activeTab === 'knowledge-sharing') return 'Chia sẻ Tài nguyên & Proposal mẫu';
    return 'Tra cứu Thông tin Cựu thành viên';
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <Sidebar 
        currentRole={currentRole}
        activeTab={getActiveTab()}
        setActiveTab={setActiveTab}
        currentUserProfile={currentUserProfile}
      />

      {/* Main Workspace Frame */}
      <main className="main-viewport">
        {/* Top Header navbar */}
        <Header 
          currentRole={currentRole}
          selectedClubId={selectedClubId}
          setSelectedClubId={setSelectedClubId}
          currentUserId={currentUserId}
          setCurrentUserId={setCurrentUserId}
          handleRoleSwitch={handleRoleSwitch}
          dbData={dbData}
          pageTitle={getPageTitle()}
          triggerNotification={triggerNotification}
        />

        {/* Viewport content wrapping */}
        <div className="content-wrapper">
          <AppRoutes 
            currentRole={currentRole}
            activeTab={getActiveTab()}
            dbData={dbData}
            currentUserId={currentUserId}
            selectedClubId={selectedClubId}
            currentUserProfile={currentUserProfile}
            triggerNotification={triggerNotification}
          />
        </div>
      </main>

      {/* Floating alert toasts */}
      {toast && (
        <div className="toast-container">
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={closeToast} 
          />
        </div>
      )}
    </div>
  );
}
