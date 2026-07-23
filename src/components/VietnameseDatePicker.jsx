import React, { useState, useEffect, useRef } from 'react';

/**
 * Structured Vietnamese Date Form Input Component (Date Only: DD/MM/YYYY).
 * - Displays: Ngày / Tháng / Năm (DD / MM / YYYY).
 * - Auto-advances focus between day -> month -> year as user types.
 * - Value format: YYYY-MM-DD (ISO date format for standard input compatibility).
 */
export default function VietnameseDatePicker({
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false,
  placeholder = 'dd/mm/yyyy'
}) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const lastIsoRef = useRef('');

  // Sync state when external `value` prop (e.g. "2026-07-25" or "2026-07-25T00:00:00") changes
  useEffect(() => {
    if (value && value !== lastIsoRef.current && typeof value === 'string') {
      const cleanDate = value.split('T')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        setYear(y);
        setMonth(m);
        setDay(d);
        lastIsoRef.current = cleanDate;
      }
    } else if (!value && lastIsoRef.current !== '') {
      setDay('');
      setMonth('');
      setYear('');
      lastIsoRef.current = '';
    }
  }, [value]);

  const updateCombinedValue = (d, m, y) => {
    if (!d && !m && !y) {
      lastIsoRef.current = '';
      if (onChange) onChange('');
      if (onBlur) onBlur('');
      return;
    }

    if (d && m && y && String(y).length === 4) {
      const dd = String(d).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const yyyy = String(y);

      const isoDate = `${yyyy}-${mm}-${dd}`;
      lastIsoRef.current = isoDate;
      if (onChange) onChange(isoDate);
      if (onBlur) onBlur(isoDate);
    }
  };

  const handleDayChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val !== '' && Number(val) > 31) val = '31';
    setDay(val);
    updateCombinedValue(val, month, year);
    if (val.length === 2 && monthRef.current) {
      monthRef.current.focus();
    }
  };

  const handleMonthChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val !== '' && Number(val) > 12) val = '12';
    setMonth(val);
    updateCombinedValue(day, val, year);
    if (val.length === 2 && yearRef.current) {
      yearRef.current.focus();
    }
  };

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    updateCombinedValue(day, month, val);
  };

  const handleKeyDown = (e, prevRef) => {
    if (e.key === 'Backspace' && !e.target.value && prevRef && prevRef.current) {
      prevRef.current.focus();
    }
  };

  return (
    <div
      className="input-field"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 12px',
        borderColor: error ? 'var(--error, #ef4444)' : undefined,
        cursor: disabled ? 'not-allowed' : 'text',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Day */}
      <input
        ref={dayRef}
        type="text"
        inputMode="numeric"
        placeholder="Ngày (dd)"
        value={day}
        onChange={handleDayChange}
        disabled={disabled}
        style={{
          width: '60px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-main, #fff)',
          textAlign: 'center',
          fontSize: '13px',
          padding: 0
        }}
      />
      <span style={{ color: 'var(--text-muted, #888)', fontSize: '13px', userSelect: 'none' }}>/</span>

      {/* Month */}
      <input
        ref={monthRef}
        type="text"
        inputMode="numeric"
        placeholder="Tháng (mm)"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={e => handleKeyDown(e, dayRef)}
        disabled={disabled}
        style={{
          width: '70px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-main, #fff)',
          textAlign: 'center',
          fontSize: '13px',
          padding: 0
        }}
      />
      <span style={{ color: 'var(--text-muted, #888)', fontSize: '13px', userSelect: 'none' }}>/</span>

      {/* Year */}
      <input
        ref={yearRef}
        type="text"
        inputMode="numeric"
        placeholder="Năm (yyyy)"
        value={year}
        onChange={handleYearChange}
        onKeyDown={e => handleKeyDown(e, monthRef)}
        disabled={disabled}
        style={{
          width: '70px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-main, #fff)',
          textAlign: 'center',
          fontSize: '13px',
          padding: 0
        }}
      />
    </div>
  );
}
