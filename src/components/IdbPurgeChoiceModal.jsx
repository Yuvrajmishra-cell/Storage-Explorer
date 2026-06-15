import React, { useEffect } from 'react';
import './IdbAdminModals.css';

export default function IdbPurgeChoiceModal({ open, dbName, onClose, onClearAll, onDeleteDatabase }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="idb-admin-overlay" onClick={onClose}>
      <div className="idb-admin-modal monospace idb-admin-modal-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="idb-admin-modal-title">Purge IndexedDB</h2>
        <p className="idb-admin-modal-body">
          Choose how to purge <strong>{dbName || 'this database'}</strong>:
        </p>
        <div className="idb-purge-choice-list">
          <button type="button" className="idb-purge-choice-btn" onClick={onClearAll}>
            Clear all records
            <span className="idb-purge-choice-desc">Keeps object stores and database structure</span>
          </button>
          <button type="button" className="idb-purge-choice-btn danger" onClick={onDeleteDatabase}>
            Delete entire database
            <span className="idb-purge-choice-desc">Permanently removes the database</span>
          </button>
          <button type="button" className="idb-purge-choice-btn muted" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
