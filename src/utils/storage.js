import useStore from '../store/useStore';

/**
 * Keys written by StorageExplorer itself — hidden from the storage browser UI.
 */
const INTERNAL_STORAGE_KEYS = new Set([
  'dbExplorerSettings',
  'dbExplorer_theme',
  'dbExplorer_onboarded',
]);

function isInternalStorageKey(key) {
  const showInternal = useStore.getState().showInternalKeys;
  if (showInternal) return false;
  return key.startsWith('dbExplorer_') || INTERNAL_STORAGE_KEYS.has(key);
}

function formatExportJson(data, format) {
  if (format === 'minified') return JSON.stringify(data);
  const spaces = format === '4' ? 4 : format === '2' ? 2 : 2;
  return JSON.stringify(data, null, spaces);
}

function buildExportFilename(template, vars) {
  return template
    .replace(/\{engine\}/g, vars.engine || 'storage')
    .replace(/\{date\}/g, vars.date || '')
    .replace(/\{dbName\}/g, vars.dbName || '')
    .replace(/\{storeName\}/g, vars.storeName || '')
    + '.json';
}

/**
 * Utility helpers for reading / writing Web Storage (localStorage & sessionStorage).
 */

function getStorageObject(engine) {
  if (engine === 'local') return window.localStorage;
  if (engine === 'session') return window.sessionStorage;
  return null;
}

/**
 * Read every key/value pair from the given engine.
 * Returns an array of { key, value, bytes }.
 */
export function readAllEntries(engine) {
  const storage = getStorageObject(engine);
  if (!storage) return [];

  const entries = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (isInternalStorageKey(key)) continue;
    const value = storage.getItem(key);
    const bytes = (key.length + value.length) * 2; // UTF-16
    entries.push({ key, value, bytes });
  }

  // Sort alphabetically for stable ordering
  entries.sort((a, b) => a.key.localeCompare(b.key));
  return entries;
}

/**
 * Sum UTF-16 byte size for visible keys in a Web Storage instance.
 */
export function computeLocalStorageBytes(storage) {
  let total = 0;
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (isInternalStorageKey(key)) continue;
    const value = storage.getItem(key);
    total += (key.length + value.length) * 2;
  }
  return total;
}

function getWebStorageSnapshot(engine) {
  const entries = readAllEntries(engine);
  const usage = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  const quota = 5 * 1024 * 1024;
  const percent = quota > 0 ? Math.min((usage / quota) * 100, 100) : 0;
  return { entries, usage, quota, percent };
}

/**
 * Re-read all keys from local/session storage and sync Zustand state.
 * @param {string} [engine]
 * @returns {Array<{ key: string, value: string, bytes: number }>}
 */
export function refreshStorageData(engine) {
  const activeEngine = engine ?? useStore.getState().activeEngine;
  const snapshot = getWebStorageSnapshot(activeEngine);
  useStore.getState().setCurrentStoreData(snapshot.entries);
  void useStore.getState().updateQuota();
  return snapshot.entries;
}

/**
 * Write a single key/value pair.  Returns elapsed ms.
 */
export function setEntry(engine, key, value) {
  const storage = getStorageObject(engine);
  if (!storage) return 0;

  const t0 = performance.now();
  storage.setItem(key, value);
  void useStore.getState().updateQuota();
  return Math.round(performance.now() - t0);
}

/**
 * Remove a single key.  Returns elapsed ms.
 */
export function removeEntry(engine, key) {
  const storage = getStorageObject(engine);
  if (!storage) return 0;

  const t0 = performance.now();
  storage.removeItem(key);
  void useStore.getState().updateQuota();
  return Math.round(performance.now() - t0);
}

/**
 * Clear everything in the engine.  Returns elapsed ms.
 */
export function purgeAll(engine) {
  const storage = getStorageObject(engine);
  if (!storage) return 0;

  const t0 = performance.now();
  storage.clear();
  void useStore.getState().updateQuota();
  return Math.round(performance.now() - t0);
}

/**
 * @deprecated use useStore.getState().updateQuota()
 */
export async function updateQuota() {
  return useStore.getState().updateQuota();
}

/**
 * Exports all data from the active engine as a downloadable JSON file.
 * @param {string} engine
 * @param {IDBWrapper} dbConnection
 */
export async function exportStorageData(engine, dbConnection) {
  const state = useStore.getState();
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.split('T')[0];
  let exportPayload = {};
  let filename = '';
  let recordCount = 0;

  if (engine === 'local' || engine === 'session') {
    const storage = engine === 'local' ? window.localStorage : window.sessionStorage;
    const data = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (isInternalStorageKey(key)) continue;
      data[key] = storage.getItem(key);
    }
    recordCount = Object.keys(data).length;
    exportPayload = state.exportIncludeMetadata
      ? { engine, exportedAt: timestamp, version: '1.0.0', recordCount, data }
      : data;
    filename = buildExportFilename(state.exportFilenameFormat, {
      engine: `${engine}storage`,
      date: dateStr,
    });
  } else if (engine === 'indexeddb' && dbConnection) {
    const stores = dbConnection.getObjectStores();
    const storesData = {};
    for (const store of stores) {
      try {
        storesData[store] = await dbConnection.getAll(store);
        recordCount += storesData[store].length;
      } catch (err) {
        console.error(`Failed to export store ${store}:`, err);
        useStore.getState().addLog(`[ERROR] Exporting store ${store} failed`);
        useStore.getState().showToast(`Failed to export store ${store}`, 'error');
      }
    }
    const dbName = dbConnection.dbName || 'DB';
    exportPayload = state.exportIncludeMetadata
      ? { engine, db: dbName, exportedAt: timestamp, version: '1.0.0', recordCount, stores: storesData }
      : storesData;
    filename = buildExportFilename(state.exportFilenameFormat, {
      engine: 'indexeddb',
      date: dateStr,
      dbName,
      storeName: useStore.getState().currentStore || '',
    });
  }

  const blob = new Blob([formatExportJson(exportPayload, state.exportFormat)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  useStore.getState().addLog(`[${engine.toUpperCase()}] EXPORT SUCCESS`);
  useStore.getState().showToast(`Exported ${filename} successfully`, 'success');
}

const FK_SUFFIXES = ['_id', '_key', 'id', 'key'];

function relationsArrayToMap(relations) {
  const map = {};
  for (const { fromStore, field, toStore } of relations) {
    if (!map[fromStore]) map[fromStore] = { foreignKeys: [], referencedBy: [] };
    if (!map[toStore]) map[toStore] = { foreignKeys: [], referencedBy: [] };
    if (!map[fromStore].foreignKeys.some((fk) => fk.field === field && fk.target === toStore)) {
      map[fromStore].foreignKeys.push({ field, target: toStore });
    }
    if (!map[toStore].referencedBy.some((ref) => ref.store === fromStore && ref.field === field)) {
      map[toStore].referencedBy.push({ store: fromStore, field });
    }
  }
  return map;
}

/**
 * Infers relationships between object stores based on foreign key naming conventions.
 * @param {string[]} storeNames
 * @param {Record<string, any[]>} allStoreRecords
 * @returns {Array<{ fromStore: string, field: string, toStore: string }>}
 */
export function inferRelationships(storeNames, allStoreRecords) {
  const relations = [];

  storeNames.forEach((storeName) => {
    const records = allStoreRecords[storeName] || [];
    const allFields = new Set();

    records.forEach((record) => {
      if (typeof record === 'object' && record !== null) {
        Object.keys(record).forEach((k) => allFields.add(k));
      }
    });

    allFields.forEach((fieldName) => {
      const fieldLower = fieldName.toLowerCase();

      FK_SUFFIXES.forEach((suffix) => {
        if (!fieldLower.endsWith(suffix) || fieldLower === suffix) return;

        let base = fieldLower.slice(0, fieldLower.length - suffix.length);
        base = base.replace(/_$/, '');
        if (!base) return;

        const referencedStore = storeNames.find((s) => {
          const sLower = s.toLowerCase();
          return (
            sLower === base ||
            sLower === `${base}s` ||
            sLower === `${base}es` ||
            sLower.startsWith(base)
          );
        });

        if (
          referencedStore &&
          referencedStore.toLowerCase() !== storeName.toLowerCase()
        ) {
          const alreadyExists = relations.some(
            (r) => r.fromStore === storeName && r.field === fieldName && r.toStore === referencedStore,
          );
          if (!alreadyExists) {
            relations.push({
              fromStore: storeName,
              field: fieldName,
              toStore: referencedStore,
            });
          }
        }
      });
    });
  });

  return relations;
}

/**
 * Loads all IndexedDB stores data and runs the relations inference engine.
 */
export async function runRelationInference() {
  const state = useStore.getState();
  const { activeEngine, dbConnection, idbStores } = state;

  if (activeEngine !== 'indexeddb' || !dbConnection) {
    state.setRelations({}, 0);
    return [];
  }

  const storeNames = idbStores.length > 0
    ? idbStores
    : dbConnection.getObjectStores();
  const allStoreRecords = {};

  for (const storeName of storeNames) {
    try {
      allStoreRecords[storeName] = await dbConnection.getAll(storeName);
    } catch {
      allStoreRecords[storeName] = [];
    }
  }

  const relations = inferRelationships(storeNames, allStoreRecords);
  const map = relationsArrayToMap(relations);
  state.setRelations(map, relations.length);
  return relations;
}
