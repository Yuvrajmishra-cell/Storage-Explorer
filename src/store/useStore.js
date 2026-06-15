import { create } from 'zustand';
import { applyThemeToBody } from '../utils/theme';
import {
  computeKeyValueBytes,
  computePercent,
  formatBytes,
  formatQuota,
  getRawPercent,
  getStorageEstimate,
  getPercentLabel,
} from '../utils/storageQuota';

let quotaWarningToastShown = false;
let quotaCriticalToastShown = false;

const savedSettingsStr = window.localStorage.getItem('dbExplorerSettings');
let savedSettings = {};
if (savedSettingsStr) {
  try {
    savedSettings = JSON.parse(savedSettingsStr);
  } catch (e) {}
}

const savedThemeRaw = window.localStorage.getItem('dbExplorer_theme');
const initialTheme = ['dark', 'light', 'system'].includes(savedThemeRaw)
  ? savedThemeRaw
  : (['dark', 'light', 'system'].includes(savedSettings.theme) ? savedSettings.theme : 'dark');

let systemThemeMq = null;
let systemThemeHandler = null;

function attachSystemThemeListener(getTheme) {
  if (typeof window === 'undefined') return;
  if (!systemThemeMq) {
    systemThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
  }
  if (systemThemeHandler) {
    systemThemeMq.removeEventListener('change', systemThemeHandler);
  }
  systemThemeHandler = () => {
    if (getTheme() === 'system') {
      applyThemeToBody('system');
    }
  };
  systemThemeMq.addEventListener('change', systemThemeHandler);
}

function detachSystemThemeListener() {
  if (systemThemeMq && systemThemeHandler) {
    systemThemeMq.removeEventListener('change', systemThemeHandler);
    systemThemeHandler = null;
  }
}

applyThemeToBody(initialTheme);

const DEFAULTS = {
  activeEngine: 'local',
  filterText: '',
  lastDbName: 'ExplorerDB',
  lastStoreName: null,
  lastIdbVersion: 1,
  expandedStores: [],
  hudExpanded: false,
  panelWidth: 260,
  hudHeight: 48,
  fontSize: 13,
  defaultEngine: 'local',
  defaultIdbVersion: 1,
  autoConnect: false,
  showInternalKeys: false,
  exportFormat: '2',
  exportIncludeMetadata: true,
  exportFilenameFormat: '{engine}-{date}',
  showPlaygroundHints: true,
  theme: 'dark',
};

const useStore = create((set, get) => ({
  activeEngine: savedSettings.activeEngine || DEFAULTS.activeEngine,
  filterText: savedSettings.filterText || DEFAULTS.filterText,
  lastDbName: savedSettings.lastDbName || DEFAULTS.lastDbName,
  lastStoreName: savedSettings.lastStoreName ?? DEFAULTS.lastStoreName,
  lastIdbVersion: savedSettings.lastIdbVersion ?? savedSettings.defaultIdbVersion ?? DEFAULTS.lastIdbVersion,
  expandedStores: savedSettings.expandedStores || DEFAULTS.expandedStores,
  hudExpanded: savedSettings.hudExpanded ?? DEFAULTS.hudExpanded,
  panelWidth: Math.min(400, Math.max(180, savedSettings.panelWidth ?? DEFAULTS.panelWidth)),
  hudHeight: savedSettings.hudHeight ?? DEFAULTS.hudHeight,
  fontSize: savedSettings.fontSize ?? DEFAULTS.fontSize,
  defaultEngine: savedSettings.defaultEngine || DEFAULTS.defaultEngine,
  defaultIdbVersion: savedSettings.defaultIdbVersion ?? DEFAULTS.defaultIdbVersion,
  autoConnect: savedSettings.autoConnect ?? DEFAULTS.autoConnect,
  showInternalKeys: savedSettings.showInternalKeys ?? DEFAULTS.showInternalKeys,
  exportFormat: savedSettings.exportFormat || DEFAULTS.exportFormat,
  exportIncludeMetadata: savedSettings.exportIncludeMetadata ?? DEFAULTS.exportIncludeMetadata,
  exportFilenameFormat: savedSettings.exportFilenameFormat || DEFAULTS.exportFilenameFormat,
  showPlaygroundHints: savedSettings.showPlaygroundHints ?? DEFAULTS.showPlaygroundHints,
  theme: initialTheme,
  isWriting: false,

  selectedKey: null,
  currentStore: null,
  currentStoreData: [],
  quotaUsed: 0,
  quotaTotal: 0,
  quotaPercent: 0,
  quotaDisplay: '0 B / ~5 MB',
  quotaSource: 'estimated',
  transactionLogs: [],
  dbConnection: null,
  idbStores: [],
  idbStoreCounts: {},
  idbError: null,
  relationCount: 0,
  relationsMap: {},
  selectedRelation: null,
  toasts: [],
  showShortcutsModal: false,
  idbConnectModalOpen: false,
  refreshTrigger: 0,

  setActiveEngine: (engine) => {
    const state = get();
    if (state.activeEngine === engine) return;
    set({
      activeEngine: engine,
      selectedKey: null,
      currentStore: null,
      currentStoreData: [],
      idbError: null,
      selectedRelation: null,
    });
    void get().updateQuota();
  },
  setFilterText: (text) => set({ filterText: text }),
  setLastDbName: (name) => set({ lastDbName: name }),
  setLastStoreName: (name) => set({ lastStoreName: name }),
  setLastIdbVersion: (v) => set({ lastIdbVersion: v }),
  openIdbConnectModal: () => set({ idbConnectModalOpen: true }),
  closeIdbConnectModal: () => set({ idbConnectModalOpen: false }),
  toggleExpandedStore: (storeName) => set((state) => {
    const isExpanded = state.expandedStores.includes(storeName);
    return {
      expandedStores: isExpanded
        ? state.expandedStores.filter((s) => s !== storeName)
        : [...state.expandedStores, storeName],
    };
  }),
  setHudExpanded: (val) => set({ hudExpanded: val }),
  setPanelWidth: (w) => set({ panelWidth: Math.min(400, Math.max(180, w)) }),
  setHudHeight: (h) => set({ hudHeight: h }),
  setFontSize: (size) => set({ fontSize: size }),
  setDefaultEngine: (engine) => set({ defaultEngine: engine }),
  setDefaultIdbVersion: (v) => set({ defaultIdbVersion: v }),
  setAutoConnect: (val) => set({ autoConnect: val }),
  setShowInternalKeys: (val) => set({ showInternalKeys: val }),
  setExportFormat: (format) => set({ exportFormat: format }),
  setExportIncludeMetadata: (val) => set({ exportIncludeMetadata: val }),
  setExportFilenameFormat: (format) => set({ exportFilenameFormat: format }),
  setShowPlaygroundHints: (val) => set({ showPlaygroundHints: val }),
  setIsWriting: (w) => set({ isWriting: w }),

  setTheme: (theme) => {
    if (!['dark', 'light', 'system'].includes(theme)) return;
    applyThemeToBody(theme);
    window.localStorage.setItem('dbExplorer_theme', theme);
    if (theme === 'system') {
      attachSystemThemeListener(() => get().theme);
    } else {
      detachSystemThemeListener();
    }
    set({ theme });
  },

  cycleTheme: () => {
    const order = ['dark', 'light', 'system'];
    const current = get().theme;
    const next = order[(order.indexOf(current) + 1) % order.length];
    get().setTheme(next);
    get().showToast(`Theme set to ${next}`, 'success');
  },

  resetLayoutDefaults: () => set({
    panelWidth: DEFAULTS.panelWidth,
    hudHeight: DEFAULTS.hudHeight,
    fontSize: DEFAULTS.fontSize,
  }),

  resetAllSettings: () => {
    ['dbExplorerSettings', 'dbExplorer_theme', 'dbExplorer_onboarded'].forEach((key) => {
      window.localStorage.removeItem(key);
    });
    detachSystemThemeListener();
    applyThemeToBody('dark');
    window.localStorage.setItem('dbExplorer_theme', 'dark');
    set({
      ...DEFAULTS,
      theme: 'dark',
      selectedKey: null,
      currentStore: null,
      currentStoreData: [],
      dbConnection: null,
      idbStores: [],
      idbStoreCounts: {},
      idbError: null,
      transactionLogs: [],
      toasts: [],
    });
  },

  setSelectedKey: (key) => set({ selectedKey: key }),
  setCurrentStore: (store) => set({ currentStore: store, selectedKey: null }),
  setCurrentStoreData: (data) => set({ currentStoreData: data }),
  setQuota: (used, total) => set({ quotaUsed: used, quotaTotal: total }),

  updateQuota: async () => {
    const { activeEngine } = get();
    const WEB_STORAGE_LIMIT = 5 * 1024 * 1024;

    if (activeEngine === 'local') {
      const used = computeKeyValueBytes(window.localStorage);
      const total = WEB_STORAGE_LIMIT;
      const percent = computePercent(used, total);
      set({
        quotaUsed: used,
        quotaTotal: total,
        quotaPercent: percent,
        quotaDisplay: `${formatBytes(used)} / ~5 MB`,
        quotaSource: 'estimated',
      });
    } else if (activeEngine === 'session') {
      const used = computeKeyValueBytes(window.sessionStorage);
      const total = WEB_STORAGE_LIMIT;
      const percent = computePercent(used, total);
      set({
        quotaUsed: used,
        quotaTotal: total,
        quotaPercent: percent,
        quotaDisplay: `${formatBytes(used)} / ~5 MB`,
        quotaSource: 'estimated',
      });
    } else if (activeEngine === 'indexeddb') {
      const { usage, quota } = await getStorageEstimate();
      const percent = computePercent(usage, quota);
      set({
        quotaUsed: usage,
        quotaTotal: quota,
        quotaPercent: percent,
        quotaDisplay: `${formatBytes(usage)} / ${formatQuota(quota)}`,
        quotaSource: 'api',
      });
    } else {
      return;
    }

    const { quotaUsed, quotaTotal, showToast } = get();
    const rawPercent = getRawPercent(quotaUsed, quotaTotal);
    if (rawPercent >= 90 && !quotaCriticalToastShown) {
      quotaCriticalToastShown = true;
      showToast(`Storage critical: ${getPercentLabel(quotaUsed, quotaTotal)} used. Export a backup now.`, 'error');
    } else if (rawPercent >= 80 && !quotaWarningToastShown) {
      quotaWarningToastShown = true;
      showToast(`Storage at ${getPercentLabel(quotaUsed, quotaTotal)}. Consider exporting a backup.`, 'warning');
    }
  },

  addLog: (log) => set((state) => ({
    transactionLogs: [...state.transactionLogs, { text: log, timestamp: Date.now() }],
  })),
  setDbConnection: (wrapper) => set({ dbConnection: wrapper }),
  setIdbStores: (stores) => set({ idbStores: stores }),
  setIdbStoreCounts: (counts) => set({ idbStoreCounts: counts }),
  setIdbError: (err) => set({ idbError: err }),
  clearIdbError: () => set({ idbError: null }),
  setRelations: (map, count) => set({ relationsMap: map, relationCount: count }),
  setSelectedRelation: (relation) => set({ selectedRelation: relation }),

  showToast: (message, type = 'info') => set((state) => {
    const newToast = { id: Date.now() + Math.random(), message, type };
    return { toasts: [...state.toasts, newToast].slice(-4) };
  }),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id),
  })),
  setShowShortcutsModal: (val) => set({ showShortcutsModal: val }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
}));

let debounceTimer;
useStore.subscribe((state) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const settings = {
      activeEngine: state.activeEngine,
      lastDbName: state.lastDbName,
      lastStoreName: state.lastStoreName,
      lastIdbVersion: state.lastIdbVersion,
      expandedStores: state.expandedStores,
      filterText: state.filterText,
      hudExpanded: state.hudExpanded,
      panelWidth: state.panelWidth,
      hudHeight: state.hudHeight,
      fontSize: state.fontSize,
      defaultEngine: state.defaultEngine,
      defaultIdbVersion: state.defaultIdbVersion,
      autoConnect: state.autoConnect,
      showInternalKeys: state.showInternalKeys,
      exportFormat: state.exportFormat,
      exportIncludeMetadata: state.exportIncludeMetadata,
      exportFilenameFormat: state.exportFilenameFormat,
      showPlaygroundHints: state.showPlaygroundHints,
      theme: state.theme,
    };
    window.localStorage.setItem('dbExplorerSettings', JSON.stringify(settings));
    window.localStorage.setItem('dbExplorer_theme', state.theme);
  }, 500);
});

if (initialTheme === 'system') {
  attachSystemThemeListener(() => useStore.getState().theme);
}

export default useStore;
