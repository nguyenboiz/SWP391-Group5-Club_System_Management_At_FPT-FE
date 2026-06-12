import apiClient from '../utils/apiClient';

/**
 * Authentication Service
 * Tương ứng với /api/auth/* trong Swagger
 */

/**
 * Đăng nhập hệ thống
 * POST /api/auth/login
 * @param {string} username
 * @param {string} password
 * @returns {Promise<Object>} Trả về token hoặc tempToken
 */
export async function login(username, password) {
  const response = await apiClient.post('/api/auth/login', { username, password });
  return response.data;
}

/**
 * Chọn câu lạc bộ hoạt động (dành cho Manager/Member)
 * POST /api/auth/select-club
 * @param {string} tempToken
 * @param {number|string} clubId
 * @returns {Promise<Object>} Trả về token chính thức
 */
export async function selectClub(tempToken, clubId) {
  const response = await apiClient.post('/api/auth/select-club', {
    tempToken,
    clubId: parseInt(clubId, 10)
  });
  return response.data;
}

/**
 * Đăng xuất
 * POST /api/auth/logout
 */
export async function logout() {
  const response = await apiClient.post('/api/auth/logout');
  return response.data;
}

/**
 * Lấy thông tin cá nhân hiện tại của token đang đăng nhập
 * GET /api/auth/me
 */
export async function getMe() {
  const response = await apiClient.get('/api/auth/me');
  return response.data;
}
