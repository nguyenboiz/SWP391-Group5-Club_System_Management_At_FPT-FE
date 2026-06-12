import apiClient from '../utils/apiClient';

/**
 * Semester Service
 * Tương ứng với /api/semesters trong Swagger
 */

/**
 * Lấy danh sách học kỳ
 * GET /api/semesters
 */
export async function getSemesters() {
  const response = await apiClient.get('/api/semesters');
  return response.data;
}

/**
 * Tạo học kỳ mới
 * POST /api/semesters
 * @param {Object} dto - CreateSemesterRequestDto
 *   { semesterName, description, startDate, endDate }
 */
export async function createSemester(dto) {
  const response = await apiClient.post('/api/semesters', dto);
  return response.data;
}

/**
 * Cập nhật học kỳ
 * PUT /api/semesters/{id}
 * @param {number|string} id
 * @param {Object} dto - UpdateSemesterRequestDto
 *   { semesterName, description, startDate, endDate, status }
 */
export async function updateSemester(id, dto) {
  const response = await apiClient.put(`/api/semesters/${id}`, dto);
  return response.data;
}
