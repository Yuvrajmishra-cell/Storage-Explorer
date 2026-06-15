import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import StorageConsole from './components/StorageConsole';
import ExplorerStage from './components/ExplorerStage';
import StorageTelemetryHUD from './components/StorageTelemetryHUD';
import LandingPage from './components/LandingPage';
import DocsPage from './components/DocsPage';
import AboutPage from './components/AboutPage';
import NotFoundPage from './components/NotFoundPage';
import SettingsPage from './components/SettingsPage';
import OnboardingOverlay from './components/OnboardingOverlay';
import ToastContainer from './components/ToastContainer';
import ShortcutManager from './components/ShortcutManager';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import useStore from './store/useStore';
import IDBWrapper from './utils/IDBWrapper';
import { refreshStorageData, runRelationInference } from './utils/storage';
import { normalizeIdbRecords } from './utils/idbRecords';
import './index.css';
import './polish.css';

function StorageExplorerApp() {
  const [showOnboarding, setShowOnboarding] = React.useState(false);
  const activeEngine = useStore((s) => s.activeEngine);
  const currentStore = useStore((s) => s.currentStore);
  const dbConnection = useStore((s) => s.dbConnection);
  const relationCount = useStore((s) => s.relationCount);
  const panelWidth = useStore((s) => s.panelWidth);
  const hudHeight = useStore((s) => s.hudHeight);
  const fontSize = useStore((s) => s.fontSize);
  const setDbConnection = useStore((s) => s.setDbConnection);
  const setIdbStores = useStore((s) => s.setIdbStores);
  const setIdbStoreCounts = useStore((s) => s.setIdbStoreCounts);
  const addLog = useStore((s) => s.addLog);
  const showToast = useStore((s) => s.showToast);
  const setCurrentStore = useStore((s) => s.setCurrentStore);
  const setCurrentStoreData = useStore((s) => s.setCurrentStoreData);

  const layoutStyle = {
    '--hud-height': `${hudHeight}px`,
    '--app-font-size': `${fontSize}px`,
  };

  const updateQuota = useStore((s) => s.updateQuota);

  React.useEffect(() => {
    const onboarded = localStorage.getItem('dbExplorer_onboarded');
    if (onboarded !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  React.useEffect(() => {
    void updateQuota();
  }, [updateQuota]);

  React.useEffect(() => {
    const restoreWorkspace = async () => {
      const raw = localStorage.getItem('dbExplorerSettings');
      if (!raw) return;

      let settings;
      try {
        settings = JSON.parse(raw);
      } catch {
        return;
      }

      if (settings.activeEngine === 'local') {
        refreshStorageData('local');
        await updateQuota();
        return;
      }
      if (settings.activeEngine === 'session') {
        refreshStorageData('session');
        await updateQuota();
        return;
      }

      if (settings.activeEngine !== 'indexeddb' || !settings.lastDbName) return;

      try {
        const ver = settings.lastIdbVersion || settings.defaultIdbVersion || 1;
        const wrapper = new IDBWrapper(settings.lastDbName, ver);
        await wrapper.open();

        const storeNames = wrapper.getObjectStores();
        setDbConnection(wrapper);

        const counts = {};
        for (const name of storeNames) {
          try { counts[name] = await wrapper.getCount(name); }
          catch { counts[name] = '?'; }
        }
        setIdbStores(storeNames);
        setIdbStoreCounts(counts);

        if (settings.lastStoreName && storeNames.includes(settings.lastStoreName)) {
          const rawRecords = await wrapper.getAll(settings.lastStoreName);
          setCurrentStore(settings.lastStoreName);
          setCurrentStoreData(normalizeIdbRecords(rawRecords));
          addLog(`[IDB] AUTO-RESTORED "${settings.lastDbName}" › "${settings.lastStoreName}"`);
        }

        await updateQuota();
        await runRelationInference();
      } catch (e) {
        console.warn('IDB restore failed:', e);
      }
    };

    restoreWorkspace();
  }, [setDbConnection, setIdbStores, setIdbStoreCounts, setCurrentStore, setCurrentStoreData, addLog, updateQuota]);

  React.useEffect(() => {
    if (!activeEngine) {
      document.title = "StorageExplorer";
      return;
    }

    if (activeEngine === 'local') {
      document.title = "LocalStorage — StorageExplorer";
    } else if (activeEngine === 'session') {
      document.title = "SessionStorage — StorageExplorer";
    } else if (activeEngine === 'indexeddb') {
      const dbName = dbConnection?.dbName || 'ExplorerDB';
      const relationSuffix = relationCount > 0
        ? ` · ${relationCount} relation${relationCount === 1 ? '' : 's'}`
        : '';
      if (currentStore) {
        document.title = `${currentStore} · ${dbName}${relationSuffix} — StorageExplorer`;
      } else {
        document.title = `${dbName}${relationSuffix} — StorageExplorer`;
      }
    } else {
      document.title = "StorageExplorer";
    }
  }, [activeEngine, currentStore, dbConnection, relationCount]);

  const handleDismissOnboarding = () => {
    localStorage.setItem('dbExplorer_onboarded', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="app-container" style={layoutStyle}>
      <StorageConsole />
      <ExplorerStage />
      <StorageTelemetryHUD />
      {showOnboarding && <OnboardingOverlay onDismiss={handleDismissOnboarding} />}
    </div>
  );
}

function PageTransition({ children }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="route-fade-in">
      {children}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
      <Route path="/app" element={<PageTransition><StorageExplorerApp /></PageTransition>} />
      <Route path="/docs" element={<PageTransition><DocsPage /></PageTransition>} />
      <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
      <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
      <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
    </Routes>
  );
}

function App() {
  return (
    <>
      <ToastContainer />
      <ShortcutManager />
      <KeyboardShortcutsModal />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}

export default App;
