// FPT Club System Management Mock Database
const STORAGE_KEY = 'fpt_club_system_db_v2';

const defaultSemesters = [
  { id: 'SP26', name: 'Spring 2026', startDate: '2026-01-05', endDate: '2026-04-25', status: 'Finished' },
  { id: 'SU26', name: 'Summer 2026', startDate: '2026-05-04', endDate: '2026-08-15', status: 'Active' },
  { id: 'FA26', name: 'Fall 2026', startDate: '2026-09-07', endDate: '2026-12-19', status: 'Planned' }
];

const defaultReportPeriods = [
  { id: 'rp-su26-1', semesterId: 'SU26', name: 'Báo cáo Hoạt động Tháng 5', startDate: '2026-05-20', endDate: '2026-05-28', deadline: '2026-05-31', status: 'Closed' },
  { id: 'rp-su26-2', semesterId: 'SU26', name: 'Báo cáo Giữa kỳ Summer 2026', startDate: '2026-06-01', endDate: '2026-06-10', deadline: '2026-06-15', status: 'Open' },
  { id: 'rp-su26-3', semesterId: 'SU26', name: 'Báo cáo Chung khảo Kỳ Summer 2026', startDate: '2026-08-01', endDate: '2026-08-10', deadline: '2026-08-12', status: 'Planned' }
];

const defaultClubs = [
  {
    id: 'js',
    name: 'JS Club - Japanese Software Engineering',
    category: 'Academic',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80',
    fanpage: 'https://facebook.com/jsclub.fptu',
    intro: 'JS Club là Câu lạc bộ Kỹ nghệ phần mềm Nhật Bản tại FPT University, nơi chia sẻ đam mê công nghệ thông tin, văn hóa Nhật Bản và phát triển các sản phẩm phần mềm chất lượng cao.'
  },
  {
    id: 'fcode',
    name: 'F-Code Club',
    category: 'Academic',
    logo: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=120&h=120&q=80',
    fanpage: 'https://facebook.com/fcode.fptu',
    intro: 'F-Code là CLB học thuật đầu tiên của khoa CNTT Đại học FPT, thành lập từ năm 2010 với sứ mệnh truyền lửa đam mê lập trình, thuật toán và phát triển tư duy logic cho sinh viên.'
  },
  {
    id: 'melody',
    name: 'Melody Club - Music & Arts',
    category: 'Arts',
    logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=120&h=120&q=80',
    fanpage: 'https://facebook.com/melodyclub.fptu',
    intro: 'Melody Club là nơi quy tụ những tâm hồn yêu âm nhạc, đam mê ca hát và trình diễn nghệ thuật tại FPT University. CLB thường xuyên biểu diễn tại các sự kiện lớn của nhà trường.'
  },
  {
    id: 'chess',
    name: 'FPT Chess Club',
    category: 'Sports',
    logo: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=120&h=120&q=80',
    fanpage: 'https://facebook.com/fptchess.fptu',
    intro: 'Nơi tập hợp các kỳ thủ đam mê cờ vua, cờ tướng, cờ vây tại Đại học FPT. Tổ chức huấn luyện tư duy chiến thuật và các giải đấu cờ mở rộng thường niên.'
  }
];

const defaultUsers = [
  // PDP Staff (Admin)
  { id: 'PDP01', username: 'pdp.hoangnv', fullName: 'Nguyễn Việt Hoàng', email: 'hoangnv.pdp@fe.edu.vn', role: 'ADMIN', status: 'Active', isAlumni: false, cohort: 'Staff', facebook: 'fb.com/hoangnv.pdp', currentJob: 'Cán bộ phòng IC-PDP', phone: '0987654321' },
  { id: 'PDP02', username: 'pdp.khanhtq', fullName: 'Trần Quốc Khánh', email: 'khanhtq.pdp@fe.edu.vn', role: 'ADMIN', status: 'Active', isAlumni: false, cohort: 'Staff', facebook: 'fb.com/khanhtq.pdp', currentJob: 'Cán bộ quản lý CLB', phone: '0912345678' },
  
  // Managers
  { id: 'SE170111', username: 'khoi.ld', fullName: 'Lê Quang Khôi', email: 'khoildse170111@fpt.edu.vn', role: 'MANAGER', status: 'Active', isAlumni: false, cohort: 'K17', facebook: 'fb.com/lequangkhoi', currentJob: 'Sinh viên', phone: '0901234567' },
  { id: 'SE180222', username: 'fcode.lead', fullName: 'Phạm Minh Đức', email: 'ducmpse180222@fpt.edu.vn', role: 'MANAGER', status: 'Active', isAlumni: false, cohort: 'K18', facebook: 'fb.com/pmduc.fcode', currentJob: 'Sinh viên', phone: '0934567890' },
  { id: 'SE180333', username: 'chess.lead', fullName: 'Nguyễn Hà Hải', email: 'hainhse180333@fpt.edu.vn', role: 'MANAGER', status: 'Active', isAlumni: false, cohort: 'K18', facebook: 'fb.com/chess.hai', currentJob: 'Sinh viên', phone: '0977665544' },
  
  // Members
  { id: 'SE180001', username: 'khoa.nd', fullName: 'Nguyễn Đình Khoa', email: 'khoandse180001@fpt.edu.vn', role: 'MEMBER', status: 'Active', isAlumni: false, cohort: 'K18', facebook: 'fb.com/ndkhoa', currentJob: 'Sinh viên', phone: '0966554433' },
  { id: 'SE180002', username: 'duong.dk', fullName: 'Đường Đình Khôi', email: 'khoiddse180002@fpt.edu.vn', role: 'MEMBER', status: 'Active', isAlumni: false, cohort: 'K18', facebook: 'fb.com/ddkhoi', currentJob: 'Sinh viên', phone: '0955443322' },
  { id: 'SE190003', username: 'ngoc.bm', fullName: 'Bùi Minh Ngọc', email: 'ngocbmse190003@fpt.edu.vn', role: 'MEMBER', status: 'Active', isAlumni: false, cohort: 'K19', facebook: 'fb.com/bmngoc', currentJob: 'Sinh viên', phone: '0944332211' },
  { id: 'SE190123', username: 'tu.ha', fullName: 'Hoàng Anh Tú', email: 'tuahse190123@fpt.edu.vn', role: 'MEMBER', status: 'Active', isAlumni: false, cohort: 'K19', facebook: 'fb.com/tuhoanganh', currentJob: 'Sinh viên', phone: '0933221100' },
  
  // Alumni
  { id: 'SE140101', username: 'anh.nh', fullName: 'Nguyễn Hoàng Anh', email: 'anhnhse140101@alumni.fpt.edu.vn', role: 'MEMBER', status: 'Active', isAlumni: true, cohort: 'K14', facebook: 'fb.com/nha.solutions', currentJob: 'Solutions Architect tại FPT Software', phone: '0911223344' },
  { id: 'SE150202', username: 'chi.tb', fullName: 'Trần Bảo Chi', email: 'chitbse150202@alumni.fpt.edu.vn', role: 'MEMBER', status: 'Active', isAlumni: true, cohort: 'K15', facebook: 'fb.com/chitb.frontend', currentJob: 'Senior Front-End Dev tại VNG Corporation', phone: '0922334455' },
  { id: 'SE160303', username: 'quan.pm', fullName: 'Phạm Minh Quân', email: 'quanpmse160303@alumni.fpt.edu.vn', role: 'MEMBER', status: 'Active', isAlumni: true, cohort: 'K16', facebook: 'fb.com/pmquan.pm', currentJob: 'Product Manager tại Shopee Vietnam', phone: '0933445566' }
];

const defaultMemberships = [
  // JS Club Members
  { id: 'ms1', clubId: 'js', userId: 'SE170111', joinedSemester: 'FA23', role: 'Leader', status: 'Active' },
  { id: 'ms2', clubId: 'js', userId: 'SE180001', joinedSemester: 'SP24', role: 'Member', status: 'Active' },
  { id: 'ms3', clubId: 'js', userId: 'SE180002', joinedSemester: 'SP24', role: 'Member', status: 'Active' },
  { id: 'ms4', clubId: 'js', userId: 'SE140101', joinedSemester: 'FA18', role: 'Leader', status: 'Resigned' }, // Former Leader (Alumni)

  // F-Code Members
  { id: 'ms5', clubId: 'fcode', userId: 'SE180222', joinedSemester: 'SP24', role: 'Leader', status: 'Active' },
  { id: 'ms6', clubId: 'fcode', userId: 'SE180002', joinedSemester: 'SP24', role: 'Member', status: 'Active' },
  { id: 'ms7', clubId: 'fcode', userId: 'SE190123', joinedSemester: 'FA25', role: 'Member', status: 'Active' },
  { id: 'ms8', clubId: 'fcode', userId: 'SE150202', joinedSemester: 'FA19', role: 'Leader', status: 'Resigned' }, // Former Leader (Alumni)

  // Melody Members
  { id: 'ms9', clubId: 'melody', userId: 'SE190003', joinedSemester: 'SU25', role: 'Member', status: 'Active' },
  { id: 'ms10', clubId: 'melody', userId: 'SE160303', joinedSemester: 'FA20', role: 'Leader', status: 'Resigned' }, // Former Leader (Alumni)

  // Chess Members
  { id: 'ms11', clubId: 'chess', userId: 'SE180333', joinedSemester: 'SP24', role: 'Leader', status: 'Active' },
  { id: 'ms12', clubId: 'chess', userId: 'SE180001', joinedSemester: 'SU25', role: 'Member', status: 'Active' }
];

const defaultClubBoards = [
  { id: 'cb-js-2026', clubId: 'js', term: 'Học kỳ Summer 2026', handoverDoc: 'https://docs.google.com/document/d/1js-handover-su26/edit' },
  { id: 'cb-fcode-2026', clubId: 'fcode', term: 'Học kỳ Summer 2026', handoverDoc: 'https://docs.google.com/document/d/1fcode-handover-su26/edit' },
  { id: 'cb-chess-2026', clubId: 'chess', term: 'Học kỳ Summer 2026', handoverDoc: 'https://docs.google.com/document/d/1chess-handover-su26/edit' }
];

const defaultBoardMembers = [
  { id: 'bm1', boardId: 'cb-js-2026', userId: 'SE170111', position: 'President' },
  { id: 'bm2', boardId: 'cb-js-2026', userId: 'SE180001', position: 'Tech Lead' },
  { id: 'bm3', boardId: 'cb-fcode-2026', userId: 'SE180222', position: 'President' },
  { id: 'bm4', boardId: 'cb-fcode-2026', userId: 'SE190123', position: 'Vice President' },
  { id: 'bm5', boardId: 'cb-chess-2026', userId: 'SE180333', position: 'President' }
];

const defaultEvents = [
  // JS Club Events
  {
    id: 'ev-js-1',
    clubId: 'js',
    name: 'Workshop Lập trình Web với React & Next.js',
    dateTime: '2026-05-15T14:00',
    venue: 'Phòng 102 - Tòa nhà Alpha',
    budget: 1500000,
    description: 'Chia sẻ kiến thức về lập trình SPA, SSR với React 19 và Next.js 15 cho sinh viên K19.',
    status: 'Finished',
    approvalStatus: 'Approved'
  },
  {
    id: 'ev-js-2',
    clubId: 'js',
    name: 'Hackathon JS-Code Combat 2026',
    dateTime: '2026-06-20T08:00',
    venue: 'Hội trường Tòa nhà Beta',
    budget: 8000000,
    description: 'Cuộc thi lập trình thuật toán và ứng dụng web quy mô toàn trường diễn ra trong 24 giờ liên tục.',
    status: 'Planned',
    approvalStatus: 'Pending'
  },
  
  // F-Code Events
  {
    id: 'ev-fc-1',
    clubId: 'fcode',
    name: 'Seminar Giới thiệu về Trí tuệ Nhân tạo & Machine Learning',
    dateTime: '2026-05-18T09:30',
    venue: 'Phòng 204 - Tòa nhà Delta',
    budget: 1000000,
    description: 'Tổng quan về mạng Nơ-ron nhân tạo, học máy và lộ trình học AI cho kỹ sư phần mềm.',
    status: 'Finished',
    approvalStatus: 'Approved'
  },
  {
    id: 'ev-fc-2',
    clubId: 'fcode',
    name: 'F-Code Competitive Programming Contest',
    dateTime: '2026-06-25T13:30',
    venue: 'Phòng máy Lab 3 - Tòa nhà Gamma',
    budget: 3500000,
    description: 'Đấu trường thuật toán rèn luyện kỹ năng ACM-ICPC cho sinh viên CNTT.',
    status: 'Planned',
    approvalStatus: 'Pending'
  },

  // Melody Events
  {
    id: 'ev-me-1',
    clubId: 'melody',
    name: 'Đêm nhạc acoustic "Melody of Summer"',
    dateTime: '2026-06-12T19:30',
    venue: 'Sân thượng Tòa nhà Alpha',
    budget: 5000000,
    description: 'Không gian âm nhạc acoustic nhẹ nhàng đón chào những ngày hè sôi động.',
    status: 'Planned',
    approvalStatus: 'Pending'
  }
];

const defaultParticipants = [
  // Workshop React Participants
  { id: 'pt1', eventId: 'ev-js-1', userId: 'SE180001', registeredAt: '2026-05-10', attendanceStatus: 'Present' },
  { id: 'pt2', eventId: 'ev-js-1', userId: 'SE180002', registeredAt: '2026-05-11', attendanceStatus: 'Present' },
  { id: 'pt3', eventId: 'ev-js-1', userId: 'SE190003', registeredAt: '2026-05-12', attendanceStatus: 'Absent' },
  
  // Seminar AI Participants
  { id: 'pt4', eventId: 'ev-fc-1', userId: 'SE180002', registeredAt: '2026-05-15', attendanceStatus: 'Present' },
  { id: 'pt5', eventId: 'ev-fc-1', userId: 'SE190123', registeredAt: '2026-05-16', attendanceStatus: 'Present' },
  { id: 'pt6', eventId: 'ev-fc-1', userId: 'SE180001', registeredAt: '2026-05-17', attendanceStatus: 'Absent' }
];

const defaultDocuments = [
  {
    id: 'doc-js-1',
    clubId: 'js',
    name: 'Kịch bản chi tiết Workshop React 19',
    type: 'Script',
    url: 'https://fpt.edu.vn/doc/js-react19-script.pdf',
    visibility: 'Public',
    downloadCount: 45,
    viewCount: 124,
    uploadedAt: '2026-05-12'
  },
  {
    id: 'doc-js-2',
    clubId: 'js',
    name: 'Kế hoạch tài chính & Proposal Hackathon 2026',
    type: 'Proposal',
    url: 'https://fpt.edu.vn/doc/js-hackathon2026-proposal.pdf',
    visibility: 'Internal',
    downloadCount: 8,
    viewCount: 22,
    uploadedAt: '2026-05-25'
  },
  {
    id: 'doc-fc-1',
    clubId: 'fcode',
    name: 'Slide bài giảng lập trình C căn bản',
    type: 'Proposal',
    url: 'https://fpt.edu.vn/doc/fc-c-programming.pdf',
    visibility: 'Public',
    downloadCount: 156,
    viewCount: 382,
    uploadedAt: '2025-10-10'
  },
  {
    id: 'doc-fc-2',
    clubId: 'fcode',
    name: 'Kịch bản tổ chức F-Code Contest 2026',
    type: 'Script',
    url: 'https://fpt.edu.vn/doc/fc-contest-2026-script.pdf',
    visibility: 'Internal',
    downloadCount: 3,
    viewCount: 15,
    uploadedAt: '2026-05-29'
  }
];

const defaultEvidence = [
  {
    id: 'evd-1',
    userId: 'SE180001',
    eventId: 'ev-js-1',
    clubId: 'js',
    type: 'Check-In Photo',
    fileUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
    status: 'Approved',
    submittedAt: '2026-05-15T17:00:00Z',
    approvedAt: '2026-05-16T09:00:00Z',
    adminRemark: 'Minh chứng hợp lệ. Xác nhận tham gia Workshop React.'
  },
  {
    id: 'evd-2',
    userId: 'SE180002',
    eventId: 'ev-fc-1',
    clubId: 'fcode',
    type: 'Check-In Photo',
    fileUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=600&q=80',
    status: 'Pending',
    submittedAt: '2026-06-02T10:15:00Z',
    approvedAt: null,
    adminRemark: ''
  },
  {
    id: 'evd-3',
    userId: 'SE190003',
    eventId: null,
    clubId: 'melody',
    type: 'Certificate',
    fileUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df53f7ec?auto=format&fit=crop&w=600&q=80',
    status: 'Pending',
    submittedAt: '2026-06-04T15:30:00Z',
    approvedAt: null,
    adminRemark: ''
  }
];

const defaultClubReports = [
  {
    id: 'rep-js-1',
    clubId: 'js',
    semesterId: 'SU26',
    reportPeriodId: 'rp-su26-1',
    eventCount: 1,
    memberCount: 3,
    content: 'CLB JS đã hoàn thành tốt mục tiêu tháng 5. Đã tổ chức thành công Workshop React thu hút 40+ sinh viên tham gia. Nội bộ đoàn kết, bắt đầu chuẩn bị kế hoạch chạy truyền thông Hackathon vào tháng 6.',
    submittedAt: '2026-05-25T11:00:00Z',
    score: 85,
    adminRemark: 'Báo cáo đầy đủ, hoạt động hiệu quả. Workshop có phản hồi tốt. Cần phát huy.',
    status: 'Appraised'
  },
  {
    id: 'rep-fc-1',
    clubId: 'fcode',
    semesterId: 'SU26',
    reportPeriodId: 'rp-su26-1',
    eventCount: 1,
    memberCount: 3,
    content: 'CLB F-Code đã chạy thành công buổi Seminar AI & Machine Learning. Thành viên tham gia đầy đủ. Hoạt động học thuật nội bộ diễn ra đúng tiến độ.',
    submittedAt: '2026-05-26T14:30:00Z',
    score: 90,
    adminRemark: 'Điểm cộng lớn cho chất lượng học thuật của Seminar. Trình bày báo cáo rõ ràng.',
    status: 'Appraised'
  },
  {
    id: 'rep-js-2',
    clubId: 'js',
    semesterId: 'SU26',
    reportPeriodId: 'rp-su26-2',
    eventCount: 1, // Hackathon
    memberCount: 3,
    content: 'Báo cáo giữa kỳ Summer 2026: Đã chốt xong timeline Hackathon và đàm phán tài trợ với 2 doanh nghiệp đối tác. Duy trì sinh hoạt học thuật hàng tuần.',
    submittedAt: '2026-06-04T09:00:00Z',
    score: null,
    adminRemark: '',
    status: 'Submitted'
  }
];

// Read from storage or set defaults
function getDb() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initialDb = {
      semesters: defaultSemesters,
      reportPeriods: defaultReportPeriods,
      clubs: defaultClubs,
      users: defaultUsers,
      memberships: defaultMemberships,
      clubBoards: defaultClubBoards,
      boardMembers: defaultBoardMembers,
      events: defaultEvents,
      participants: defaultParticipants,
      documents: defaultDocuments,
      evidence: defaultEvidence,
      clubReports: defaultClubReports
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDb));
    return initialDb;
  }
  return JSON.parse(data);
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  // Trigger custom event to notify components of database updates
  window.dispatchEvent(new CustomEvent('mockDbUpdate'));
}

export const mockDb = {
  // Query all
  getData: () => getDb(),

  // Semesters
  addSemester: (sem) => {
    const db = getDb();
    db.semesters.push({
      id: sem.id || 'SEM' + Date.now(),
      status: 'Planned',
      ...sem
    });
    saveDb(db);
  },

  // Report Periods
  addReportPeriod: (rp) => {
    const db = getDb();
    db.reportPeriods.push({
      id: 'rp-' + Date.now(),
      status: 'Planned',
      ...rp
    });
    saveDb(db);
  },

  // Evidence Approval
  updateEvidenceStatus: (id, status, remark) => {
    const db = getDb();
    const idx = db.evidence.findIndex(e => e.id === id);
    if (idx !== -1) {
      db.evidence[idx].status = status;
      db.evidence[idx].adminRemark = remark;
      db.evidence[idx].approvedAt = new Date().toISOString();
      saveDb(db);
    }
  },
  submitEvidence: (evd) => {
    const db = getDb();
    db.evidence.push({
      id: 'evd-' + Date.now(),
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      approvedAt: null,
      adminRemark: '',
      ...evd
    });
    saveDb(db);
  },

  // Club Reports Appraisal
  appraiseReport: (id, score, remark) => {
    const db = getDb();
    const idx = db.clubReports.findIndex(r => r.id === id);
    if (idx !== -1) {
      db.clubReports[idx].score = Number(score);
      db.clubReports[idx].adminRemark = remark;
      db.clubReports[idx].status = 'Appraised';
      saveDb(db);
    }
  },
  submitReport: (rep) => {
    const db = getDb();
    // Auto-calculate statistics
    const events = db.events.filter(e => e.clubId === rep.clubId);
    const members = db.memberships.filter(m => m.clubId === rep.clubId && m.status === 'Active');
    
    const newReport = {
      id: 'rep-' + Date.now(),
      eventCount: events.length,
      memberCount: members.length,
      submittedAt: new Date().toISOString(),
      score: null,
      adminRemark: '',
      status: 'Submitted',
      ...rep
    };
    db.clubReports.push(newReport);
    saveDb(db);
  },

  // User Management
  setUserStatus: (id, status) => {
    const db = getDb();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      db.users[idx].status = status;
      saveDb(db);
    }
  },
  upgradeToManager: (userId) => {
    const db = getDb();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx].role = 'MANAGER';
      saveDb(db);
    }
  },
  downgradeToMember: (userId) => {
    const db = getDb();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx].role = 'MEMBER';
      saveDb(db);
    }
  },
  updateUserProfile: (userId, info) => {
    const db = getDb();
    const idx = db.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...info };
      saveDb(db);
    }
  },

  // Club Board / Handover
  updateClubBoard: (clubId, term, handoverDoc, boardMembersList) => {
    const db = getDb();
    
    // Find or create board
    let board = db.clubBoards.find(b => b.clubId === clubId && b.term === term);
    if (!board) {
      board = { id: 'cb-' + clubId + '-' + Date.now(), clubId, term, handoverDoc };
      db.clubBoards.push(board);
    } else {
      board.handoverDoc = handoverDoc;
    }

    // Clean old board members for this board
    db.boardMembers = db.boardMembers.filter(bm => bm.boardId !== board.id);

    // Save new board members
    boardMembersList.forEach(m => {
      db.boardMembers.push({
        id: 'bm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        boardId: board.id,
        userId: m.userId,
        position: m.position
      });

      // Promote to manager if they are in the board
      const userIdx = db.users.findIndex(u => u.id === m.userId);
      if (userIdx !== -1 && db.users[userIdx].role === 'MEMBER') {
        db.users[userIdx].role = 'MANAGER';
      }
    });

    saveDb(db);
  },

  // Club Info update
  updateClub: (id, name, intro, logo, fanpage) => {
    const db = getDb();
    const idx = db.clubs.findIndex(c => c.id === id);
    if (idx !== -1) {
      db.clubs[idx] = { ...db.clubs[idx], name, intro, logo, fanpage };
      saveDb(db);
    }
  },

  // Members Management
  addClubMember: (clubId, userId, role = 'Member') => {
    const db = getDb();
    
    // Check if user exists
    const userExists = db.users.some(u => u.id === userId);
    if (!userExists) return false;

    // Check if membership already exists
    const hasMembership = db.memberships.some(m => m.clubId === clubId && m.userId === userId && m.status === 'Active');
    if (hasMembership) return false;

    db.memberships.push({
      id: 'ms-' + Date.now(),
      clubId,
      userId,
      joinedSemester: 'SU26',
      role,
      status: 'Active'
    });
    saveDb(db);
    return true;
  },
  setMemberStatus: (membershipId, status) => {
    const db = getDb();
    const idx = db.memberships.findIndex(m => m.id === membershipId);
    if (idx !== -1) {
      db.memberships[idx].status = status;
      saveDb(db);
    }
  },

  // Events Management
  addEvent: (evt) => {
    const db = getDb();
    db.events.push({
      id: 'ev-' + Date.now(),
      status: 'Planned',
      ...evt
    });
    saveDb(db);
  },
  registerEvent: (eventId, userId) => {
    const db = getDb();
    const registered = db.participants.some(p => p.eventId === eventId && p.userId === userId);
    if (!registered) {
      db.participants.push({
        id: 'pt-' + Date.now(),
        eventId,
        userId,
        registeredAt: new Date().toISOString().split('T')[0],
        attendanceStatus: 'Registered' // default is 'Registered' / 'Vắng mặt'
      });
      saveDb(db);
    }
  },
  updateAttendance: (eventId, userId, status) => {
    const db = getDb();
    const idx = db.participants.findIndex(p => p.eventId === eventId && p.userId === userId);
    if (idx !== -1) {
      db.participants[idx].attendanceStatus = status;
    } else {
      // Create record if not existed
      db.participants.push({
        id: 'pt-' + Date.now(),
        eventId,
        userId,
        registeredAt: new Date().toISOString().split('T')[0],
        attendanceStatus: status
      });
    }
    saveDb(db);
  },

  // Documents
  addDocument: (doc) => {
    const db = getDb();
    db.documents.push({
      id: 'doc-' + Date.now(),
      downloadCount: 0,
      viewCount: 0,
      uploadedAt: new Date().toISOString().split('T')[0],
      ...doc
    });
    saveDb(db);
  },
  incrementDocCounters: (docId, action = 'view') => {
    const db = getDb();
    const idx = db.documents.findIndex(d => d.id === docId);
    if (idx !== -1) {
      if (action === 'download') {
        db.documents[idx].downloadCount += 1;
      } else {
        db.documents[idx].viewCount += 1;
      }
      saveDb(db);
    }
  },

  // Club Creation (Admin only)
  addClub: (club) => {
    const db = getDb();
    db.clubs.push({
      id: 'club-' + Date.now(),
      ...club
    });
    saveDb(db);
  },

  // Event Approval (Admin only)
  approveEvent: (eventId, remark = '') => {
    const db = getDb();
    const idx = db.events.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      db.events[idx].approvalStatus = 'Approved';
      db.events[idx].approvalRemark = remark;
      db.events[idx].approvedAt = new Date().toISOString();
      saveDb(db);
    }
  },
  rejectEvent: (eventId, remark = '') => {
    const db = getDb();
    const idx = db.events.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      db.events[idx].approvalStatus = 'Rejected';
      db.events[idx].approvalRemark = remark;
      db.events[idx].approvedAt = new Date().toISOString();
      saveDb(db);
    }
  }
};
