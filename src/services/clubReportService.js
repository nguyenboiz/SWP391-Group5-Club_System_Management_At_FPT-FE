import apiClient from '../utils/apiClient';

/**
 * Club Report Service
 * Tương ứng với /api/club-reports trong Swagger
 */

/**
 * Lấy danh sách báo cáo hoạt động CLB
 * GET /api/club-reports
 * @param {Object} params - { reportPeriodId, clubId, status }
 */
export async function getClubReports(params = {}) {
  const response = await apiClient.get('/api/club-reports', { params });
  return response.data;
}

/**
 * Chi tiết báo cáo hoạt động CLB
 * GET /api/club-reports/{clubReportId}
 */
export async function getClubReportDetail(clubReportId) {
  const response = await apiClient.get(`/api/club-reports/${clubReportId}`);
  return response.data;
}

/**
 * Phê duyệt và nhận xét báo cáo CLB
 * PATCH /api/club-reports/{clubReportId}/review
 * @param {number|string} clubReportId
 * @param {Object} dto - ReviewClubReportRequestDto
 *   { status, icpdpFeedback }
 */
export async function reviewClubReport(clubReportId, dto) {
  const response = await apiClient.patch(`/api/club-reports/${clubReportId}/review`, dto);
  return response.data;
}

/**
 * Manager duyệt báo cáo hoạt động CLB
 * PATCH /api/club-reports/{clubReportId}/manager-review
 * @param {number|string} clubReportId
 * @param {Object} dto - { status, managerNote }
 */
export async function managerReviewClubReport(clubReportId, dto) {
  const response = await apiClient.patch(`/api/club-reports/${clubReportId}/manager-review`, dto);
  return response.data;
}

/**
 * Nộp báo cáo hoạt động CLB mới
 * POST /api/club-reports
 * @param {Object} dto - { reportPeriodId, clubId, reportTitle, summaryContent, totalEventsHeld }
 */
export async function createClubReport(dto) {
  const response = await apiClient.post('/api/club-reports', dto);
  return response.data;
}
