import apiClient from '../utils/apiClient';

/**
 * Document Service
 * Tương ứng với /api/documents/* trong Swagger
 */

/**
 * Upload tài liệu (multipart/form-data)
 * POST /api/documents/upload
 * @param {FormData} formData
 *   Fields: ClubId, DocumentTypeId, EventId, AccessLevel, Files[]
 */
export async function uploadDocument(formData) {
  const response = await apiClient.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Lấy chi tiết tài liệu
 * GET /api/documents/detail/{documentId}
 */
export async function getDocumentDetail(documentId) {
  const response = await apiClient.get(`/api/documents/detail/${documentId}`);
  return response.data;
}

/**
 * Lấy danh sách tài liệu theo CLB
 * GET /api/documents/by-club/{clubId}
 */
export async function getDocumentsByClub(clubId) {
  const response = await apiClient.get(`/api/documents/by-club/${clubId}`);
  return response.data;
}

/**
 * Lấy danh sách tài liệu theo sự kiện
 * GET /api/documents/by-event/{eventId}
 */
export async function getDocumentsByEvent(eventId) {
  const response = await apiClient.get(`/api/documents/by-event/${eventId}`);
  return response.data;
}

/**
 * Lấy danh sách tài liệu theo loại
 * GET /api/documents/by-type/{documentTypeId}
 */
export async function getDocumentsByType(documentTypeId) {
  const response = await apiClient.get(`/api/documents/by-type/${documentTypeId}`);
  return response.data;
}

/**
 * Cập nhật thông tin tài liệu
 * PUT /api/documents/update/{documentId}
 * @param {number|string} documentId
 * @param {Object} dto - UpdateDocumentDto
 *   { documentName, documentTypeId, eventId, accessLevel }
 */
export async function updateDocument(documentId, dto) {
  const response = await apiClient.put(`/api/documents/update/${documentId}`, dto);
  return response.data;
}

/**
 * Tải tài liệu về (trả về blob URL hoặc redirect)
 * GET /api/documents/download/{documentId}
 */
export async function downloadDocument(documentId) {
  const response = await apiClient.get(`/api/documents/download/${documentId}`, {
    responseType: 'blob',
  });
  return response;
}

/**
 * Xóa tài liệu
 * DELETE /api/documents/delete/{documentId}
 */
export async function deleteDocument(documentId) {
  const response = await apiClient.delete(`/api/documents/delete/${documentId}`);
  return response.data;
}
