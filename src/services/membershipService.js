import apiClient from '../utils/apiClient';

/**
 * Club Membership Service
 * Tương ứng với ClubMemberList trong Swagger
 */

/**
 * Lấy danh sách thành viên của một CLB
 * GET /api/clubs/{clubId}/members
 * @param {number|string} clubId
 */
export async function getClubMembers(clubId) {
  const response = await apiClient.get(`/api/clubs/${clubId}/members`);
  return response.data;
}

/**
 * Thêm thành viên mới vào CLB bằng Student ID
 * POST /api/member/add-member-by-student-id
 * @param {Object} dto - AddClubMemberDto
 *   { clubId, studentId, joinReason, personalGoal }
 */
export async function addClubMember(dto) {
  const response = await apiClient.post('/api/member/add-member-by-student-id', dto);
  return response.data;
}

/**
 * Xem chi tiết thành viên CLB
 * GET /api/member/view-member-detail/{membershipId}
 * @param {number|string} membershipId
 */
export async function getMemberDetail(membershipId) {
  const response = await apiClient.get(`/api/member/view-member-detail/${membershipId}`);
  return response.data;
}

/**
 * Cho thành viên rút lui khỏi CLB
 * PUT /api/member/remove-member/{membershipId}
 * @param {number|string} membershipId
 */
export async function removeClubMember(membershipId) {
  const response = await apiClient.put(`/api/member/remove-member/${membershipId}`);
  return response.data;
}

/**
 * Xác nhận kích hoạt tài khoản thành viên (từ link email)
 * GET /api/member/confirm-activation?token={token}
 * @param {string} token - Token kích hoạt từ email
 */
export async function confirmActivation(token) {
  const response = await apiClient.get('/api/member/confirm-activation', {
    params: { token }
  });
  return response.data;
}
