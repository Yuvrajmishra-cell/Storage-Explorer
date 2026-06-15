import React, { useEffect, useState } from 'react';
import './IdbAdminModals.css';

export default function IdbDeleteDatabaseModal({ open, dbName, onClose, onConfirm, deleting }) {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (open) setConfirmText('');
  }, [open, dbName]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !dbName) return null;

  const matches = confirmText === dbName;

  return (
    <div className="idb-admin-overlay" onClick={onClose}>
      <div className="idb-admin-modal monospace" onClick={(e) => e.stopPropagation()}>
        <div className="idb-delete-db-icon-wrap">
          <i className="ti ti-alert-triangle idb-delete-db-icon" />
        </div>
        <h2 className="idb-admin-modal-title">Delete database?</h2>
        <p className="idb-admin-modal-body">
          This will permanently delete <strong>{dbName}</strong> and all its object stores and records.
          This cannot be undone.
        </p>
        <span className="idb-delete-db-pill">{dbName}</span>
        <label className="idb-delete-db-confirm-label" htmlFor="idb-delete-db-confirm">
          Type <strong>{dbName}</strong> to confirm:
        </label>
        <input
          id="idb-delete-db-confirm"
          type="text"
          className="idb-delete-db-confirm-input"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoFocus
          spellCheck={false}
        />
        <div className="idb-admin-modal-actions">
          <button type="button" className="idb-admin-btn outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`idb-admin-btn danger-fill${matches ? ' ready' : ''}`}
            disabled={!matches || deleting}
            onClick={() => onConfirm(dbName)}
          >
            Delete permanently
          </button>
        </div>
      </div>
    </div>
  );
}
