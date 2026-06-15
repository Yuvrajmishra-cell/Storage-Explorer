import React, { useEffect, useState } from 'react';
import './IdbConnectModal.css';

export default function IdbConnectModal({
  open,
  onClose,
  onConnect,
  initialName = 'ExplorerDB',
  initialVersion = 1,
  connecting = false,
}) {
  const [dbName, setDbName] = useState(initialName);
  const [dbVersion, setDbVersion] = useState(String(initialVersion));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [existingDbs, setExistingDbs] = useState(null);
  const [databasesSupported, setDatabasesSupported] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDbName(initialName);
    setDbVersion(String(initialVersion));
    setAdvancedOpen(false);

    if (typeof indexedDB.databases === 'function') {
      setDatabasesSupported(true);
      indexedDB.databases()
        .then((dbs) => setExistingDbs(dbs))
        .catch(() => setExistingDbs([]));
    } else {
      setDatabasesSupported(false);
      setExistingDbs(null);
    }
  }, [open, initialName, initialVersion]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = () => {
    const name = dbName.trim();
    if (!name) return;
    const ver = Math.min(99, Math.max(1, parseInt(dbVersion, 10) || 1));
    onConnect(name, ver);
  };

  const handlePillClick = (name, version) => {
    setDbName(name);
    setDbVersion(String(version ?? 1));
  };

  return (
    <div className="idb-connect-overlay" onClick={onClose}>
      <div className="idb-connect-modal monospace" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="idb-connect-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="idb-connect-header">
          <i className="ti ti-database idb-connect-icon" />
          <div>
            <h2 className="idb-connect-title">Connect to IndexedDB</h2>
            <p className="idb-connect-subtitle">Open an existing database or create a new one</p>
          </div>
        </div>

        <div className="idb-connect-field">
          <label className="idb-connect-label" htmlFor="idb-connect-name">DATABASE NAME</label>
          <input
            id="idb-connect-name"
            type="text"
            className="idb-connect-input"
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            placeholder="e.g. MyAppDB"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <p className="idb-connect-helper">
            If this database doesn&apos;t exist, it will be created automatically.
          </p>
        </div>

        <div className="idb-connect-advanced-wrap">
          <button
            type="button"
            className="idb-connect-advanced-toggle"
            onClick={() => setAdvancedOpen(!advancedOpen)}
          >
            Advanced options {advancedOpen ? '▴' : '▾'}
          </button>
          {advancedOpen && (
            <div className="idb-connect-field idb-connect-advanced-panel">
              <label className="idb-connect-label" htmlFor="idb-connect-version">VERSION</label>
              <input
                id="idb-connect-version"
                type="number"
                min={1}
                max={99}
                className="idb-connect-input idb-connect-version-input"
                value={dbVersion}
                onChange={(e) => setDbVersion(e.target.value)}
              />
              <p className="idb-connect-helper">
                Only change this if you need to modify the database schema.
              </p>
            </div>
          )}
        </div>

        {databasesSupported && (
          <div className="idb-connect-existing">
            <h3 className="idb-connect-label">YOUR DATABASES</h3>
            {existingDbs === null ? (
              <p className="idb-connect-helper">Loading…</p>
            ) : existingDbs.length === 0 ? (
              <p className="idb-connect-helper">No existing databases found on this origin.</p>
            ) : (
              <div className="idb-connect-pills">
                {existingDbs.map((db) => (
                  <button
                    key={`${db.name}-${db.version}`}
                    type="button"
                    className={`idb-connect-pill${dbName === db.name ? ' selected' : ''}`}
                    onClick={() => handlePillClick(db.name, db.version)}
                  >
                    {db.name}
                    <span className="idb-connect-pill-version">v{db.version}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="idb-connect-actions">
          <button type="button" className="idb-connect-btn outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="idb-connect-btn filled"
            onClick={handleSubmit}
            disabled={!dbName.trim() || connecting}
          >
            Connect →
          </button>
        </div>
      </div>
    </div>
  );
}
