import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';

const ICONS = {
  success: 'ti-check',
  error: 'ti-x',
  info: 'ti-info-circle',
  warning: 'ti-alert-triangle'
};

const BORDER_COLORS = {
  success: '#4ade80',
  error: '#f87171',
  info: '#60a5fa',
  warning: '#fbbf24'
};

function Toast({ toast }) {
  const removeToast = useStore(state => state.removeToast);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const duration = toast.type === 'error' ? 4000 : 3000;
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.type]);

  useEffect(() => {
    if (isClosing) {
      const cleanup = setTimeout(() => {
        removeToast(toast.id);
      }, 200);
      return () => clearTimeout(cleanup);
    }
  }, [isClosing, removeToast, toast.id]);

  const borderColor = BORDER_COLORS[toast.type] || BORDER_COLORS.info;
  const iconClass = ICONS[toast.type] || ICONS.info;

  return (
    <div 
      className={`toast-item ${isClosing ? 'toast-closing' : 'toast-entering'}`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="toast-content">
        <i className={`ti ${iconClass}`} style={{ color: borderColor }}></i>
        <span className="toast-message monospace text-11">{toast.message}</span>
        <button className="toast-close" onClick={() => setIsClosing(true)}>
          <i className="ti ti-x"></i>
        </button>
      </div>
      <div className="toast-progress">
        <div 
          className={`toast-progress-bar ${isClosing ? 'paused' : ''}`}
          style={{ backgroundColor: borderColor }}
        ></div>
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useStore(state => state.toasts);

  return (
    <div className="toast-container">
      {[...toasts].reverse().map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
