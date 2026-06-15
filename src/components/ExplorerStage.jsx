import React, { useState, useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import { refreshStorageData, runRelationInference, exportStorageData } from '../utils/storage';
import SchemaObjectTreeNavigator from './SchemaObjectTreeNavigator';
import DatabaseDataMatrixSpreadsheet from './DatabaseDataMatrixSpreadsheet';
import IdbDataMatrix from './IdbDataMatrix';
import { IdbLeftEmptyState, IdbRightEmptyState } from './IdbEmptyState';
import { normalizeIdbRecords } from '../utils/idbRecords';

export default function ExplorerStage() {
  const activeEngine = useStore((s) => s.activeEngine);
  const setCurrentStoreData = useStore((s) => s.setCurrentStoreData);
  const dbConnection = useStore((s) => s.dbConnection);
  const currentStore = useStore((s) => s.currentStore);
  const addLog = useStore((s) => s.addLog);
  const showToast = useStore((s) => s.showToast);
  const currentStoreData = useStore((s) => s.currentStoreData);
  const panelWidth = useStore((s) => s.panelWidth);
  const setPanelWidth = useStore((s) => s.setPanelWidth);
  const refreshTrigger = useStore((s) => s.refreshTrigger);
  const idbStoreCounts = useStore((s) => s.idbStoreCounts);
  const setIdbStoreCounts = useStore((s) => s.setIdbStoreCounts);
  const idbStores = useStore((s) => s.idbStores);
  const triggerRefresh = useStore((s) => s.triggerRefresh);

  const [entries, setEntries] = useState([]);
  const isResizing = React.useRef(false);

  const startResize = useCallback((e) => {
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      let newW = e.clientX;
      if (newW < 180) newW = 180;
      if (newW > 400) newW = 400;
      setPanelWidth(newW);
    };
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setPanelWidth]);

  const refreshWebStorage = useCallback(() => {
    if (activeEngine === 'local' || activeEngine === 'session') {
      const data = refreshStorageData(activeEngine);
      setEntries(data);
      void useStore.getState().updateQuota();
    } else {
      setEntries([]);
    }
  }, [activeEngine]);

  useEffect(() => { refreshWebStorage(); }, [refreshWebStorage, refreshTrigger]);

  useEffect(() => {
    void useStore.getState().updateQuota();
  }, [activeEngine]);

  useEffect(() => {
    void runRelationInference();
  }, [currentStoreData, activeEngine, dbConnection, idbStores, refreshTrigger]);

  useEffect(() => {
    if (activeEngine !== 'indexeddb' || !dbConnection || !currentStore) return;

    let cancelled = false;
    const load = async () => {
      try {
        const t0 = performance.now();
        const data = await dbConnection.getAll(currentStore);
        const ms = Math.round(performance.now() - t0);
        if (!cancelled) {
          const normalized = normalizeIdbRecords(data);
          setCurrentStoreData(normalized);
          addLog(`[IDB] GETALL "${currentStore}" (${data.length} rows) — ${ms}ms`);
          await useStore.getState().updateQuota();
          await runRelationInference();
        }

        const count = await dbConnection.getCount(currentStore);
        if (!cancelled) {
          setIdbStoreCounts({ ...idbStoreCounts, [currentStore]: count });
        }
      } catch (err) {
        if (!cancelled) {
          addLog(`[ERROR] IDB GETALL FAILED: ${err.message}`);
          showToast(err.message, 'error');
        }
      }
    };
    load();

    return () => { cancelled = true; };
  }, [activeEngine, dbConnection, currentStore, refreshTrigger]);

  const isWebStorage = activeEngine === 'local' || activeEngine === 'session';
  const isIdb = activeEngine === 'indexeddb';
  const engineLabel = activeEngine === 'local'
    ? 'localStorage'
    : activeEngine === 'session'
      ? 'sessionStorage'
      : 'IndexedDB';

  const idbHeaderTitle = isIdb && dbConnection && currentStore
    ? `${engineLabel} › ${currentStore}`
    : isIdb && dbConnection
      ? `${engineLabel} › ${dbConnection.dbName}`
      : engineLabel;

  const idbRecordLabel = isIdb && dbConnection && currentStore
    ? `${normalizeIdbRecords(currentStoreData).length} records`
    : '';

  const renderPanelTitle = () => {
    if (isIdb && dbConnection && currentStore) {
      return (
        <h3 className="ui-chrome-text text-11 panel-breadcrumb">
          <span className="breadcrumb-engine">{engineLabel}</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-db">{dbConnection.dbName}</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-store">{currentStore}</span>
        </h3>
      );
    }
    if (isIdb && dbConnection) {
      return (
        <h3 className="ui-chrome-text text-11 panel-breadcrumb">
          <span className="breadcrumb-engine">{engineLabel}</span>
          <span className="breadcrumb-sep">›</span>
          <span className="breadcrumb-db">{dbConnection.dbName}</span>
        </h3>
      );
    }
    return <h3 className="ui-chrome-text text-11">{idbHeaderTitle}</h3>;
  };

  const handleExport = () => {
    exportStorageData(activeEngine, dbConnection);
  };

  return (
    <div className="explorer-stage">
      <aside className="panel-left" style={{ width: panelWidth }}>
        <div className="panel-header">
          <h3 className="ui-chrome-text text-11">
            {isIdb ? 'STORES' : 'KEYS'}
          </h3>
          {isWebStorage && (
            <button className="refresh-btn monospace text-11" onClick={refreshWebStorage} title="Refresh">
              ↺
            </button>
          )}
        </div>

        {isWebStorage && <SchemaObjectTreeNavigator entries={entries} />}
        {isIdb && dbConnection && <SchemaObjectTreeNavigator entries={[]} />}
        {isIdb && !dbConnection && <IdbLeftEmptyState />}
        {!isWebStorage && !isIdb && (
          <p className="monospace placeholder text-11" style={{ padding: '12px' }}>Select an engine</p>
        )}
      </aside>

      <div className="resize-handle" onMouseDown={startResize} />

      <main className="panel-right">
        <div className="panel-header panel-header-with-actions">
          {renderPanelTitle()}
          <div className="panel-header-actions">
            {isWebStorage && (
              <span className="entry-count monospace text-11">{entries.length} entries</span>
            )}
            {idbRecordLabel && (
              <span className="entry-count-wrap monospace text-11">
                <span className="entry-count">{idbRecordLabel}</span>
                <button
                  type="button"
                  className="entry-export-btn"
                  title="Export storage"
                  onClick={handleExport}
                >
                  <i className="ti ti-download" />
                </button>
              </span>
            )}
            {isIdb && dbConnection && (
              <button
                type="button"
                className="panel-refresh-btn monospace text-11"
                onClick={triggerRefresh}
                title="Refresh store"
              >
                ↺
              </button>
            )}
          </div>
        </div>

        {isWebStorage && (
          <DatabaseDataMatrixSpreadsheet entries={entries} onRefresh={refreshWebStorage} />
        )}
        {isIdb && dbConnection && <IdbDataMatrix />}
        {isIdb && !dbConnection && <IdbRightEmptyState />}

        {!isWebStorage && !isIdb && (
          <div className="empty-state-banner monospace">
            <h3 className="text-11">NO ENGINE CONNECTED</h3>
            <p className="text-11 muted">Select LocalStorage, SessionStorage, or connect to IndexedDB.</p>
          </div>
        )}
      </main>
    </div>
  );
}
