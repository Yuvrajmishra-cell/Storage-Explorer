import { useState, useRef, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import UpgradePrompt from './UpgradePrompt';
import { usePlan } from '../plan/usePlan';
import {
  generateColumns,
  normalizeIdbRecords,
  buildRecordTemplate,
  recordHasKeyField,
} from '../utils/idbRecords';

function getRecordKey(record, storeKeyPath, columns) {
  if (storeKeyPath && record[storeKeyPath] !== undefined) {
    return record[storeKeyPath];
  }
  for (const k of ['id', '_id', 'key']) {
    if (record[k] !== undefined) return record[k];
  }
  if (columns.length > 0) return record[columns[0]];
  return undefined;
}

function AddRecordModal({
  open,
  storeName,
  storeInfo,
  dbConnection,
  records,
  onClose,
  onSubmit,
  submitting,
}) {
  const [jsonText, setJsonText] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  const keyPathLabel = storeInfo.autoIncrement
    ? 'auto-increment'
    : storeInfo.keyPath || 'id';

  useEffect(() => {
    if (!open || !dbConnection || !storeName) return;
    let cancelled = false;
    setLoadingTemplate(true);
    setValidationError('');
    setSubmitError('');

    buildRecordTemplate(dbConnection, storeName, storeInfo, records)
      .then((template) => {
        if (!cancelled) {
          setJsonText(template);
          setLoadingTemplate(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJsonText('{\n  "name": "example"\n}');
          setLoadingTemplate(false);
        }
      });

    return () => { cancelled = true; };
  }, [open, storeName, storeInfo, dbConnection, records]);

  if (!open) return null;

  const handleSubmit = async () => {
    setValidationError('');
    setSubmitError('');

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setValidationError('Invalid JSON — check syntax and try again.');
      return;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      setValidationError('Record must be a JSON object.');
      return;
    }

    if (!recordHasKeyField(parsed, storeInfo.keyPath, storeInfo.autoIncrement)) {
      setValidationError(`Record must include the key field: '${storeInfo.keyPath}'`);
      return;
    }

    try {
      await onSubmit(parsed);
    } catch (err) {
      setSubmitError(err.message || String(err));
    }
  };

  return (
    <div className="idb-add-modal-overlay" onClick={onClose}>
      <div className="idb-add-modal monospace" onClick={(e) => e.stopPropagation()}>
        <h3 className="idb-add-modal-title">Add record to {storeName}</h3>

        <div className="idb-add-modal-keypath">
          <span className="idb-add-modal-keypath-label">Key path:</span>
          <span className="idb-add-modal-keypath-pill">{keyPathLabel}</span>
        </div>

        <textarea
          className="idb-add-modal-textarea text-11"
          value={jsonText}
          disabled={loadingTemplate}
          onChange={(e) => {
            setJsonText(e.target.value);
            setValidationError('');
            setSubmitError('');
          }}
          spellCheck={false}
        />

        {validationError && (
          <p className="idb-add-modal-error">{validationError}</p>
        )}
        {submitError && (
          <p className="idb-add-modal-error">{submitError}</p>
        )}

        <div className="idb-add-modal-actions">
          <button type="button" className="idb-add-modal-btn outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="idb-add-modal-btn filled"
            onClick={handleSubmit}
            disabled={submitting || loadingTemplate}
          >
            Add record
          </button>
        </div>
      </div>
    </div>
  );
}

function IdbCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''));
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    setDraft(typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''));
  }, [value]);

  const commit = () => {
    let parsed;
    try { parsed = JSON.parse(draft); }
    catch { parsed = draft; }
    onSave(parsed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(typeof value === 'object' ? JSON.stringify(value) : String(value ?? ''));
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') cancel();
  };

  const display = value === undefined || value === null
    ? '—'
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

  const isEmpty = value === undefined || value === null;

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
      className={`value-cell monospace text-11${isEmpty ? ' muted' : ''}`}
      onDoubleClick={() => setEditing(true)}
    >
      {display.length > 60 ? display.slice(0, 60) + '…' : display}
    </span>
  );
}

export default function IdbDataMatrix() {
  const dbConnection = useStore((s) => s.dbConnection);
  const currentStore = useStore((s) => s.currentStore);
  const currentStoreData = useStore((s) => s.currentStoreData);
  const addLog = useStore((s) => s.addLog);
  const showToast = useStore((s) => s.showToast);
  const filterText = useStore((s) => s.filterText);
  const selectedKey = useStore((s) => s.selectedKey);
  const setSelectedKey = useStore((s) => s.setSelectedKey);
  const triggerRefresh = useStore((s) => s.triggerRefresh);
  const { isPro, freeLimits } = usePlan();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const normalizedData = useMemo(
    () => normalizeIdbRecords(currentStoreData),
    [currentStoreData]
  );

  const storeInfo = useMemo(() => {
    if (!dbConnection || !currentStore) {
      return { keyPath: 'id', autoIncrement: false };
    }
    return dbConnection.getObjectStoreInfo(currentStore);
  }, [dbConnection, currentStore]);

  const columns = useMemo(() => generateColumns(normalizedData), [normalizedData]);

  const filteredData = normalizedData.filter((record) => {
    if (!filterText) return true;
    const lower = filterText.toLowerCase();
    return columns.some((col) => {
      const v = record[col];
      return v !== undefined && String(v).toLowerCase().includes(lower);
    });
  });

  const recordLimit = freeLimits.recordsPerStore;
  const isRecordLimited = !isPro && filteredData.length > recordLimit;
  const visibleData = isRecordLimited
    ? filteredData.slice(0, recordLimit)
    : filteredData;

  const handleCellSave = async (record, colName, newValue) => {
    if (!dbConnection || !currentStore) return;
    const updated = { ...record, [colName]: newValue };

    if (!recordHasKeyField(updated, storeInfo.keyPath, storeInfo.autoIncrement)) {
      showToast(`Record must include the key field: '${storeInfo.keyPath}'`, 'error');
      return;
    }

    try {
      const t0 = performance.now();
      await dbConnection.put(currentStore, updated);
      const ms = Math.round(performance.now() - t0);
      addLog(`[IDB] UPDATE "${currentStore}" — ${ms}ms`);
      await useStore.getState().updateQuota();
      triggerRefresh();
    } catch (err) {
      addLog(`[ERROR] IDB UPDATE FAILED: ${err.message}`);
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (record) => {
    if (!dbConnection || !currentStore) return;
    const key = getRecordKey(record, storeInfo.keyPath, columns);
    if (key === undefined) {
      showToast('Cannot determine primary key for deletion', 'error');
      return;
    }
    try {
      const t0 = performance.now();
      await dbConnection.delete(currentStore, key);
      const ms = Math.round(performance.now() - t0);
      addLog(`[IDB] DELETE "${currentStore}" key=${key} — ${ms}ms`);
      await useStore.getState().updateQuota();
      triggerRefresh();
    } catch (err) {
      addLog(`[ERROR] IDB DELETE FAILED: ${err.message}`);
      showToast(err.message, 'error');
    }
  };

  const handleAddRecord = async (record) => {
    if (!dbConnection || !currentStore) return;
    setAddSubmitting(true);
    try {
      const t0 = performance.now();
      await dbConnection.put(currentStore, record);
      const ms = Math.round(performance.now() - t0);
      addLog(`[IDB] ADD "${currentStore}" — ${ms}ms`);
      await useStore.getState().updateQuota();
      setAddModalOpen(false);
      triggerRefresh();
      showToast('Record added successfully', 'success');
    } catch (err) {
      addLog(`[ERROR] IDB ADD FAILED: ${err.message}`);
      throw err;
    } finally {
      setAddSubmitting(false);
    }
  };

  if (!currentStore) {
    return (
      <div className="matrix-empty monospace text-11">
        Select an object store from the left panel
      </div>
    );
  }

  const colTemplate = columns.length > 0
    ? columns.map(() => '1fr').join(' ') + ' 40px'
    : '1fr 40px';

  return (
    <div className="matrix-wrapper idb-matrix-wrapper">
      <AddRecordModal
        open={addModalOpen}
        storeName={currentStore}
        storeInfo={storeInfo}
        dbConnection={dbConnection}
        records={normalizedData}
        submitting={addSubmitting}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddRecord}
      />

      {isRecordLimited && (
        <UpgradePrompt
          variant="banner"
          feature="records"
          message={`Showing ${recordLimit} of ${filteredData.length} records — upgrade to Pro to view all.`}
        />
      )}

      {columns.length > 0 && (
        <div className="idb-matrix-header monospace text-11" style={{ gridTemplateColumns: colTemplate }}>
          {columns.map((col) => (
            <span key={col} className="idb-col-header">{col}</span>
          ))}
          <span className="idb-col-header idb-col-actions">⚙</span>
        </div>
      )}

      <div className="matrix-body">
        {visibleData.length === 0 && (
          <div className="matrix-empty monospace text-11">
            {normalizedData.length === 0 ? 'Store is empty — add a record below' : 'No records match filter'}
          </div>
        )}

        {visibleData.map((record, idx) => {
          const pk = getRecordKey(record, storeInfo.keyPath, columns);
          const isSelected = selectedKey === pk;
          return (
            <div
              key={`${pk ?? 'row'}-${idx}`}
              className={`idb-matrix-row ${isSelected ? 'row-selected' : ''} ${idx % 2 === 0 ? 'even-row' : 'odd-row'}`}
              style={{ gridTemplateColumns: colTemplate }}
              onClick={() => setSelectedKey(pk)}
            >
              {columns.map((col) => {
                const cellValue = record[col];
                const cellDisplay = cellValue === undefined || cellValue === null
                  ? '—'
                  : typeof cellValue === 'object'
                    ? JSON.stringify(cellValue)
                    : String(cellValue);
                return (
                  <span key={col} className="idb-cell" title={cellDisplay}>
                    <IdbCell
                      value={cellValue}
                      onSave={(newVal) => handleCellSave(record, col, newVal)}
                    />
                  </span>
                );
              })}
              <span className="col-actions">
                <button
                  type="button"
                  className="delete-btn monospace text-11"
                  title="Delete record"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record);
                  }}
                >
                  ✕
                </button>
              </span>
            </div>
          );
        })}
      </div>

      <div className="idb-add-form-bar">
        <button
          type="button"
          className="idb-add-record-btn monospace text-11"
          onClick={() => setAddModalOpen(true)}
        >
          + Add Record
        </button>
        <span className="idb-add-form-hint monospace text-11 muted">
          Double-click any cell to edit · Enter to save
        </span>
      </div>
    </div>
  );
}
