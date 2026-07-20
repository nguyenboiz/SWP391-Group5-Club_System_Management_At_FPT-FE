import apiClient from '../utils/apiClient';

/**
 * Club Service
 * Tương ứng với /api/clubs trong Swagger
 */

/**
 * Lấy danh sách câu lạc bộ
 * GET /api/clubs
 * @param {string} status - Lọc theo trạng thái (Active, Suspended, v.v.)
 */
export async function getClubs(status = null) {
  const params = status ? { status } : {};
  const response = await apiClient.get('/api/clubs', { params });
  return response.data;
}

/**
 * Tạo CLB mới
 * POST /api/clubs
 * @param {Object} dto - CreateClubDto
 *   { clubName, clubCode, description, fanpageUrl, logoImage, foundedDate, leaderStudentId }
 */
export async function createClub(dto) {
  const payload = {
    ...dto,
    leaderStudentId: dto.leaderStudentId || dto.managerStudentId
  };
  delete payload.managerStudentId;
  const response = await apiClient.post('/api/clubs', payload);
  return response.data;
}

/**
 * Cập nhật thông tin CLB
 * PUT /api/clubs/{clubId}
 * @param {number|string} clubId
 * @param {Object} dto - UpdateClubDto
 *   { clubName, description, logoImage, fanpageUrl, foundedDate }
 */
export async function updateClub(clubId, dto) {
  const response = await apiClient.put(`/api/clubs/${clubId}`, dto);
  return response.data;
}

/**
 * Thay đổi trạng thái CLB
 * PATCH /api/clubs/{clubId}/status
 * @param {number|string} clubId
 * @param {string} status
 */
export async function updateClubStatus(clubId, status) {
  const response = await apiClient.patch(`/api/clubs/${clubId}/status`, { status });
  return response.data;
}

/**
 * Lấy chi tiết câu lạc bộ
 * GET /api/clubs/{clubId}
 * @param {number|string} clubId
 */
export async function getClubDetail(clubId) {
  const response = await apiClient.get(`/api/clubs/${clubId}`);
  return response.data;
}

/**
 * Lấy thống kê chi tiết của 1 CLB
 * GET /api/clubs/{clubId}/stats
 * @param {number|string} clubId
 * Trả về: số thành viên, sự kiện (chờ/đã duyệt), báo cáo, minh chứng
 */
export async function getClubStats(clubId) {
  const response = await apiClient.get(`/api/clubs/${clubId}/stats`);
  return response.data;
}

/**
 * Giải thể CLB (Xóa mềm - Soft Delete)
 * DELETE /api/clubs/{clubId}
 * @param {number|string} clubId
 * Đổi trạng thái CLB thành "Giải thể", giữ nguyên lịch sử dữ liệu.
 * Quyền: [ADMIN]
 */
export async function dissolveClub(clubId) {
  const response = await apiClient.delete(`/api/clubs/${clubId}`);
  return response.data;
}

/**
 * Lấy danh sách cựu thành viên của CLB
 * GET /api/clubs/{clubId}/alumni
 * @param {number|string} clubId
 * @param {string} search
 */
export async function getClubAlumni(clubId, search = '') {
  const params = search ? { search } : {};
  const response = await apiClient.get(`/api/clubs/${clubId}/alumni`, { params });
  return response.data;
}

