import { useEffect } from 'react';
import useStore from '../store/useStore';
import IDBWrapper from '../utils/IDBWrapper';
import { exportStorageData, removeEntry } from '../utils/storage';
import { canConnectDatabase, getFreeDatabaseName, markFreeDatabaseName } from '../utils/planLimits';

export default function ShortcutManager() {
  const activeEngine = useStore((s) => s.activeEngine);
  const setActiveEngine = useStore((s) => s.setActiveEngine);
  const dbConnection = useStore((s) => s.dbConnection);
  const setDbConnection = useStore((s) => s.setDbConnection);
  const lastDbName = useStore((s) => s.lastDbName);
  const setLastDbName = useStore((s) => s.setLastDbName);
  const setIdbStores = useStore((s) => s.setIdbStores);
  const setIdbStoreCounts = useStore((s) => s.setIdbStoreCounts);
  const selectedKey = useStore((s) => s.selectedKey);
  const setSelectedKey = useStore((s) => s.setSelectedKey);
  const showShortcutsModal = useStore((s) => s.showShortcutsModal);
  const setShowShortcutsModal = useStore((s) => s.setShowShortcutsModal);
  const hudExpanded = useStore((s) => s.hudExpanded);
  const setHudExpanded = useStore((s) => s.setHudExpanded);
  const triggerRefresh = useStore((s) => s.triggerRefresh);
  const currentStore = useStore((s) => s.currentStore);
  const addLog = useStore((s) => s.addLog);
  const showToast = useStore((s) => s.showToast);
  const showUpgradePrompt = useStore((s) => s.showUpgradePrompt);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Ignore key events if focused in an input/textarea/editable element
      const activeElement = document.activeElement;
      const isInput = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );

      // But if user presses keys (like Ctrl+E, Ctrl+F, Ctrl+R, etc.), those should still trigger
      // even if they are focused in an input, but the simple character ones like "?" should not.
      // Wait, let's allow Ctrl/Cmd shortcuts always, but check `isInput` for single-char shortcuts like "?".
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key = e.key.toLowerCase();

      // ? triggers modal
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcutsModal(!showShortcutsModal);
        return;
      }

      // If user is focused on an input/textarea, let the native editing shortcuts (Enter, Escape, Delete inside input) take precedence.
      // So we bypass other shortcuts when typing in inputs EXCEPT for Ctrl combos.
      if (isInput && !ctrlOrMeta) {
        return;
      }

      // Switch to LocalStorage: Ctrl + 1
      if (ctrlOrMeta && !shift && e.key === '1') {
        e.preventDefault();
        setActiveEngine('local');
        addLog('[LOCAL] Connected');
        showToast('Connected to Local Storage', 'success');
        return;
      }

      // Switch to SessionStorage: Ctrl + 2
      if (ctrlOrMeta && !shift && e.key === '2') {
        e.preventDefault();
        setActiveEngine('session');
        addLog('[SESSION] Connected');
        showToast('Connected to Session Storage', 'success');
        return;
      }

      // Switch to IndexedDB: Ctrl + 3
      if (ctrlOrMeta && !shift && e.key === '3') {
        e.preventDefault();
        const ver = 1;
        const dbName = lastDbName || 'ExplorerDB';
        if (!canConnectDatabase(dbName)) {
          const freeDb = getFreeDatabaseName();
          showUpgradePrompt(
            'database',
            `Free workspaces can connect to 1 IndexedDB database (${freeDb}). Upgrade to Pro to connect ${dbName}.`
          );
          showToast('Free database limit reached', 'warning');
          return;
        }
        const wrapper = new IDBWrapper(dbName, ver);
        try {
          const t0 = performance.now();
          await wrapper.open();
          const ms = Math.round(performance.now() - t0);
          setDbConnection(wrapper);
          markFreeDatabaseName(dbName);
          setActiveEngine('indexeddb');
          
          const names = wrapper.getObjectStores();
          setIdbStores(names);
          const counts = {};
          for (const name of names) {
            try { counts[name] = await wrapper.getCount(name); }
            catch { counts[name] = '?'; }
          }
          setIdbStoreCounts(counts);
          
          addLog(`[IDB] OPEN ${dbName} v${ver} — ${ms}ms`);
          showToast(`Connected to IndexedDB: ${dbName}`, 'success');
          setLastDbName(dbName);
          await useStore.getState().updateQuota();
        } catch (err) {
          addLog(`[ERROR] IDB CONNECT FAILED: ${err.message}`);
          showToast(`IDB Connection Error: ${err.message}`, 'error');
        }
        return;
      }

      // Focus filter input: Ctrl + F
      if (ctrlOrMeta && !shift && key === 'f') {
        e.preventDefault();
        const filterInput = document.querySelector('.filter-input');
        if (filterInput) {
          filterInput.focus();
          filterInput.select();
        }
        return;
      }

      // Export current engine: Ctrl + E
      if (ctrlOrMeta && !shift && key === 'e') {
        e.preventDefault();
        exportStorageData(activeEngine, dbConnection);
        return;
      }

      // Export as JSON: Ctrl + Shift + E
      if (ctrlOrMeta && shift && key === 'e') {
        e.preventDefault();
        exportStorageData(activeEngine, dbConnection);
        return;
      }

      // Toggle HUD log panel: Ctrl + L
      if (ctrlOrMeta && !shift && key === 'l') {
        e.preventDefault();
        setHudExpanded(!hudExpanded);
        return;
      }

      // Refresh current store: Ctrl + R
      if (ctrlOrMeta && !shift && key === 'r') {
        e.preventDefault();
        triggerRefresh();
        return;
      }

      // Delete selected row: Delete (when not in an input, and selectedKey is set)
      if (e.key === 'Delete' && !isInput && selectedKey) {
        e.preventDefault();
        if (activeEngine === 'local' || activeEngine === 'session') {
          const ms = removeEntry(activeEngine, selectedKey);
          addLog(`[${activeEngine.toUpperCase()}] DEL ${selectedKey} — ${ms}ms`);
          showToast(`Deleted key: ${selectedKey}`, 'warning');
          setSelectedKey(null);
          await useStore.getState().updateQuota();
          triggerRefresh();
        } else if (activeEngine === 'indexeddb' && dbConnection && currentStore) {
          try {
            const t0 = performance.now();
            await dbConnection.delete(currentStore, selectedKey);
            const ms = Math.round(performance.now() - t0);
            addLog(`[IDB] DELETE "${currentStore}" key=${selectedKey} — ${ms}ms`);
            showToast(`Deleted record: ${selectedKey}`, 'warning');
            setSelectedKey(null);
            await useStore.getState().updateQuota();
            triggerRefresh();
          } catch (err) {
            addLog(`[ERROR] IDB DELETE FAILED: ${err.message}`);
            showToast(`Delete Error: ${err.message}`, 'error');
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeEngine,
    dbConnection,
    lastDbName,
    selectedKey,
    showShortcutsModal,
    hudExpanded,
    currentStore,
    setActiveEngine,
    setDbConnection,
    setLastDbName,
    setIdbStores,
    setIdbStoreCounts,
    setSelectedKey,
    setShowShortcutsModal,
    setHudExpanded,
    triggerRefresh,
    addLog,
    showToast,
    showUpgradePrompt
  ]);

  return null;
}
