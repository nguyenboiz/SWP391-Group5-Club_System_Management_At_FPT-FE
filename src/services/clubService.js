import apiClient from '../utils/apiClient';

/**
 * Club Service
 * Tương ứng với /api/clubs trong Swagger
 */

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
