import apiClient from '../utils/apiClient';

/**
 * ReportPeriod Service
 * Tương ứng với /api/report-periods trong Swagger
 */

/**
 * Lấy danh sách đợt báo cáo theo học kỳ
 * GET /api/report-periods
 * @param {number|string} semesterId
 */
export async function getReportPeriods(semesterId) {
  const params = semesterId ? { semesterId } : {};
  const response = await apiClient.get('/api/report-periods', { params });
  return response.data;
}

/**
 * Tạo đợt báo cáo mới
 * POST /api/report-periods
 * @param {Object} dto - CreateReportPeriodRequestDto
 *   { semesterId, periodName, description, deadline }
 */
export async function createReportPeriod(dto) {
  const response = await apiClient.post('/api/report-periods', dto);
  return response.data;
}

/**
 * Cập nhật đợt báo cáo
 * PUT /api/report-periods/{id}
 * @param {number|string} id
 * @param {Object} dto - UpdateReportPeriodRequestDto
 *   { semesterId, periodName, description, deadline, status }
 */
export async function updateReportPeriod(id, dto) {
  const response = await apiClient.put(`/api/report-periods/${id}`, dto);
  return response.data;
}

/**
 * Lấy số báo cáo CLB đang chờ duyệt
 * GET /api/report-periods/reports/count/pending
 */
export async function getReportsPendingCount() {
  const response = await apiClient.get('/api/report-periods/reports/count/pending');
  return response.data;
}

