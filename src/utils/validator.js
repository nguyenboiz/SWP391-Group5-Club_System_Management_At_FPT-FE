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
  // Normalize space to 'T' if it's like YYYY-MM-DD HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(str)) {
    str = str.replace(/\s+/, 'T');
  }
  // Backend returns UTC timestamps without 'Z' suffix — append it so JS parses correctly as UTC
  if (str.includes('T') && !str.includes('Z') && !/[+-]\d{2}:?\d{2}$/.test(str)) {
    str += 'Z';
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
  // If it's already a datetime-local string (like "2026-07-21T13:23"), normalize it
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)) {
    return dateInput + ':00';
  }
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  const pad = (num) => String(num).padStart(2, '0');
  
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
};

