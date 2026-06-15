import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteNavbar from './SiteNavbar';
import './DocsPage.css';

export default function DocsPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEngine, setExpandedEngine] = useState('local');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const sections = document.querySelectorAll('.docs-section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-64px 0px -60% 0px',
        threshold: 0,
      },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (id) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const QUICK_START_TERMINAL = `$ open localhost:5173
✓ StorageExplorer loaded successfully

$ click "Connect" → select "LocalStorage"
✓ Connected · 3 keys found · 378 B used

$ double-click any value cell to edit
✓ Changes written to browser storage instantly

$ click "Export JSON" in the top bar
✓ localstorage-2025-06-15.json downloaded`;

  const handleCopy = () => {
    navigator.clipboard.writeText(QUICK_START_TERMINAL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleEngine = (engine) => {
    setExpandedEngine(prev => prev === engine ? null : engine);
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'getting-started', label: 'Getting started' },
        { id: 'storage-engines', label: 'Storage engines' }
      ]
    },
    {
      title: 'USAGE',
      items: [
        { id: 'editing-data', label: 'Editing data' },
        { id: 'export-backup', label: 'Export & backup' },
        { id: 'keyboard-shortcuts', label: 'Keyboard shortcuts' }
      ]
    },
    {
      title: 'REFERENCE',
      items: [
        { id: 'api-reference', label: 'API reference' },
        { id: 'limitations', label: 'Limitations' }
      ]
    }
  ];

  return (
    <div className="docs-page">
      <SiteNavbar showDocsBadge />

      {/* ── MAIN CONTENT AREA ─────────────────────────────── */}
      <div className="docs-layout">
        {/* Left Sidebar */}
        <aside className="docs-sidebar">
          <div className="docs-sidebar-header">
            <input
              type="text"
              className="docs-search-input monospace"
              placeholder="Search docs…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="docs-version-badge monospace">v1.0.0</div>
          </div>

          <nav className="docs-sidebar-nav">
            {navGroups.map((group) => {
              // Simple client-side search filtering on category items
              const filteredItems = group.items.filter(item =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase())
              );

              if (filteredItems.length === 0) return null;

              return (
                <div key={group.title} className="docs-sidebar-group">
                  <h4 className="docs-sidebar-group-label monospace">{group.title}</h4>
                  <div className="docs-sidebar-group-items">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        className={`docs-nav-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => handleNavClick(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="docs-sidebar-footer">
            <button className="docs-sidebar-launch-btn" onClick={() => navigate('/app')}>
              Launch App →
            </button>
          </div>
        </aside>

        {/* Right Scrollable Area */}
        <main className="docs-content">
          {/* 1. Getting Started */}
          <section id="getting-started" className="docs-section">
            <h2>Getting started</h2>
            <p className="docs-paragraph">
              StorageExplorer runs entirely in your browser. No install, no server, no account.
            </p>
            <div className="docs-step-cards">
              <div className="docs-step-card">
                <span className="docs-step-card-num monospace">01</span>
                <h4 className="docs-step-card-title">Open the app</h4>
                <p className="docs-step-card-desc">Navigate to StorageExplorer in your browser — no install required.</p>
              </div>
              <span className="docs-step-arrow" aria-hidden="true">→</span>
              <div className="docs-step-card">
                <span className="docs-step-card-num monospace">02</span>
                <h4 className="docs-step-card-title">Connect a storage engine</h4>
                <p className="docs-step-card-desc">Choose LocalStorage, SessionStorage, or IndexedDB from the Connect menu.</p>
              </div>
              <span className="docs-step-arrow" aria-hidden="true">→</span>
              <div className="docs-step-card">
                <span className="docs-step-card-num monospace">03</span>
                <h4 className="docs-step-card-title">Browse, edit, and export</h4>
                <p className="docs-step-card-desc">Inspect keys and records, edit inline, and export your data as JSON.</p>
              </div>
            </div>

            {/* Quick start code block */}
            <div className="docs-quick-start">
              <h3 className="docs-subsection-title">Quick start</h3>
              <div className="docs-code-block terminal-theme">
                <div className="docs-code-block-header">
                  <div className="terminal-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <span className="docs-terminal-label monospace">terminal</span>
                  <button className="docs-code-copy-btn" onClick={handleCopy} title="Copy to clipboard">
                    <i className={`ti ${copied ? 'ti-check' : 'ti-copy'}`} />
                    {copied && <span className="docs-copy-feedback monospace">Copied!</span>}
                  </button>
                </div>
                <div className="docs-terminal-body monospace">
                  <div className="docs-terminal-line">
                    <span className="docs-terminal-prompt">$</span>
                    <span className="docs-terminal-cmd"> open localhost:5173</span>
                  </div>
                  <div className="docs-terminal-success">✓ StorageExplorer loaded successfully</div>
                  <div className="docs-terminal-blank" />
                  <div className="docs-terminal-line">
                    <span className="docs-terminal-prompt">$</span>
                    <span className="docs-terminal-cmd"> click &quot;Connect&quot; → select &quot;LocalStorage&quot;</span>
                  </div>
                  <div className="docs-terminal-success">✓ Connected · 3 keys found · 378 B used</div>
                  <div className="docs-terminal-blank" />
                  <div className="docs-terminal-line">
                    <span className="docs-terminal-prompt">$</span>
                    <span className="docs-terminal-cmd"> double-click any value cell to edit</span>
                  </div>
                  <div className="docs-terminal-success">✓ Changes written to browser storage instantly</div>
                  <div className="docs-terminal-blank" />
                  <div className="docs-terminal-line">
                    <span className="docs-terminal-prompt">$</span>
                    <span className="docs-terminal-cmd"> click &quot;Export JSON&quot; in the top bar</span>
                  </div>
                  <div className="docs-terminal-success">✓ localstorage-2025-06-15.json downloaded</div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Storage Engines */}
          <section id="storage-engines" className="docs-section">
            <h2>Storage engines</h2>
            <p className="docs-paragraph">
              Modern browsers offer a range of mechanisms to store data locally on a user's device. Each engine serves a different purpose, balancing capacity, duration, and access methods.
            </p>
            <div className="docs-table-wrapper">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Engine</th>
                    <th>Persistence</th>
                    <th>Capacity</th>
                    <th>Use case</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>LocalStorage</code></td>
                    <td>permanent</td>
                    <td>~5MB</td>
                    <td>user preferences, cached data</td>
                  </tr>
                  <tr>
                    <td><code>SessionStorage</code></td>
                    <td>tab lifetime</td>
                    <td>~5MB</td>
                    <td>temporary form state</td>
                  </tr>
                  <tr>
                    <td><code>IndexedDB</code></td>
                    <td>permanent</td>
                    <td>hundreds of MB</td>
                    <td>structured app data, offline apps</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Accordions */}
            <div className="docs-accordions">
              {/* Accordion 1 */}
              <div className={`docs-accordion-card ${expandedEngine === 'local' ? 'open' : ''}`}>
                <button className="docs-accordion-header" onClick={() => toggleEngine('local')}>
                  <span className="docs-accordion-title">
                    <i className="ti ti-database accordion-icon"></i> LocalStorage
                  </span>
                  <span className="docs-accordion-badge monospace">~5MB · Permanent</span>
                </button>
                <div className="docs-accordion-body">
                  <p className="docs-accordion-text">
                    <strong>Best for:</strong> user preferences, feature flags, cached API responses, theme settings.
                  </p>
                  <div className="docs-note warning">
                    <p>Data persists indefinitely. Always export before clearing.</p>
                  </div>
                  <div className="docs-mini-code">
                    <pre className="monospace">
                      <code>
{`localStorage.setItem('theme', 'dark');
localStorage.getItem('theme');`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Accordion 2 */}
              <div className={`docs-accordion-card ${expandedEngine === 'session' ? 'open' : ''}`}>
                <button className="docs-accordion-header" onClick={() => toggleEngine('session')}>
                  <span className="docs-accordion-title">
                    <i className="ti ti-refresh accordion-icon"></i> SessionStorage
                  </span>
                  <span className="docs-accordion-badge monospace">~5MB · Tab lifetime</span>
                </button>
                <div className="docs-accordion-body">
                  <p className="docs-accordion-text">
                    <strong>Best for:</strong> multi-step form state, wizard progress, temporary search filters.
                  </p>
                  <div className="docs-note info">
                    <p>Cleared automatically when the tab closes. No manual cleanup needed.</p>
                  </div>
                  <div className="docs-mini-code">
                    <pre className="monospace">
                      <code>
{`sessionStorage.setItem('step', '2');`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Accordion 3 */}
              <div className={`docs-accordion-card ${expandedEngine === 'idb' ? 'open' : ''}`}>
                <button className="docs-accordion-header" onClick={() => toggleEngine('idb')}>
                  <span className="docs-accordion-title">
                    <i className="ti ti-circles-relation accordion-icon"></i> IndexedDB
                  </span>
                  <span className="docs-accordion-badge monospace">100MB+ · Permanent</span>
                </button>
                <div className="docs-accordion-body">
                  <p className="docs-accordion-text">
                    <strong>Best for:</strong> offline apps, large datasets, structured relational-like data, file storage.
                  </p>
                  <div className="docs-note success">
                    <p>StorageExplorer's most powerful feature. Supports object stores, indexes, and transactions.</p>
                  </div>
                  <div className="docs-mini-code">
                    <pre className="monospace">
                      <code>
{`const db = await idbWrapper.open('MyAppDB', 1);`}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Editing Data */}
          <section id="editing-data" className="docs-section">
            <h2>Editing data</h2>
            <p className="docs-paragraph">
              Double-click any cell in the data table to edit it inline. Press Enter to save, Escape to cancel.
            </p>

            {/* Visual Step-by-Step Flow */}
            <div className="docs-flow-container">
              <div className="docs-flow-box monospace">Double-click cell</div>
              <div className="docs-flow-arrow">→</div>
              <div className="docs-flow-box monospace">Input opens</div>
              <div className="docs-flow-arrow">→</div>
              <div className="docs-flow-box monospace">Edit value</div>
              <div className="docs-flow-arrow">→</div>
              <div className="docs-flow-box monospace">Press Enter</div>
              <div className="docs-flow-arrow">→</div>
              <div className="docs-flow-box monospace">Written to storage</div>
            </div>

            {/* Warning card below flow */}
            <div className="docs-warning-card">
              <span className="docs-warning-title">⚠ No undo available</span>
              <p className="docs-warning-text">
                Changes write to the real browser storage immediately. Export a backup before making bulk edits.
              </p>
            </div>
          </section>

          {/* 4. Export & Backup */}
          <section id="export-backup" className="docs-section">
            <h2>Export & backup</h2>
            <p className="docs-paragraph">
              Click Export JSON in the top bar or the HUD to download the entire selected storage as a .json file.
            </p>
            <div className="docs-code-block">
              <pre>
                <code>
{`{
  "engine": "local",
  "exportedAt": "2026-06-11T17:42:02.000Z",
  "data": {
    "user.settings": "{\\"theme\\":\\"dark\\",\\"lang\\":\\"en\\"}",
    "app.theme": "dark"
  }
}`}
                </code>
              </pre>
            </div>
          </section>

          {/* 5. Keyboard Shortcuts */}
          <section id="keyboard-shortcuts" className="docs-section">
            <h2>Keyboard shortcuts</h2>
            <p className="docs-paragraph">
              Access core features instantly using system-wide keyboard shortcuts.
            </p>

            <div className="docs-shortcuts-grid">
              {/* Navigation Group */}
              <div className="docs-shortcuts-card">
                <h4 className="docs-shortcuts-header monospace">Navigation</h4>
                <div className="docs-shortcuts-list">
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Ctrl + 1</kbd>
                    <span className="docs-shortcut-desc">Switch to LocalStorage</span>
                  </div>
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Ctrl + 2</kbd>
                    <span className="docs-shortcut-desc">Switch to SessionStorage</span>
                  </div>
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Ctrl + 3</kbd>
                    <span className="docs-shortcut-desc">Switch to IndexedDB</span>
                  </div>
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Ctrl + F</kbd>
                    <span className="docs-shortcut-desc">Focus filter input</span>
                  </div>
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">?</kbd>
                    <span className="docs-shortcut-desc">Open shortcuts modal</span>
                  </div>
                </div>
              </div>

              {/* Data Group */}
              <div className="docs-shortcuts-card">
                <h4 className="docs-shortcuts-header monospace">Data operations</h4>
                <div className="docs-shortcuts-list">
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Enter</kbd>
                    <span className="docs-shortcut-desc">Save inline edit</span>
                  </div>
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Escape</kbd>
                    <span className="docs-shortcut-desc">Cancel inline edit</span>
                  </div>
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Ctrl + E</kbd>
                    <span className="docs-shortcut-desc">Export current engine</span>
                  </div>
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Ctrl + R</kbd>
                    <span className="docs-shortcut-desc">Refresh current store</span>
                  </div>
                  <div className="docs-shortcut-row">
                    <kbd className="monospace">Ctrl + L</kbd>
                    <span className="docs-shortcut-desc">Toggle HUD log panel</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. API Reference (New Section) */}
          <section id="api-reference" className="docs-section">
            <h2>API reference</h2>
            <p className="docs-paragraph-sub monospace">
              The IDBWrapper class — promisified IndexedDB for async/await usage.
            </p>

            <div className="docs-api-methods">
              {/* Method 1 */}
              <div className="docs-method-card">
                <div className="docs-method-header">
                  <span className="docs-method-signature monospace">open(dbName, version)</span>
                  <span className="docs-method-return monospace">Promise&lt;IDBDatabase&gt;</span>
                </div>
                <div className="docs-method-body">
                  <p className="docs-method-desc">
                    Opens or creates an IndexedDB database. Triggers schema upgrade if version is higher than existing.
                  </p>
                  <div className="docs-method-example monospace">
                    idbWrapper.open('MyAppDB', 1);
                  </div>
                </div>
              </div>

              {/* Method 2 */}
              <div className="docs-method-card">
                <div className="docs-method-header">
                  <span className="docs-method-signature monospace">getAll(storeName)</span>
                  <span className="docs-method-return monospace">Promise&lt;any[]&gt;</span>
                </div>
                <div className="docs-method-body">
                  <p className="docs-method-desc">
                    Returns all records from an object store as an array.
                  </p>
                  <div className="docs-method-example monospace">
                    idbWrapper.getAll('users');
                  </div>
                </div>
              </div>

              {/* Method 3 */}
              <div className="docs-method-card">
                <div className="docs-method-header">
                  <span className="docs-method-signature monospace">put(storeName, record)</span>
                  <span className="docs-method-return monospace">Promise&lt;IDBValidKey&gt;</span>
                </div>
                <div className="docs-method-body">
                  <p className="docs-method-desc">
                    Inserts or updates a record. Uses the store's keyPath to identify existing records.
                  </p>
                  <div className="docs-method-example monospace">
                    idbWrapper.put('users', &#123; id: 1, name: 'Alice' &#125;);
                  </div>
                </div>
              </div>

              {/* Method 4 */}
              <div className="docs-method-card">
                <div className="docs-method-header">
                  <span className="docs-method-signature monospace">delete(storeName, id)</span>
                  <span className="docs-method-return monospace">Promise&lt;void&gt;</span>
                </div>
                <div className="docs-method-body">
                  <p className="docs-method-desc">
                    Deletes the record with the given primary key.
                  </p>
                  <div className="docs-method-example monospace">
                    idbWrapper.delete('users', 1);
                  </div>
                </div>
              </div>

              {/* Method 5 */}
              <div className="docs-method-card">
                <div className="docs-method-header">
                  <span className="docs-method-signature monospace">getCount(storeName)</span>
                  <span className="docs-method-return monospace">Promise&lt;number&gt;</span>
                </div>
                <div className="docs-method-body">
                  <p className="docs-method-desc">
                    Returns the total number of records in a store.
                  </p>
                  <div className="docs-method-example monospace">
                    idbWrapper.getCount('users');
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Limitations */}
          <section id="limitations" className="docs-section">
            <h2>Limitations</h2>
            <p className="docs-paragraph">
              Understanding browser sandbox constraints is key when developing storage-dependent apps:
            </p>

            <div className="docs-limitations-grid">
              {/* Card 1 */}
              <div className="docs-limitation-card">
                <div className="docs-limitation-header">
                  <i className="ti ti-alert-triangle docs-limitation-icon"></i>
                  <h4 className="docs-limitation-title">UTF-16 byte estimation</h4>
                </div>
                <p className="docs-limitation-desc">
                  Byte weight is calculated as (key.length + value.length) × 2, assuming UTF-16 encoding. May undercount emoji and special characters.
                </p>
              </div>

              {/* Card 2 */}
              <div className="docs-limitation-card">
                <div className="docs-limitation-header">
                  <i className="ti ti-alert-triangle docs-limitation-icon"></i>
                  <h4 className="docs-limitation-title">Heuristic FK detection</h4>
                </div>
                <p className="docs-limitation-desc">
                  Foreign key relationships are inferred by field name patterns (Id, _id, _key). May produce false positives on unrelated fields.
                </p>
              </div>

              {/* Card 3 */}
              <div className="docs-limitation-card">
                <div className="docs-limitation-header">
                  <i className="ti ti-alert-triangle docs-limitation-icon"></i>
                  <h4 className="docs-limitation-title">Quota estimates only</h4>
                </div>
                <p className="docs-limitation-desc">
                  navigator.storage.estimate() returns browser-approximated values, not exact usage. Actual limits vary by browser and system.
                </p>
              </div>

              {/* Card 4 */}
              <div className="docs-limitation-card">
                <div className="docs-limitation-header">
                  <i className="ti ti-alert-triangle docs-limitation-icon"></i>
                  <h4 className="docs-limitation-title">Origin-scoped access</h4>
                </div>
                <p className="docs-limitation-desc">
                  IndexedDB is sandboxed per origin. StorageExplorer can only access data from the same domain it runs on.
                </p>
              </div>
            </div>

            <p className="docs-limitations-note">
              These limitations are documented in the accompanying research paper — Web Storage Local Database Schema Explorer, Delhi Technological University, 2025.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
