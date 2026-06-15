import React, { useState, useCallback, useRef, useEffect } from 'react';
import useStore from '../store/useStore';
import { runRelationInference } from '../utils/storage';
import { deleteDatabase } from '../utils/idbAdmin';
import { normalizeIdbRecords } from '../utils/idbRecords';
import IdbDeleteDatabaseModal from './IdbDeleteDatabaseModal';
import IdbDeleteStoreModal from './IdbDeleteStoreModal';
import { TreeRowWithMenu } from './TreeContextMenu';
import './IdbAdminModals.css';

function RelationsSection() {
  const relationsMap = useStore((s) => s.relationsMap);
  const relationCount = useStore((s) => s.relationCount);
  const setSelectedRelation = useStore((s) => s.setSelectedRelation);
  const [collapsed, setCollapsed] = useState(false);
  const highlightTimerRef = useRef(null);

  useEffect(() => () => {
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
  }, []);

  const relations = [];
  Object.entries(relationsMap || {}).forEach(([sourceStore, info]) => {
    if (info && info.foreignKeys) {
      info.foreignKeys.forEach(({ field, target }) => {
        relations.push({ sourceStore, field, targetStore: target });
      });
    }
  });

  const handleRelationClick = (rel) => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    setSelectedRelation(rel);
    highlightTimerRef.current = setTimeout(() => {
      setSelectedRelation(null);
      highlightTimerRef.current = null;
    }, 2000);
  };

  return (
    <div className="relations-section monospace text-11">
      <div className="relations-header">
        <span
          className="relations-header-label"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? `▶ RELATIONS (${relationCount})` : `┌ RELATIONS (${relationCount})`}
        </span>
        <div className="relations-info-wrap">
          <i className="ti ti-info-circle relations-info-icon" aria-hidden="true" />
          <div className="relations-info-popover" role="tooltip">
            <p className="relations-info-title">How relations are detected</p>
            <p className="relations-info-body">
              StorageExplorer scans all records across all object stores and looks for field names ending in:
              <br />
              · Id (e.g. userId, productId)
              <br />
              · _id (e.g. user_id)
              <br />
              · _key (e.g. category_key)
              <br />
              If a matching store name is found, a relationship is inferred.
            </p>
            <div className="relations-info-example">
              orders.userId → users ✓
              <br />
              orders.productId → products ✓
            </div>
            <p className="relations-info-footer">
              Create stores with matching names and Id fields to see relations appear.
            </p>
          </div>
        </div>
      </div>
      {!collapsed && (
        <div className="relations-body">
          {relations.length === 0 ? (
            <div className="relation-empty">
              <div className="relation-empty-heading">(NO RELATIONS INFERRED)</div>
              <p className="relation-empty-hint">
                Add records with fields like userId, productId, categoryId across multiple stores to detect relationships.
              </p>
            </div>
          ) : (
            <>
              {relations.map((rel) => (
                <div
                  key={`${rel.sourceStore}.${rel.field}`}
                  className="relation-row relation-row-inferred"
                  onClick={() => handleRelationClick(rel)}
                  title={`${rel.sourceStore}.${rel.field} links to ${rel.targetStore}`}
                >
                  ├ {rel.sourceStore}.{rel.field} → {rel.targetStore}
                </div>
              ))}
              <div className="relations-footer">└ (click to highlight)</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function SchemaObjectTreeNavigator({ entries }) {
  const activeEngine = useStore((s) => s.activeEngine);
  const selectedKey = useStore((s) => s.selectedKey);
  const setSelectedKey = useStore((s) => s.setSelectedKey);
  const filterText = useStore((s) => s.filterText);

  const dbConnection = useStore((s) => s.dbConnection);
  const setDbConnection = useStore((s) => s.setDbConnection);
  const idbStores = useStore((s) => s.idbStores);
  const idbStoreCounts = useStore((s) => s.idbStoreCounts);
  const setIdbStores = useStore((s) => s.setIdbStores);
  const setIdbStoreCounts = useStore((s) => s.setIdbStoreCounts);
  const currentStore = useStore((s) => s.currentStore);
  const setCurrentStore = useStore((s) => s.setCurrentStore);
  const setCurrentStoreData = useStore((s) => s.setCurrentStoreData);
  const setLastStoreName = useStore((s) => s.setLastStoreName);
  const setLastDbName = useStore((s) => s.setLastDbName);
  const setLastIdbVersion = useStore((s) => s.setLastIdbVersion);
  const selectedRelation = useStore((s) => s.selectedRelation);
  const addLog = useStore((s) => s.addLog);
  const showToast = useStore((s) => s.showToast);
  const triggerRefresh = useStore((s) => s.triggerRefresh);

  const [deleteDbOpen, setDeleteDbOpen] = useState(false);
  const [deleteStoreOpen, setDeleteStoreOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refreshIdbMeta = useCallback(async (wrapper) => {
    const names = wrapper.getObjectStores();
    setIdbStores(names);
    const counts = {};
    for (const name of names) {
      try { counts[name] = await wrapper.getCount(name); }
      catch { counts[name] = '?'; }
    }
    setIdbStoreCounts(counts);
    return names;
  }, [setIdbStores, setIdbStoreCounts]);

  const disconnectIdb = useCallback((clearPersisted = false) => {
    const conn = useStore.getState().dbConnection;
    if (conn) conn.close();
    setDbConnection(null);
    setIdbStores([]);
    setIdbStoreCounts({});
    setCurrentStore(null);
    setCurrentStoreData([]);
    setLastStoreName(null);
    if (clearPersisted) {
      setLastDbName(null);
      setLastIdbVersion(null);
    }
    triggerRefresh();
  }, [
    setDbConnection, setIdbStores, setIdbStoreCounts, setCurrentStore,
    setCurrentStoreData, setLastStoreName, setLastDbName, setLastIdbVersion, triggerRefresh,
  ]);

  const handleDeleteDatabase = async (dbName) => {
    setDeleting(true);
    try {
      await deleteDatabase(dbName, dbConnection);
      addLog(`[IDB] DELETE DATABASE "${dbName}"`);
      showToast(`Database ${dbName} deleted permanently`, 'info');
      disconnectIdb(true);
      setDeleteDbOpen(false);
      await useStore.getState().updateQuota();
    } catch (err) {
      showToast(err.message || String(err), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearStore = async (storeName) => {
    if (!dbConnection) return;
    try {
      await dbConnection.clear(storeName);
      addLog(`[IDB] CLEAR "${storeName}"`);
      showToast(`All records cleared from ${storeName}`, 'info');
      await refreshIdbMeta(dbConnection);
      if (currentStore === storeName) {
        setCurrentStoreData([]);
        triggerRefresh();
      }
      await useStore.getState().updateQuota();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteStore = async (storeName) => {
    if (!dbConnection) return;
    setDeleting(true);
    try {
      await dbConnection.deleteObjectStore(storeName);

      const updatedStores = Array.from(dbConnection.db.objectStoreNames);
      setIdbStores(updatedStores);
      setDbConnection(dbConnection);
      setLastIdbVersion(dbConnection.version);

      const counts = {};
      for (const name of updatedStores) {
        try { counts[name] = await dbConnection.getCount(name); }
        catch { counts[name] = '?'; }
      }
      setIdbStoreCounts(counts);

      if (currentStore === storeName) {
        setCurrentStore(null);
        setCurrentStoreData([]);
        setLastStoreName(null);
      }

      setDeleteStoreOpen(false);
      setStoreToDelete(null);
      triggerRefresh();
      showToast(`Store "${storeName}" deleted`, 'info');
      addLog(`[IDB] DELETE STORE "${storeName}"`);
      await useStore.getState().updateQuota();
    } catch (err) {
      const message = err?.message || String(err);
      showToast(message, 'error');
      addLog(`[ERROR] DELETE STORE FAILED: ${message}`);
      setDeleteStoreOpen(false);
      setStoreToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  if (activeEngine === 'indexeddb') {
    if (!dbConnection) return null;

    const filteredStores = idbStores.filter((name) =>
      name.toLowerCase().includes(filterText.toLowerCase())
    );

    const handleStoreClick = async (name) => {
      if (!dbConnection) return;
      try {
        const records = await dbConnection.getAll(name);
        setCurrentStore(name);
        setLastStoreName(name);
        setCurrentStoreData(normalizeIdbRecords(records));
        await runRelationInference();
      } catch (err) {
        showToast(err.message || String(err), 'error');
      }
    };

    const dbName = dbConnection.dbName;

    return (
      <div className="tree-navigator-container">
        <IdbDeleteDatabaseModal
          open={deleteDbOpen}
          dbName={dbName}
          onClose={() => setDeleteDbOpen(false)}
          onConfirm={handleDeleteDatabase}
          deleting={deleting}
        />
        <IdbDeleteStoreModal
          open={deleteStoreOpen}
          storeName={storeToDelete}
          onClose={() => { setDeleteStoreOpen(false); setStoreToDelete(null); }}
          onConfirm={handleDeleteStore}
          deleting={deleting}
        />

        <ul className="tree-list">
          <TreeRowWithMenu
            className="tree-item tree-root monospace text-11"
            onRowClick={() => {}}
            menuItems={[
              {
                id: 'rename',
                label: 'Rename database',
                onClick: () => showToast('Coming soon', 'info'),
              },
              {
                id: 'delete-db',
                label: 'Delete database',
                icon: 'ti-trash',
                danger: true,
                onClick: () => setDeleteDbOpen(true),
              },
            ]}
          >
            <span className="tree-icon">📁</span>
            <span className="tree-label">{dbName}</span>
          </TreeRowWithMenu>

          {filteredStores.length === 0 && (
            <li className="tree-empty monospace text-11">No object stores</li>
          )}

          {filteredStores.map((name) => {
            const isHighlighted =
              selectedRelation &&
              (selectedRelation.sourceStore === name || selectedRelation.targetStore === name);
            return (
              <TreeRowWithMenu
                key={name}
                className={`tree-item tree-child monospace text-11${currentStore === name ? ' selected' : ''}${isHighlighted ? ' relation-highlighted' : ''}`}
                onRowClick={() => handleStoreClick(name)}
                menuItems={[
                  {
                    id: 'clear',
                    label: 'Clear all records',
                    onClick: () => handleClearStore(name),
                  },
                  {
                    id: 'delete-store',
                    label: 'Delete store',
                    icon: 'ti-trash',
                    danger: true,
                    onClick: () => {
                      setStoreToDelete(name);
                      setDeleteStoreOpen(true);
                    },
                  },
                ]}
              >
                <span className="tree-icon">📂</span>
                <span className="tree-label">{name}</span>
                <span className="tree-count-pill monospace">
                  {idbStoreCounts[name] !== undefined ? idbStoreCounts[name] : '…'}
                </span>
              </TreeRowWithMenu>
            );
          })}
        </ul>

        <RelationsSection />
      </div>
    );
  }

  const filtered = (entries || []).filter((e) =>
    e.key.toLowerCase().includes(filterText.toLowerCase())
  );

  const handleClick = (key) => {
    setSelectedKey(key);
    const row = document.getElementById(`row-${CSS.escape(key)}`);
    if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <ul className="tree-list">
      {filtered.length === 0 && (
        <li className="tree-empty monospace text-11">No keys found</li>
      )}
      {filtered.map((entry) => (
        <li
          key={entry.key}
          className={`tree-item monospace text-11${selectedKey === entry.key ? ' selected' : ''}`}
          onClick={() => handleClick(entry.key)}
          title={entry.key}
        >
          <span className="tree-icon">⟡</span>
          <span className="tree-label">{entry.key}</span>
        </li>
      ))}
    </ul>
  );
}
