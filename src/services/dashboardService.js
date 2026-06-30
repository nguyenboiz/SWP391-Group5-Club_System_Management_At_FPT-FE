import apiClient from '../utils/apiClient';

/**
 * Dashboard Service
 * Tương ứng với /api/admin/dashboard trong Swagger
 */

/**
 * Lấy số liệu thống kê Dashboard Admin
 * GET /api/admin/dashboard
 */
export async function getAdminDashboard() {
  const response = await apiClient.get('/api/admin/dashboard');
  return response.data;
}
