import React, { useState, useEffect, useRef } from 'react';

/**
 * Structured Vietnamese Date-Time Form Input Component.
 * - Format: Day / Month / Year  Hour : Minute (DD / MM / YYYY  HH : MM).
 * - No popup calendar table.
 * - Auto-advances focus between fields as user types smoothly.
 */
export default function VietnameseDateTimePicker({
  value,
  onChange,
  onBlur,
  disabled = false,
  error = false
}) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const hourRef = useRef(null);
  const minuteRef = useRef(null);
  const lastIsoRef = useRef('');

  // Sync state when external `value` prop (ISO string e.g. "2026-07-25T14:00") changes
  useEffect(() => {
    if (value && value !== lastIsoRef.current && typeof value === 'string' && value.includes('T')) {
      const [dPart, tPart] = value.split('T');
      if (dPart) {
        const [y, m, d] = dPart.split('-');
        if (y) setYear(y);
        if (m) setMonth(m);
        if (d) setDay(d);
      }
      if (tPart) {
        const [h, min] = tPart.split(':');
        if (h !== undefined) setHour(h.substring(0, 2));
        if (min !== undefined) setMinute(min.substring(0, 2));
      }
      lastIsoRef.current = value;
    } else if (!value && lastIsoRef.current !== '') {
      setDay('');
      setMonth('');
      setYear('');
      setHour('');
      setMinute('');
      lastIsoRef.current = '';
    }
  }, [value]);

  const updateCombinedValue = (d, m, y, h, min) => {
    if (!d && !m && !y && !h && !min) {
      lastIsoRef.current = '';
      if (onChange) onChange('');
      if (onBlur) onBlur('');
      return;
    }

    if (d && m && y && String(y).length === 4) {
      const dd = String(d).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const yyyy = String(y);
      const hh = h !== '' ? String(h).padStart(2, '0') : '00';
      const mi = min !== '' ? String(min).padStart(2, '0') : '00';

      const iso = `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
      lastIsoRef.current = iso;
      if (onChange) onChange(iso);
      if (onBlur) onBlur(iso);
    }
  };

  const handleDayChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val !== '' && Number(val) > 31) val = '31';
    setDay(val);
    updateCombinedValue(val, month, year, hour, minute);
    if (val.length === 2 && monthRef.current) {
      monthRef.current.focus();
    }
  };

  const handleMonthChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val !== '' && Number(val) > 12) val = '12';
    setMonth(val);
    updateCombinedValue(day, val, year, hour, minute);
    if (val.length === 2 && yearRef.current) {
      yearRef.current.focus();
    }
  };

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    updateCombinedValue(day, month, val, hour, minute);
    if (val.length === 4 && hourRef.current) {
      hourRef.current.focus();
    }
  };

  const handleHourChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val !== '' && Number(val) > 23) val = '23';
    setHour(val);
    updateCombinedValue(day, month, year, val, minute);
    if (val.length === 2 && minuteRef.current) {
      minuteRef.current.focus();
    }
  };

  const handleMinuteChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val !== '' && Number(val) > 59) val = '59';
    setMinute(val);
    updateCombinedValue(day, month, year, hour, val);
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
        placeholder="dd"
        value={day}
        onChange={handleDayChange}
        disabled={disabled}
        style={{
          width: '28px',
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
        placeholder="mm"
        value={month}
        onChange={handleMonthChange}
        onKeyDown={e => handleKeyDown(e, dayRef)}
        disabled={disabled}
        style={{
          width: '28px',
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
        placeholder="yyyy"
        value={year}
        onChange={handleYearChange}
        onKeyDown={e => handleKeyDown(e, monthRef)}
        disabled={disabled}
        style={{
          width: '42px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-main, #fff)',
          textAlign: 'center',
          fontSize: '13px',
          padding: 0
        }}
      />

      <span style={{ color: 'var(--text-muted, #888)', fontSize: '13px', margin: '0 6px', userSelect: 'none' }}>|</span>

      {/* Hour */}
      <input
        ref={hourRef}
        type="text"
        inputMode="numeric"
        placeholder="hh"
        value={hour}
        onChange={handleHourChange}
        onKeyDown={e => handleKeyDown(e, yearRef)}
        disabled={disabled}
        style={{
          width: '28px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-main, #fff)',
          textAlign: 'center',
          fontSize: '13px',
          padding: 0
        }}
      />
      <span style={{ color: 'var(--text-muted, #888)', fontSize: '13px', userSelect: 'none' }}>:</span>

      {/* Minute */}
      <input
        ref={minuteRef}
        type="text"
        inputMode="numeric"
        placeholder="mm"
        value={minute}
        onChange={handleMinuteChange}
        onKeyDown={e => handleKeyDown(e, hourRef)}
        disabled={disabled}
        style={{
          width: '28px',
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
