import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useStore from '../store/useStore';
import IDBWrapper from '../utils/IDBWrapper';
import { purgeAll, exportStorageData, runRelationInference } from '../utils/storage';
import { deleteDatabase } from '../utils/idbAdmin';
import IdbConnectModal from './IdbConnectModal';
import IdbDeleteDatabaseModal from './IdbDeleteDatabaseModal';
import IdbPurgeChoiceModal from './IdbPurgeChoiceModal';
import ThemeToggle from './ThemeToggle';

function StorageTargetActionStrip() {
  const activeEngine = useStore((s) => s.activeEngine);
  const setActiveEngine = useStore((s) => s.setActiveEngine);
  const dbConnection = useStore((s) => s.dbConnection);
  const setDbConnection = useStore((s) => s.setDbConnection);
  const setIdbStores = useStore((s) => s.setIdbStores);
  const setIdbStoreCounts = useStore((s) => s.setIdbStoreCounts);
  const addLog = useStore((s) => s.addLog);
  const showToast = useStore((s) => s.showToast);

  const lastDbName = useStore((s) => s.lastDbName);
  const setLastDbName = useStore((s) => s.setLastDbName);
  const setLastIdbVersion = useStore((s) => s.setLastIdbVersion);
  const setCurrentStore = useStore((s) => s.setCurrentStore);
  const setCurrentStoreData = useStore((s) => s.setCurrentStoreData);
  const setLastStoreName = useStore((s) => s.setLastStoreName);
  const triggerRefresh = useStore((s) => s.triggerRefresh);
  const defaultIdbVersion = useStore((s) => s.defaultIdbVersion);
  const idbConnectModalOpen = useStore((s) => s.idbConnectModalOpen);
  const closeIdbConnectModal = useStore((s) => s.closeIdbConnectModal);
  const openIdbConnectModal = useStore((s) => s.openIdbConnectModal);

  const [connectOpen, setConnectOpen] = useState(false);
  const [idbConnecting, setIdbConnecting] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState(false);
  const [idbPurgeOpen, setIdbPurgeOpen] = useState(false);
  const [deleteDbOpen, setDeleteDbOpen] = useState(false);
  const [deletingDb, setDeletingDb] = useState(false);
  const [showConnectPulse, setShowConnectPulse] = useState(false);

  useEffect(() => {
    if (!activeEngine) {
      setShowConnectPulse(false);
      return;
    }
    setShowConnectPulse(true);
    const timer = setTimeout(() => setShowConnectPulse(false), 3000);
    return () => clearTimeout(timer);
  }, [activeEngine]);

  const [idbName, setIdbName] = useState(lastDbName || 'ExplorerDB');
  const [idbVersion, setIdbVersion] = useState(defaultIdbVersion || 1);

  // New Store dialog
  const [newStoreOpen, setNewStoreOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreKeyPath, setNewStoreKeyPath] = useState('id');
  const [newStoreAutoIncrement, setNewStoreAutoIncrement] = useState(false);

  const newStorePreview = newStoreAutoIncrement
    ? 'Keys will be auto-generated (1, 2, 3…)'
    : `Records will need a field named '${newStoreKeyPath.trim() || 'id'}'`;

  /* ── purge timer ─────────────────────────────────────── */
  useEffect(() => {
    let timer;
    if (purgeConfirm) timer = setTimeout(() => setPurgeConfirm(false), 2000);
    return () => clearTimeout(timer);
  }, [purgeConfirm]);

  /* ── helpers ─────────────────────────────────────────── */

  /** Refresh the store list + counts from an open IDBWrapper */
  const refreshIdbMeta = async (wrapper) => {
    const names = wrapper.getObjectStores();
    setIdbStores(names);
    const counts = {};
    for (const name of names) {
      try { counts[name] = await wrapper.getCount(name); }
      catch { counts[name] = '?'; }
    }
    setIdbStoreCounts(counts);
  };

  /* ── connect handlers ────────────────────────────────── */

  const connectLocal = () => {
    setActiveEngine('local');
    addLog('[LOCAL] Connected');
    showToast('Connected to Local Storage', 'success');
    setConnectOpen(false);
  };

  const connectSession = () => {
    setActiveEngine('session');
    addLog('[SESSION] Connected');
    showToast('Connected to Session Storage', 'success');
    setConnectOpen(false);
  };

  const openIdbModal = () => {
    setConnectOpen(false);
    openIdbConnectModal();
  };

  const connectIdb = async (name, ver) => {
    setIdbConnecting(true);
    const wrapper = new IDBWrapper(name, ver);
    try {
      const t0 = performance.now();
      await wrapper.open();
      const ms = Math.round(performance.now() - t0);
      const storeNames = wrapper.getObjectStores();
      const lastStore = useStore.getState().lastStoreName;

      setDbConnection(wrapper);
      setLastDbName(name);
      setLastIdbVersion(wrapper.version);

      if (useStore.getState().activeEngine !== 'indexeddb') {
        setActiveEngine('indexeddb');
      }

      setIdbName(name);
      setIdbVersion(wrapper.version);
      await refreshIdbMeta(wrapper);

      if (lastStore && storeNames.includes(lastStore)) {
        setCurrentStore(lastStore);
      } else if (storeNames.length > 0) {
        setCurrentStore(storeNames[0]);
      }

      addLog(`[IDB] OPEN ${name} v${wrapper.version} — ${ms}ms`);
      showToast(`Connected to ${name}`, 'success');
      await useStore.getState().updateQuota();
      await runRelationInference();
      closeIdbConnectModal();
    } catch (err) {
      addLog(`[ERROR] IDB CONNECT FAILED: ${err.message}`);
      showToast(err.message, 'error');
    } finally {
      setIdbConnecting(false);
    }
  };

  /* ── purge ───────────────────────────────────────────── */

  const disconnectIdb = () => {
    if (dbConnection) dbConnection.close();
    setDbConnection(null);
    setIdbStores([]);
    setIdbStoreCounts({});
    setCurrentStore(null);
    setCurrentStoreData([]);
    setLastStoreName(null);
  };

  const handleDeleteDatabase = async (dbName) => {
    setDeletingDb(true);
    try {
      await deleteDatabase(dbName, dbConnection);
      addLog(`[IDB] DELETE DATABASE "${dbName}"`);
      showToast(`Database ${dbName} deleted permanently`, 'info');
      disconnectIdb();
      setLastDbName(null);
      setLastIdbVersion(null);
      setDeleteDbOpen(false);
      setIdbPurgeOpen(false);
      triggerRefresh();
      await useStore.getState().updateQuota();
    } catch (err) {
      showToast(err.message || String(err), 'error');
    } finally {
      setDeletingDb(false);
    }
  };

  const handleIdbClearAll = async () => {
    if (!dbConnection) return;
    setIdbPurgeOpen(false);
    try {
      const stores = dbConnection.getObjectStores();
      const t0 = performance.now();
      for (const s of stores) await dbConnection.clear(s);
      const ms = Math.round(performance.now() - t0);
      addLog(`[IDB] PURGE ${stores.length} stores — ${ms}ms`);
      showToast(`All records cleared (${stores.length} stores)`, 'warning');
      await refreshIdbMeta(dbConnection);
      setCurrentStoreData([]);
      triggerRefresh();
      await useStore.getState().updateQuota();
    } catch (err) {
      addLog(`[ERROR] IDB PURGE FAILED: ${err.message}`);
      showToast(`IDB Purge Error: ${err.message}`, 'error');
    }
  };

  const handlePurge = async () => {
    if (activeEngine === 'indexeddb' && dbConnection) {
      setIdbPurgeOpen(true);
      return;
    }

    if (!purgeConfirm) { setPurgeConfirm(true); return; }

    setPurgeConfirm(false);
    if (activeEngine === 'local' || activeEngine === 'session') {
      const t0 = performance.now();
      purgeAll(activeEngine);
      const ms = Math.round(performance.now() - t0);
      const label = activeEngine === 'local' ? 'LOCAL' : 'SESSION';
      addLog(`[${label}] PURGE — ${ms}ms`);
      showToast(`${label} Storage purged`, 'warning');
      await useStore.getState().updateQuota();
    }
  };

  /* ── new store ───────────────────────────────────────── */

  const handleNewStore = async () => {
    if (!newStoreName.trim() || !dbConnection) return;
    const name = newStoreName.trim();
    const keyPath = newStoreKeyPath.trim() || 'id';
    try {
      const t0 = performance.now();
      await dbConnection.createObjectStore(name, {
        keyPath: newStoreAutoIncrement ? null : keyPath,
        autoIncrement: newStoreAutoIncrement,
      });
      const ms = Math.round(performance.now() - t0);
      const keyLabel = newStoreAutoIncrement ? 'auto-increment' : keyPath;

      const updatedStores = Array.from(dbConnection.db.objectStoreNames);
      setIdbStores(updatedStores);
      setDbConnection(dbConnection);
      setLastIdbVersion(dbConnection.version);

      const counts = {};
      for (const storeName of updatedStores) {
        try { counts[storeName] = await dbConnection.getCount(storeName); }
        catch { counts[storeName] = '?'; }
      }
      setIdbStoreCounts(counts);

      addLog(`[IDB] CREATE STORE "${name}" (keyPath: ${keyLabel}) — ${ms}ms`);
      showToast(`Store "${name}" created`, 'success');
      setNewStoreName('');
      setNewStoreKeyPath('id');
      setNewStoreAutoIncrement(false);
      setNewStoreOpen(false);
      await useStore.getState().updateQuota();
    } catch (err) {
      const message = err?.message || String(err);
      addLog(`[ERROR] IDB CREATE STORE FAILED: ${message}`);
      showToast(`Create Store Error: ${message}`, 'error');
    }
  };

  /* ── export stub ─────────────────────────────────────── */

  const handleExport = () => {
    exportStorageData(activeEngine, dbConnection);
  };

  /* ── render ──────────────────────────────────────────── */

  return (
    <div className="action-strip">
      {/* Connect button + dropdown */}
      <div className="connect-wrapper">
        <button className="btn monospace text-11" onClick={() => setConnectOpen(!connectOpen)}>
          <span className="connect-btn-inner">
            {activeEngine && showConnectPulse && <span className="connect-status-dot" aria-hidden="true" />}
            CONNECT
          </span>
        </button>
        {activeEngine && (
          <span className="engine-badge active monospace text-11">{activeEngine}</span>
        )}

        {connectOpen && (
          <div className="dropdown-popup">
            <div className="dropdown-item" onClick={connectLocal}>LOCALSTORAGE</div>
            <div className="dropdown-item" onClick={connectSession}>SESSIONSTORAGE</div>
            <div className="dropdown-item" onClick={openIdbModal}>INDEXEDDB</div>
          </div>
        )}
      </div>

      <IdbConnectModal
        open={idbConnectModalOpen}
        onClose={closeIdbConnectModal}
        onConnect={connectIdb}
        initialName={idbName}
        initialVersion={idbVersion}
        connecting={idbConnecting}
      />

      <IdbPurgeChoiceModal
        open={idbPurgeOpen}
        dbName={dbConnection?.dbName}
        onClose={() => setIdbPurgeOpen(false)}
        onClearAll={handleIdbClearAll}
        onDeleteDatabase={() => {
          setIdbPurgeOpen(false);
          setDeleteDbOpen(true);
        }}
      />

      <IdbDeleteDatabaseModal
        open={deleteDbOpen}
        dbName={dbConnection?.dbName || ''}
        onClose={() => setDeleteDbOpen(false)}
        onConfirm={handleDeleteDatabase}
        deleting={deletingDb}
      />

      {/* New Store */}
      <div className="connect-wrapper">
        <button
          className="btn monospace text-11"
          disabled={activeEngine !== 'indexeddb'}
          onClick={() => setNewStoreOpen(!newStoreOpen)}
        >
          NEW STORE
        </button>

        {newStoreOpen && activeEngine === 'indexeddb' && (
          <div className="dropdown-popup new-store-popup">
            <label className="monospace text-11 muted">Store name</label>
            <input
              type="text"
              className="input-minimal monospace text-11"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              placeholder="myStore"
              autoFocus
            />
            <label className="monospace text-11 muted">Key path</label>
            <input
              type="text"
              className="input-minimal monospace text-11"
              value={newStoreKeyPath}
              onChange={(e) => setNewStoreKeyPath(e.target.value)}
              placeholder="id"
              disabled={newStoreAutoIncrement}
            />
            <p className="new-store-helper monospace text-11 muted">
              The field that uniquely identifies each record. Common values: id, _id, uuid
            </p>
            <label className="new-store-checkbox monospace text-11">
              <input
                type="checkbox"
                checked={newStoreAutoIncrement}
                onChange={(e) => setNewStoreAutoIncrement(e.target.checked)}
              />
              Auto-increment key
            </label>
            <p className="new-store-helper monospace text-11 muted">
              Use this if your records don&apos;t have a natural unique field.
            </p>
            <p className="new-store-preview monospace text-11">{newStorePreview}</p>
            <button className="btn monospace text-11 add-btn" onClick={handleNewStore}>CREATE</button>
          </div>
        )}
      </div>

      {/* Purge */}
      <button className="btn monospace text-11" onClick={handlePurge}>
        {activeEngine === 'indexeddb'
          ? 'PURGE'
          : purgeConfirm
            ? 'CONFIRM?'
            : 'PURGE'}
      </button>

      {/* Export stub */}
      <button className="btn monospace text-11" onClick={handleExport}>
        EXPORT JSON
      </button>
    </div>
  );
}

function QueryConfigurationForm() {
  const activeEngine = useStore((s) => s.activeEngine);
  const setActiveEngine = useStore((s) => s.setActiveEngine);
  const filterText = useStore((s) => s.filterText);
  const setFilterText = useStore((s) => s.setFilterText);

  return (
    <div className="query-config-form">
      <div className="pill-tabs">
        {['local', 'session', 'indexeddb'].map((engine) => {
          const display = engine === 'indexeddb' ? 'IDB' : engine;
          return (
            <button
              key={engine}
              className={`tab monospace text-11 ${activeEngine === engine ? 'active' : ''}`}
              onClick={() => setActiveEngine(engine)}
            >
              {display}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        className="filter-input monospace text-11"
        placeholder="filter keys…"
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
      />
    </div>
  );
}

export default function StorageConsole() {
  const setShowShortcutsModal = useStore((s) => s.setShowShortcutsModal);

  return (
    <div className="storage-console">
      <StorageTargetActionStrip />
      <QueryConfigurationForm />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button 
          className="shortcut-helper-btn monospace text-11" 
          onClick={() => setShowShortcutsModal(true)}
          title="Keyboard Shortcuts"
        >?</button>
        <ThemeToggle />
        <Link to="/settings" className="settings-gear-btn" title="Settings">
          <i className="ti ti-settings" />
        </Link>
      </div>
    </div>
  );
}
