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
 *   { clubName, clubCode, description, fanpageUrl, logoImage, foundedDate, managerStudentId }
 */
export async function createClub(dto) {
  const response = await apiClient.post('/api/clubs', dto);
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
