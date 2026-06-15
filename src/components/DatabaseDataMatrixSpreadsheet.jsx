import React, { useState, useRef, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import {
  setEntry,
  removeEntry,
  refreshStorageData,
} from '../utils/storage';

function formatBytes(bytes) {
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

function truncate(str, max = 60) {
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

function getWebStorage(engine) {
  return engine === 'session' ? window.sessionStorage : window.localStorage;
}

/* ── Editable Value Cell ─────────────────────────────────── */

function ValueCell({ entryKey, value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    onSave(entryKey, draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="inline-edit monospace text-11"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
      />
    );
  }

  return (
    <span
      className="value-cell monospace text-11"
      onDoubleClick={() => setEditing(true)}
    >
      {truncate(value)}
    </span>
  );
}

/* ── Main Data Table ─────────────────────────────────────── */

export default function DatabaseDataMatrixSpreadsheet({ entries, onRefresh }) {
  const activeEngine = useStore((s) => s.activeEngine);
  const filterText = useStore((s) => s.filterText);
  const selectedKey = useStore((s) => s.selectedKey);
  const setSelectedKey = useStore((s) => s.setSelectedKey);
  const addLog = useStore((s) => s.addLog);
  const showToast = useStore((s) => s.showToast);

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');
  const [keyFocused, setKeyFocused] = useState(false);
  const errorTimerRef = useRef(null);

  const engineLabel = activeEngine === 'local' ? 'LOCAL' : 'SESSION';

  const showError = useCallback((message) => {
    setError(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(''), 3000);
  }, []);

  useEffect(() => () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
  }, []);

  const filtered = entries.filter((e) =>
    e.key.toLowerCase().includes(filterText.toLowerCase())
  );

  const syncAfterWrite = async () => {
    refreshStorageData(activeEngine);
    onRefresh();
    await useStore.getState().updateQuota();
  };

  const handleSave = async (key, value) => {
    try {
      const t0 = performance.now();
      setEntry(activeEngine, key, value);
      const ms = Math.round(performance.now() - t0);
      addLog(`[${engineLabel}] SET ${key} — ${ms}ms`);
      await syncAfterWrite();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (key) => {
    try {
      removeEntry(activeEngine, key);
      addLog(`[${engineLabel}] DELETE ${key}`);
      showToast(`Key "${key}" deleted`, 'info');
      if (selectedKey === key) setSelectedKey(null);
      await syncAfterWrite();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleAdd = async () => {
    const key = newKey.trim();
    const value = newValue.trim();

    if (!key) {
      showError('Key cannot be empty');
      return;
    }

    const storage = getWebStorage(activeEngine);
    if (storage.getItem(key) !== null) {
      showError(`Key "${key}" already exists. Edit it inline instead.`);
      return;
    }

    try {
      storage.setItem(key, value);
      const bytes = (key.length + value.length) * 2;
      addLog(`[${engineLabel}] SET ${key} — ${bytes} B`);
      showToast(`Key "${key}" added`, 'success');
      setNewKey('');
      setNewValue('');
      setError('');
      await syncAfterWrite();
    } catch (err) {
      showError(err.message);
      showToast(err.message, 'error');
    }
  };

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="matrix-wrapper">
      <div className="matrix-header monospace text-11">
        <span className="col-key">KEY</span>
        <span className="col-value">VALUE</span>
        <span className="col-bytes">SIZE</span>
        <span className="col-actions">⚙</span>
      </div>

      <div className="matrix-body">
        {filtered.length === 0 && (
          <div className="matrix-empty monospace text-11">
            {entries.length === 0 ? 'Storage is empty' : 'No keys match filter'}
          </div>
        )}

        {filtered.map((entry, idx) => (
          <div
            key={entry.key}
            id={`row-${CSS.escape(entry.key)}`}
            className={`matrix-row${selectedKey === entry.key ? ' row-selected' : ''} ${idx % 2 === 0 ? 'even-row' : 'odd-row'}`}
            onClick={() => setSelectedKey(entry.key)}
          >
            <span className="col-key monospace text-11">{entry.key}</span>
            <span className="col-value" title={entry.value}>
              <ValueCell entryKey={entry.key} value={entry.value} onSave={handleSave} />
            </span>
            <span className="col-bytes monospace text-11 muted">{formatBytes(entry.bytes)}</span>
            <span className="col-actions">
              <button
                type="button"
                className="delete-btn monospace text-11"
                title={`Delete "${entry.key}"`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(entry.key);
                }}
              >
                ✕
              </button>
            </span>
          </div>
        ))}
      </div>

      <div className="matrix-add-form">
        {keyFocused && (
          <p className="matrix-add-hint monospace text-11 muted">Press Enter to add</p>
        )}
        <div className="matrix-add-row">
          <input
            type="text"
            className="input-minimal monospace text-11 add-key"
            placeholder="Enter key name…"
            value={newKey}
            onChange={(e) => {
              setNewKey(e.target.value);
              if (error) setError('');
            }}
            onFocus={() => setKeyFocused(true)}
            onBlur={() => setKeyFocused(false)}
            onKeyDown={handleAddKeyDown}
          />
          <input
            type="text"
            className="input-minimal monospace text-11 add-value"
            placeholder="Enter value…"
            value={newValue}
            onChange={(e) => {
              setNewValue(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={handleAddKeyDown}
          />
          <button type="button" className="matrix-add-submit-btn monospace text-11" onClick={handleAdd}>
            ADD
          </button>
        </div>
        {error && (
          <p className="matrix-add-error monospace text-11">{error}</p>
        )}
      </div>
    </div>
  );
}
