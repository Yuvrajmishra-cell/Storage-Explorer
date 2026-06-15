import React, { useEffect } from 'react';
import './IdbAdminModals.css';

export default function IdbDeleteStoreModal({ open, storeName, onClose, onConfirm, deleting }) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !deleting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, deleting]);

  if (!open || !storeName) return null;

  return (
    <div className="idb-admin-overlay" onClick={deleting ? undefined : onClose}>
      <div className="idb-admin-modal monospace idb-admin-modal-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="idb-admin-modal-title">Delete object store?</h2>
        <p className="idb-admin-modal-body">
          Delete object store <strong>{storeName}</strong>? This removes the store and all its records.
        </p>
        <div className="idb-admin-modal-actions">
          <button
            type="button"
            className="idb-admin-btn outline"
            onClick={onClose}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="idb-admin-btn danger-fill ready"
            disabled={deleting}
            onClick={() => onConfirm(storeName)}
          >
            {deleting ? 'Deleting…' : 'Delete store'}
          </button>
        </div>
      </div>
    </div>
  );
}
