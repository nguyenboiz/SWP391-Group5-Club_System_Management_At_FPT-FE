import apiClient from '../utils/apiClient';

/**
 * Event Service
 * Tương ứng với /api/events/* trong Swagger
 */

/**
 * Lấy tổng số sự kiện
 * GET /api/events/count/total
 */
export async function getEventsCountTotal() {
  const response = await apiClient.get('/api/events/count/total');
  return response.data;
}

/**
 * Lấy số sự kiện đang chờ duyệt
 * GET /api/events/count/pending
 */
export async function getEventsCountPending() {
  const response = await apiClient.get('/api/events/count/pending');
  return response.data;
}

/**
 * Tạo sự kiện mới (multipart/form-data)
 * POST /api/events/create
 * @param {FormData} formData
 *   Fields: ClubId, EventName, Description, Location, PlanBudget,
 *           TargetParticipants, StartTime, EndTime, Files[]
 */
export async function createEvent(formData) {
  const response = await apiClient.post('/api/events/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Lấy chi tiết sự kiện
 * GET /api/events/detail/{eventId}
 */
export async function getEventDetail(eventId) {
  const response = await apiClient.get(`/api/events/detail/${eventId}`);
  return response.data;
}

/**
 * Lấy danh sách sự kiện theo CLB
 * GET /api/events/by-club/{clubId}
 */
export async function getEventsByClub(clubId) {
  const response = await apiClient.get(`/api/events/by-club/${clubId}`);
  return response.data;
}

/**
 * Lấy danh sách sự kiện đã được duyệt theo CLB
 * GET /api/events/approved-by-club/{clubId}
 */
export async function getApprovedEventsByClub(clubId) {
  const response = await apiClient.get(`/api/events/approved-by-club/${clubId}`);
  return response.data;
}

/**
 * Cập nhật thông tin sự kiện
 * PUT /api/events/update/{eventId}
 * @param {number|string} eventId
 * @param {Object} dto - UpdateEventDto
 *   { eventName, description, location, planBudget, targetParticipants, startTime, endTime }
 */
export async function updateEvent(eventId, dto) {
  const response = await apiClient.put(`/api/events/update/${eventId}`, dto);
  return response.data;
}

/**
 * Hủy sự kiện
 * PUT /api/events/cancel/{eventId}
 */
export async function cancelEvent(eventId) {
  const response = await apiClient.put(`/api/events/cancel/${eventId}`);
  return response.data;
}

/**
 * Lấy tất cả sự kiện (Admin), có thể lọc theo status
 * GET /api/events/all?status=Pending|Approved|Rejected
 * @param {string} [status] - optional filter
 */
export async function getAllEvents(status) {
  const params = status && status !== 'ALL' ? { status } : {};
  const response = await apiClient.get('/api/events/all', { params });
  return response.data;
}

/**
 * Duyệt sự kiện
 * PUT /api/events/approve/{eventId}
 */
export async function approveEvent(eventId) {
  const response = await apiClient.put(`/api/events/approve/${eventId}`);
  return response.data;
}

/**
 * Từ chối sự kiện
 * PUT /api/events/reject/{eventId}
 * @param {number|string} eventId
 * @param {Object} dto - RejectEventDto { rejectReason }
 */
export async function rejectEvent(eventId, dto) {
  const response = await apiClient.put(`/api/events/reject/${eventId}`, dto);
  return response.data;
}

/**
 * Đăng ký tham gia sự kiện
 * POST /api/events/{eventId}/register
 * @param {number|string} eventId
 * @param {Object} dto - RegisterEventRequestDto { roleInEvent }
 */
export async function registerEvent(eventId, dto) {
  const response = await apiClient.post(`/api/events/${eventId}/register`, dto);
  return response.data;
}

/**
 * Nộp chứng nhận (minh chứng) sự kiện
 * POST /api/events/{eventId}/evidence
 * @param {number|string} eventId
 * @param {FormData} formData - EvidenceFiles[] (files), Feedback (string)
 */
export async function submitEvidence(eventId, formData) {
  const response = await apiClient.post(`/api/events/${eventId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Yêu cầu chỉnh sửa sự kiện
 * PUT /api/events/request-edit/{eventId}
 * @param {number|string} eventId
 * @param {Object} dto - { rejectReason }
 */
export async function requestEditEvent(eventId, dto) {
  const response = await apiClient.put(`/api/events/request-edit/${eventId}`, dto);
  return response.data;
}

/**
 * Xét duyệt minh chứng (evidence)
 * PATCH /api/events/evidence/{evidenceId}/review
 * @param {number|string} evidenceId
 * @param {Object} dto - { status } // "Hợp lệ" | "Yêu cầu bổ sung" | "Không hợp lệ"
 */
export async function reviewEvidence(evidenceId, dto) {
  const response = await apiClient.patch(`/api/events/evidence/${evidenceId}/review`, dto);
  return response.data;
}

/**
 * Xét duyệt minh chứng dành cho Leader (Trưởng CLB)
 * PATCH /api/events/evidence/{evidenceId}/leader-review
 * @param {number|string} evidenceId
 * @param {Object} dto - { status } // "Hợp lệ" | "Yêu cầu bổ sung" | "Không hợp lệ"
 */
export async function reviewEvidenceLeader(evidenceId, dto) {
  const response = await apiClient.patch(`/api/events/evidence/${evidenceId}/leader-review`, dto);
  return response.data;
}

/**
 * Lấy danh sách minh chứng đang chờ duyệt toàn hệ thống (API MỚI từ BE)
 * GET /api/events/evidences/pending
 * Quyền: [ADMIN, Manager]
 * Trả về danh sách toàn bộ minh chứng sinh viên nộp đang ở trạng thái "Đang chờ"
 */
export async function getPendingEvidences() {
  const response = await apiClient.get('/api/events/evidences/pending');
  return response.data;
}

/**
 * Lấy danh sách minh chứng đang chờ Leader duyệt theo CLB
 * GET /api/events/evidences/pending-leader
 * @param {number|string} clubId
 */
export async function getPendingEvidencesLeader(clubId) {
  const response = await apiClient.get('/api/events/evidences/pending-leader', { params: { clubId } });
  return response.data;
}

/**
 * Lấy danh sách minh chứng theo 1 sự kiện cụ thể
 * GET /api/events/{eventId}/evidences
 * Quyền: [ADMIN, Manager]
 * @param {number|string} eventId
 */
export async function getEventEvidences(eventId) {
  const response = await apiClient.get(`/api/events/${eventId}/evidences`);
  return response.data;
}

/**
 * Lấy danh sách thành viên tham gia 1 sự kiện
 * GET /api/events/{eventId}/participants
 * @param {number|string} eventId
 */
export async function getEventParticipants(eventId) {
  const response = await apiClient.get(`/api/events/${eventId}/participants`);
  return response.data;
}
