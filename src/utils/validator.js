/**
 * Common Validation Helpers for Client Side Forms
 */

/**
 * Checks if a string contains special/suspicious characters.
 * Allows Unicode letters (Vietnamese), numbers, whitespace, and basic punctuation: - , . ( ) / + ? ! : # ' " @ _ &
 */
export const validateNoSpecialChars = (text) => {
  if (!text) return true;
  // Allow letters, digits, spaces, and basic punctuation: - . , ( ) / + ? ! : # $ ' " @ _ &
  const regex = /^[\p{L}\p{N}\s\-.,()\/+?!:#$'"@_&]*$/u;
  return regex.test(text);
};

/**
 * Validates a basic email address format
 */
export const validateEmail = (email) => {
  if (!email) return true;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Checks if the given date string/object is in the future
 */
export const validateDateInFuture = (dateVal) => {
  if (!dateVal) return true;
  const d = new Date(dateVal);
  const now = new Date();
  // Strip seconds/milliseconds for fair comparison
  now.setSeconds(0, 0);
  d.setSeconds(0, 0);
  return d >= now;
};

/**
 * Validates standard phone numbers
 */
export const validatePhone = (phone) => {
  if (!phone) return true;
  // Standard Vietnamese phone number format: starts with 0, total 10 digits
  const regex = /^(0[3|5|7|8|9])[0-9]{8}$/;
  return regex.test(phone);
};

/**
 * Safely parses a date string from the backend.
 * If the string has no timezone info (no Z, no +HH:MM), treats it as Vietnam time (UTC+7).
 * This prevents incorrect time display when backend returns timestamps without timezone suffix.
 * @param {string|null|undefined} dateStr
 * @returns {Date}
 */
export const parseDateVN = (dateStr) => {
  if (!dateStr) return new Date(0);
  let str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
    str = str.replace(/\s+/, 'T');
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date(0) : d;
};

/**
 * Formats a Date object or local datetime string into a local ISO string (YYYY-MM-DDTHH:mm:ss)
 * without timezone shift.
 * @param {Date|string} dateInput
 * @returns {string}
 */
export const toLocalISOString = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateInput)) {
    const [dPart, tPart] = dateInput.split('T');
    const [y, m, d] = dPart.split('-').map(Number);
    const [h, min] = tPart.split(':').map(Number);
    const dateObj = new Date(y, m - 1, d, h, min, 0);
    return dateObj.toISOString();
  }
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
};

/**
 * Formats a Date object or date string into DD/MM/YYYY HH:mm format (Vietnamese standard: Ngày/Tháng/Năm Giờ:Phút).
 * @param {Date|string|null|undefined} dateInput
 * @param {boolean} includeTime whether to include HH:mm
 * @returns {string}
 */
export const formatDateVN = (dateInput, includeTime = true) => {
  if (!dateInput) return '';

  if (dateInput instanceof Date || typeof dateInput === 'number') {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const pad = (num) => String(num).padStart(2, '0');
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1);
    const yyyy = date.getFullYear();
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return includeTime ? `${dd}/${mm}/${yyyy} ${hh}:${min}` : `${dd}/${mm}/${yyyy}`;
  }

  // If dateInput is string containing Z or timezone offset (e.g. "2026-07-25T05:00:00Z")
  if (typeof dateInput === 'string' && (dateInput.includes('Z') || /[+-]\d{2}:?\d{2}$/.test(dateInput.trim()))) {
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      const pad = (num) => String(num).padStart(2, '0');
      const dd = pad(date.getDate());
      const mm = pad(date.getMonth() + 1);
      const yyyy = date.getFullYear();
      const hh = pad(date.getHours());
      const min = pad(date.getMinutes());
      return includeTime ? `${dd}/${mm}/${yyyy} ${hh}:${min}` : `${dd}/${mm}/${yyyy}`;
    }
  }

  // If dateInput is a local ISO datetime string without timezone (e.g. "2026-07-25T12:00:00" or "2026-07-25 12:00")
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput.trim())) {
    const [dPart, tPart] = dateInput.trim().split(/[T\s]+/);
    const [yyyy, mm, dd] = dPart.split('-');
    const timeClean = tPart ? tPart.substring(0, 5) : '00:00';
    return includeTime ? `${dd}/${mm}/${yyyy} ${timeClean}` : `${dd}/${mm}/${yyyy}`;
  }

  return '';
};

