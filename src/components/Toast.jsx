import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  return (
    <div className={`toast-message toast-${type}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-text">{message}</span>
      <button className="toast-close-btn" onClick={onClose}>&times;</button>
    </div>
  );
}
