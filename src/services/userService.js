import apiClient from '../utils/apiClient';

/**
 * User Service
 * Tương ứng với /api/users trong Swagger
 */

/**
 * Lấy danh sách toàn bộ người dùng
 * GET /api/users
 */
export async function getUsers() {
  const response = await apiClient.get('/api/users');
  return response.data;
}

/**
 * Lấy thông tin chi tiết một người dùng
 * GET /api/users/{userId}
 */
export async function getUserDetail(userId) {
  const response = await apiClient.get(`/api/users/${userId}`);
  return response.data;
}

/**
 * Tạo tài khoản cán bộ mới (Admin/Manager)
 * POST /api/users/staff
 * @param {Object} dto - CreateStaffUserDto
 *   { username, password, systemRole }
 */
export async function createStaff(dto) {
  const response = await apiClient.post('/api/users/staff', dto);
  return response.data;
}

/**
 * Khóa tài khoản người dùng
 * PUT /api/users/{userId}/block
 */
export async function blockUser(userId) {
  const response = await apiClient.put(`/api/users/${userId}/block`);
  return response.data;
}

/**
 * Mở khóa tài khoản người dùng
 * PUT /api/users/{userId}/unblock
 */
export async function unblockUser(userId) {
  const response = await apiClient.put(`/api/users/${userId}/unblock`);
  return response.data;
}

/**
 * Cập nhật hồ sơ cá nhân
 * PUT /api/users/profile
 * @param {FormData} formData
 *   Fields: PhoneNumber, Gender, DateOfBirth, AvatarFile
 */
export async function updateProfile(formData) {
  const response = await apiClient.put('/api/users/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Lấy hồ sơ cá nhân của người dùng hiện tại
 * GET /api/users/profile
 */
export async function getMyProfile() {
  const response = await apiClient.get('/api/users/profile');
  return response.data;
}

/**
 * Lấy lịch sử hoạt động của người dùng
 * GET /api/users/{userId}/activity-history
 * @param {number|string} userId
 */
export async function getUserActivityHistory(userId) {
  const response = await apiClient.get(`/api/users/${userId}/activity-history`);
  return response.data;
}


