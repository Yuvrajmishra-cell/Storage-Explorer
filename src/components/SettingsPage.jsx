import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import SiteNavbar from './SiteNavbar';
import { usePlan } from '../plan/usePlan';
import './SettingsPage.css';

const NAV_SECTIONS = [
  {
    group: 'APPEARANCE',
    items: [
      { id: 'theme', label: 'Theme' },
      { id: 'layout', label: 'Layout' },
    ],
  },
  {
    group: 'DATA',
    items: [
      { id: 'storage-defaults', label: 'Storage defaults' },
      { id: 'export-preferences', label: 'Export preferences' },
    ],
  },
  {
    group: 'WORKSPACE',
    items: [
      { id: 'onboarding', label: 'Onboarding' },
      { id: 'plan-testing', label: 'Plan testing' },
      { id: 'keyboard-shortcuts', label: 'Keyboard shortcuts' },
      { id: 'danger-zone', label: 'Danger zone' },
    ],
  },
];

const SHORTCUT_NAV = [
  { action: 'Switch to LocalStorage', keys: ['Ctrl', '1'] },
  { action: 'Switch to SessionStorage', keys: ['Ctrl', '2'] },
  { action: 'Switch to IndexedDB', keys: ['Ctrl', '3'] },
  { action: 'Focus filter input', keys: ['Ctrl', 'F'] },
  { action: 'Open shortcuts modal', keys: ['?'] },
];

const SHORTCUT_DATA = [
  { action: 'Save inline edit', keys: ['Enter'] },
  { action: 'Cancel inline edit', keys: ['Escape'] },
  { action: 'Delete selected row', keys: ['Delete'] },
  { action: 'Export current engine', keys: ['Ctrl', 'E'] },
  { action: 'Refresh current store', keys: ['Ctrl', 'R'] },
];

function SavedCheck({ visible }) {
  if (!visible) return null;
  return <span className="settings-saved-check monospace"><i className="ti ti-check" /> Saved</span>;
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      className={`settings-toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle-thumb" />
    </button>
  );
}

const SLIDERS = [
  { key: 'panelWidth', label: 'Left panel width', min: 180, max: 400, step: 10, unit: 'px' },
  { key: 'hudHeight', label: 'Bottom HUD height', min: 40, max: 120, step: 4, unit: 'px' },
  { key: 'fontSize', label: 'Font size', min: 11, max: 15, step: 1, unit: 'px' },
];

function SectionHeading({ title, danger = false }) {
  return (
    <div className={`settings-section-heading${danger ? ' danger' : ''}`}>
      <h2 className={`settings-section-title${danger ? ' settings-danger-title' : ''}`}>
        {danger && <i className="ti ti-alert-triangle settings-danger-icon" aria-hidden="true" />}
        {title}
      </h2>
    </div>
  );
}

function updateSliderFill(target) {
  const min = Number(target.min);
  const max = Number(target.max);
  const val = Number(target.value);
  const percent = ((val - min) / (max - min)) * 100;
  target.style.background = `linear-gradient(to right, #4ade80 0%, #4ade80 ${percent}%, #2a2a2a ${percent}%, #2a2a2a 100%)`;
}

const THEME_CARDS = [
  { id: 'dark', name: 'Dark', pill: 'Default', footer: 'dark' },
  { id: 'light', name: 'Light', footer: 'light' },
  { id: 'system', name: 'System', sub: 'Follows OS', footer: 'system' },
];

function ThemePreview({ variant }) {
  if (variant === 'system') {
    return (
      <div className="settings-theme-preview settings-theme-preview-system" aria-hidden="true">
        <div className="settings-theme-preview-system-split" />
        <div className="settings-preview-system-rows">
          <div className="settings-preview-topbar dark" />
          <div className="settings-preview-row dark w100" />
          <div className="settings-preview-row dark w70" />
          <div className="settings-preview-pill" />
        </div>
      </div>
    );
  }

  const isLight = variant === 'light';
  const barClass = isLight ? 'light' : 'dark';
  const previewClass = isLight ? 'light' : 'dark';

  return (
    <div className={`settings-theme-preview ${previewClass}`} aria-hidden="true">
      <div className={`settings-preview-topbar ${barClass}`} />
      <div className={`settings-preview-row ${barClass} w100`} />
      <div className={`settings-preview-row ${barClass} w70`} />
      <div className={`settings-preview-row ${barClass} w85`} />
      <div className="settings-preview-pill" />
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  const panelWidth = useStore((s) => s.panelWidth);
  const hudHeight = useStore((s) => s.hudHeight);
  const fontSize = useStore((s) => s.fontSize);
  const setPanelWidth = useStore((s) => s.setPanelWidth);
  const setHudHeight = useStore((s) => s.setHudHeight);
  const setFontSize = useStore((s) => s.setFontSize);
  const resetLayoutDefaults = useStore((s) => s.resetLayoutDefaults);

  const defaultEngine = useStore((s) => s.defaultEngine);
  const lastDbName = useStore((s) => s.lastDbName);
  const defaultIdbVersion = useStore((s) => s.defaultIdbVersion);
  const autoConnect = useStore((s) => s.autoConnect);
  const showInternalKeys = useStore((s) => s.showInternalKeys);
  const setDefaultEngine = useStore((s) => s.setDefaultEngine);
  const setLastDbName = useStore((s) => s.setLastDbName);
  const setDefaultIdbVersion = useStore((s) => s.setDefaultIdbVersion);
  const setAutoConnect = useStore((s) => s.setAutoConnect);
  const setShowInternalKeys = useStore((s) => s.setShowInternalKeys);

  const exportFormat = useStore((s) => s.exportFormat);
  const exportIncludeMetadata = useStore((s) => s.exportIncludeMetadata);
  const exportFilenameFormat = useStore((s) => s.exportFilenameFormat);
  const setExportFormat = useStore((s) => s.setExportFormat);
  const setExportIncludeMetadata = useStore((s) => s.setExportIncludeMetadata);
  const setExportFilenameFormat = useStore((s) => s.setExportFilenameFormat);

  const showPlaygroundHints = useStore((s) => s.showPlaygroundHints);
  const setShowPlaygroundHints = useStore((s) => s.setShowPlaygroundHints);
  const showToast = useStore((s) => s.showToast);
  const resetAllSettings = useStore((s) => s.resetAllSettings);
  const triggerRefresh = useStore((s) => s.triggerRefresh);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const {
    plan,
    isPro,
    exportCountToday,
    freeDatabaseName,
    setPlan,
    clearExportUsage,
    clearFreeDatabase,
  } = usePlan();

  const [activeSection, setActiveSection] = useState('theme');
  const [savedKeys, setSavedKeys] = useState({});
  const [showSavedBar, setShowSavedBar] = useState(false);
  const [autosaveState, setAutosaveState] = useState('saved');
  const [dangerConfirm, setDangerConfirm] = useState(null);
  const savedBarTimer = useRef(null);
  const autosaveTimer = useRef(null);

  const onboarded = localStorage.getItem('dbExplorer_onboarded') === 'true';

  const markSaved = useCallback((key) => {
    setSavedKeys((prev) => ({ ...prev, [key]: true }));
    setShowSavedBar(true);
    setAutosaveState('saving');
    if (savedBarTimer.current) clearTimeout(savedBarTimer.current);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    savedBarTimer.current = setTimeout(() => setShowSavedBar(false), 3000);
    autosaveTimer.current = setTimeout(() => setAutosaveState('saved'), 800);
    setTimeout(() => {
      setSavedKeys((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 1500);
  }, []);

  const handleNavClick = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const ids = NAV_SECTIONS.flatMap((g) => g.items.map((i) => i.id));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0.1, 0.3] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!dangerConfirm) return;
    const t = setTimeout(() => setDangerConfirm(null), 4000);
    return () => clearTimeout(t);
  }, [dangerConfirm]);

  useEffect(() => {
    document.querySelectorAll('.settings-range').forEach((el) => updateSliderFill(el));
  }, [panelWidth, hudHeight, fontSize]);

  const exportPreview = useMemo(() => {
    const date = new Date().toISOString().split('T')[0];
    return exportFilenameFormat
      .replace(/\{engine\}/g, 'localstorage')
      .replace(/\{date\}/g, date)
      .replace(/\{dbName\}/g, lastDbName || 'ExplorerDB')
      .replace(/\{storeName\}/g, 'users')
      + '.json';
  }, [exportFilenameFormat, lastDbName]);

  const update = (key, fn) => (...args) => {
    fn(...args);
    markSaved(key);
    if (key === 'showInternalKeys') triggerRefresh();
  };

  const handleThemeSelect = (nextTheme) => {
    setTheme(nextTheme);
    showToast(`Theme set to ${nextTheme}`, 'success');
    markSaved('theme');
  };

  const handleClearStorage = (engine) => {
    const storage = engine === 'local' ? window.localStorage : window.sessionStorage;
    storage.clear();
    setDangerConfirm(null);
    showToast(`${engine === 'local' ? 'Local' : 'Session'}Storage cleared`, 'warning');
    markSaved(`clear-${engine}`);
  };

  const handleResetAll = () => {
    resetAllSettings();
    setDangerConfirm(null);
    showToast('Settings reset. Redirecting…', 'warning');
    setTimeout(() => navigate('/'), 1500);
  };

  const handlePlanToggle = (checked) => {
    const nextPlan = checked ? 'pro' : 'free';
    setPlan(nextPlan);
    showToast(`Plan simulation set to ${nextPlan.toUpperCase()}`, 'success');
    markSaved('plan');
  };

  return (
    <div className="settings-page">
      <SiteNavbar />

      <header className="settings-page-header">
        <div className="settings-page-header-inner">
          <div className="settings-page-header-left">
            <p className="settings-breadcrumb monospace">StorageExplorer / Settings</p>
            <h1 className="settings-page-title monospace">Settings</h1>
            <p className="settings-page-subtitle">
              Manage workspace, storage defaults, and data preferences.
            </p>
          </div>
          <div className="settings-page-header-right">
            <span className="settings-version-badge monospace">v1.0.0</span>
            <p className={`settings-autosave-status monospace${autosaveState === 'saving' ? ' saving' : ''}`}>
              <span className="settings-autosave-dot" />
              {autosaveState === 'saving' ? 'Saving...' : 'All changes auto-saved'}
            </p>
          </div>
        </div>
      </header>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-inner">
            <h2 className="settings-sidebar-title monospace">Settings</h2>
            <nav className="settings-sidebar-nav">
              {NAV_SECTIONS.map((group) => (
                <div key={group.group} className="settings-nav-group">
                  <div className="settings-nav-group-label monospace">{group.group}</div>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`settings-nav-item monospace${activeSection === item.id ? ' active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="settings-content-wrap">
          <div className="settings-content">
            {/* THEME */}
            <section id="theme" className="settings-section">
              <SectionHeading title="Theme" />
              <p className="settings-section-desc">Choose how StorageExplorer looks across all pages.</p>
              <div className="settings-theme-cards">
                {THEME_CARDS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className={`settings-theme-card${theme === card.id ? ' active' : ''}`}
                    onClick={() => handleThemeSelect(card.id)}
                    aria-pressed={theme === card.id}
                  >
                    {theme === card.id && (
                      <span className="settings-theme-check" aria-hidden="true">✓</span>
                    )}
                    <ThemePreview variant={card.id} />
                    <div className={`settings-theme-card-footer ${card.footer}`}>
                      <div className="settings-theme-card-label">
                        <span className="settings-theme-card-name">{card.name}</span>
                        {card.pill && <span className="settings-theme-pill monospace">{card.pill}</span>}
                      </div>
                      {card.sub && <p className="settings-theme-card-sub">{card.sub}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* LAYOUT */}
            <section id="layout" className="settings-section">
              <SectionHeading title="Layout" />
              <p className="settings-section-desc">Customize the workspace panel dimensions.</p>
              {SLIDERS.map((slider) => {
                const value = slider.key === 'panelWidth' ? panelWidth
                  : slider.key === 'hudHeight' ? hudHeight : fontSize;
                const setValue = slider.key === 'panelWidth' ? setPanelWidth
                  : slider.key === 'hudHeight' ? setHudHeight : setFontSize;
                const clamped = Math.min(slider.max, Math.max(slider.min, value));
                return (
                  <div key={slider.key} className="settings-slider-block">
                    <div className="settings-slider-header">
                      <span className="monospace">{slider.label}</span>
                      <span className="settings-slider-badge monospace">{clamped}{slider.unit}</span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={clamped}
                      className="settings-range"
                      onChange={(e) => {
                        updateSliderFill(e.target);
                        update(slider.key, setValue)(Number(e.target.value));
                      }}
                    />
                    <div className="settings-slider-limits monospace">
                      <span>{slider.min}{slider.unit}</span>
                      <span>{slider.max}{slider.unit}</span>
                    </div>
                  </div>
                );
              })}
              <button
                type="button"
                className="settings-reset-layout-btn monospace"
                onClick={() => { resetLayoutDefaults(); markSaved('layoutReset'); }}
              >
                Reset layout to defaults
              </button>
            </section>

            {/* STORAGE DEFAULTS */}
            <section id="storage-defaults" className="settings-section">
              <SectionHeading title="Storage defaults" />
              <p className="settings-section-desc">Configure default behavior when connecting to a storage engine.</p>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-label">Default engine on startup</div>
                </div>
                <div className="settings-row-control">
                  <SavedCheck visible={savedKeys.defaultEngine} />
                  <select
                    className="settings-select monospace"
                    value={defaultEngine}
                    onChange={(e) => update('defaultEngine', setDefaultEngine)(e.target.value)}
                  >
                    <option value="local">LocalStorage</option>
                    <option value="session">SessionStorage</option>
                    <option value="indexeddb">IndexedDB</option>
                  </select>
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-label">Default IndexedDB database name</div>
                </div>
                <div className="settings-row-control">
                  <SavedCheck visible={savedKeys.lastDbName} />
                  <input
                    className="settings-input monospace"
                    value={lastDbName}
                    onChange={(e) => update('lastDbName', setLastDbName)(e.target.value)}
                  />
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-label">Default IndexedDB version</div>
                </div>
                <div className="settings-row-control">
                  <SavedCheck visible={savedKeys.defaultIdbVersion} />
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="settings-input monospace settings-input-narrow"
                    value={defaultIdbVersion}
                    onChange={(e) => update('defaultIdbVersion', setDefaultIdbVersion)(Number(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-label">Auto-connect on startup</div>
                  <div className="settings-row-desc">Connect to the last used engine when the app loads.</div>
                </div>
                <div className="settings-row-control">
                  <SavedCheck visible={savedKeys.autoConnect} />
                  <Toggle checked={autoConnect} onChange={update('autoConnect', setAutoConnect)} />
                </div>
              </div>
              <div className="settings-row settings-row-last">
                <div className="settings-row-text">
                  <div className="settings-row-label">Show internal keys</div>
                  <div className="settings-row-desc">Show keys starting with dbExplorer_ in the LocalStorage table.</div>
                </div>
                <div className="settings-row-control">
                  <SavedCheck visible={savedKeys.showInternalKeys} />
                  <Toggle checked={showInternalKeys} onChange={update('showInternalKeys', setShowInternalKeys)} />
                </div>
              </div>
            </section>

            {/* EXPORT */}
            <section id="export-preferences" className="settings-section">
              <SectionHeading title="Export preferences" />
              <p className="settings-section-desc">Configure how data is exported.</p>
              <div className="settings-row settings-row-stack">
                <div className="settings-row-label">Export format</div>
                <div className="settings-radio-group">
                  {[
                    { id: 'minified', label: 'Minified JSON' },
                    { id: '2', label: 'Pretty-printed JSON (2 spaces)' },
                    { id: '4', label: 'Pretty-printed JSON (4 spaces)' },
                  ].map((opt) => (
                    <label key={opt.id} className="settings-radio monospace">
                      <input
                        type="radio"
                        name="exportFormat"
                        checked={exportFormat === opt.id}
                        onChange={() => update('exportFormat', setExportFormat)(opt.id)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-label">Include metadata</div>
                  <div className="settings-row-desc">Wrap exports with exportedAt, engine, version, and recordCount.</div>
                </div>
                <div className="settings-row-control">
                  <SavedCheck visible={savedKeys.exportIncludeMetadata} />
                  <Toggle checked={exportIncludeMetadata} onChange={update('exportIncludeMetadata', setExportIncludeMetadata)} />
                </div>
              </div>
              <div className="settings-row settings-row-last settings-row-stack">
                <div className="settings-row-label">Filename format</div>
                <input
                  className="settings-input monospace"
                  value={exportFilenameFormat}
                  placeholder="{engine}-{date}"
                  onChange={(e) => update('exportFilenameFormat', setExportFilenameFormat)(e.target.value)}
                />
                <p className="settings-helper monospace">Available variables: {'{engine}'}, {'{date}'}, {'{dbName}'}, {'{storeName}'}</p>
                <p className="settings-preview monospace">Preview: {exportPreview}</p>
              </div>
            </section>

            {/* ONBOARDING */}
            <section id="onboarding" className="settings-section">
              <SectionHeading title="Onboarding" />
              <p className="settings-section-desc">Manage the first-time walkthrough experience.</p>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-label">Walkthrough status</div>
                  <span className={`settings-status-badge monospace${onboarded ? ' done' : ' pending'}`}>
                    {onboarded ? 'Completed' : 'Not started'}
                  </span>
                </div>
                <button
                  type="button"
                  className="settings-btn-outline monospace"
                  onClick={() => {
                    localStorage.removeItem('dbExplorer_onboarded');
                    showToast('Walkthrough reset. Refresh the app to see it again.', 'success');
                    markSaved('onboardingReset');
                  }}
                >
                  Reset walkthrough
                </button>
              </div>
              <div className="settings-row settings-row-last">
                <div className="settings-row-text">
                  <div className="settings-row-label">Show hints in Playground</div>
                </div>
                <div className="settings-row-control">
                  <SavedCheck visible={savedKeys.showPlaygroundHints} />
                  <Toggle checked={showPlaygroundHints} onChange={update('showPlaygroundHints', setShowPlaygroundHints)} />
                </div>
              </div>
              <div className="settings-info-card monospace">
                The walkthrough runs automatically on first visit. Resetting it here will show it again on next app load.
              </div>
            </section>

            {/* SHORTCUTS */}
            <section id="plan-testing" className="settings-section">
              <SectionHeading title="Plan testing" />
              <p className="settings-section-desc">Developer-only simulation controls for pricing and usage-limit QA.</p>
              <div className="settings-row">
                <div className="settings-row-text">
                  <div className="settings-row-label">Simulate Pro plan</div>
                  <div className="settings-row-desc">Turns off free limits locally. No payment is processed.</div>
                </div>
                <div className="settings-row-control">
                  <SavedCheck visible={savedKeys.plan} />
                  <span className={`settings-plan-pill monospace ${plan}`}>{plan.toUpperCase()}</span>
                  <Toggle checked={isPro} onChange={handlePlanToggle} />
                </div>
              </div>
              <div className="settings-row settings-row-last">
                <div className="settings-row-text">
                  <div className="settings-row-label">Free usage snapshot</div>
                  <div className="settings-row-desc">
                    Exports today: {exportCountToday}/3 · Free database: {freeDatabaseName || 'not claimed yet'}
                  </div>
                </div>
                <button
                  type="button"
                  className="settings-btn-outline monospace"
                  onClick={() => {
                    clearExportUsage();
                    showToast('Daily export usage reset', 'success');
                    markSaved('planUsage');
                  }}
                >
                  Reset export usage
                </button>
                <button
                  type="button"
                  className="settings-btn-outline monospace"
                  onClick={() => {
                    clearFreeDatabase();
                    showToast('Free database claim reset', 'success');
                    markSaved('planDatabase');
                  }}
                >
                  Reset database claim
                </button>
              </div>
              <div className="settings-info-card monospace">
                This toggle only stores a local plan flag for testing. The production payment source can replace it later.
              </div>
            </section>

            {/* SHORTCUTS */}
            <section id="keyboard-shortcuts" className="settings-section">
              <SectionHeading title="Keyboard shortcuts" />
              <p className="settings-section-desc">All shortcuts are global and active anywhere in the app.</p>
              <div className="settings-shortcuts-grid">
                <div className="settings-shortcuts-card">
                  <h4 className="settings-shortcuts-header monospace">Navigation</h4>
                  <table className="settings-shortcut-table">
                    <tbody>
                      {SHORTCUT_NAV.map((item) => (
                        <tr key={item.action}>
                          <td>{item.action}</td>
                          <td className="settings-shortcut-keys">
                            {item.keys.map((k, i) => (
                              <React.Fragment key={k}>
                                {i > 0 && <span className="settings-shortcut-plus"> + </span>}
                                <kbd>{k}</kbd>
                              </React.Fragment>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="settings-shortcuts-card">
                  <h4 className="settings-shortcuts-header monospace">Data operations</h4>
                  <table className="settings-shortcut-table">
                    <tbody>
                      {SHORTCUT_DATA.map((item) => (
                        <tr key={item.action}>
                          <td>{item.action}</td>
                          <td className="settings-shortcut-keys">
                            {item.keys.map((k, i) => (
                              <React.Fragment key={k}>
                                {i > 0 && <span className="settings-shortcut-plus"> + </span>}
                                <kbd>{k}</kbd>
                              </React.Fragment>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="settings-roadmap monospace">Customize shortcuts coming in v1.1</p>
            </section>

            {/* DANGER ZONE */}
            <section id="danger-zone" className="settings-section">
              <SectionHeading title="Danger zone" danger />
              <p className="settings-section-desc">These actions are permanent and cannot be undone.</p>
              {[
                {
                  id: 'local',
                  title: 'Clear LocalStorage',
                  desc: "Removes all keys from this origin's LocalStorage, including app settings.",
                  confirm: 'Are you sure? This clears everything.',
                  action: () => handleClearStorage('local'),
                },
                {
                  id: 'session',
                  title: 'Clear SessionStorage',
                  desc: 'Removes all keys from SessionStorage for this origin.',
                  confirm: 'Are you sure? This clears everything.',
                  action: () => handleClearStorage('session'),
                },
                {
                  id: 'reset',
                  title: 'Reset all app settings',
                  desc: 'Clears workspace settings, onboarding state, and layout.',
                  confirm: 'Reset everything? This cannot be undone.',
                  action: handleResetAll,
                  btnLabel: 'Reset everything',
                },
              ].map((row) => (
                <div key={row.id} className="settings-danger-row">
                  <div className="settings-danger-text">
                    <div className="settings-danger-label">{row.title}</div>
                    <div className="settings-danger-desc">{row.desc}</div>
                    {dangerConfirm === row.id && (
                      <div className="settings-danger-confirm monospace">{row.confirm}</div>
                    )}
                  </div>
                  <div className="settings-danger-actions">
                    {dangerConfirm === row.id ? (
                      <>
                        <button type="button" className="settings-btn-danger-fill monospace danger-pulse" onClick={row.action}>Confirm</button>
                        <button type="button" className="settings-btn-outline monospace" onClick={() => setDangerConfirm(null)}>Cancel</button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="settings-btn-danger monospace"
                        onClick={() => setDangerConfirm(row.id)}
                      >
                        {row.btnLabel || 'Clear'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div className={`settings-saved-bar monospace${showSavedBar ? ' visible' : ''}`}>
            <i className="ti ti-check" /> All changes saved
          </div>
        </div>
      </div>
    </div>
  );
}
