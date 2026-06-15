import React from 'react';
import { useNavigate } from 'react-router-dom';
import SiteNavbar from './SiteNavbar';
import './LandingPage.css';

/* ── Simulated Product Screenshot ─────────────────────────── */

function ProductScreenshot() {
  return (
    <div className="lp-screenshot-wrap">
      <p className="lp-section-label monospace">LIVE PREVIEW</p>
      <div className="lp-screenshot-glow">
        <div className="lp-browser-frame">
          <span className="lp-live-badge monospace">
            <span className="lp-live-dot" aria-hidden="true" />
            LIVE
          </span>
          <div className="lp-browser-topbar">
            <div className="lp-browser-dots">
              <span className="lp-browser-dot red" />
              <span className="lp-browser-dot yellow" />
              <span className="lp-browser-dot green" />
            </div>
            <div className="lp-browser-url monospace">localhost:5173/app</div>
          </div>
          <div className="lp-screenshot">
            <div className="ss-topbar">
              <div className="ss-topbar-left">
                <span className="ss-btn">CONNECT</span>
                <span className="ss-badge">INDEXEDDB</span>
                <span className="ss-btn">NEW STORE</span>
                <span className="ss-btn">PURGE</span>
                <span className="ss-btn">EXPORT JSON</span>
              </div>
              <div className="ss-topbar-right">
                <span className="ss-pill">LOCAL</span>
                <span className="ss-pill">SESSION</span>
                <span className="ss-pill active">IDB</span>
                <span className="ss-filter">filter stores…</span>
              </div>
            </div>

            <div className="ss-main">
              <div className="ss-left">
                <div className="ss-panel-header">STORES</div>
                <div className="ss-tree-item selected">
                  <span className="ss-store-dot" /> USERS
                </div>
                <div className="ss-tree-item">
                  <span className="ss-store-dot" /> ORDERS
                </div>
                <div className="ss-tree-item">
                  <span className="ss-store-dot" /> PRODUCTS
                </div>
              </div>

              <div className="ss-right">
                <div className="ss-panel-header">
                  IndexedDB › users <span className="ss-count">3 records</span>
                </div>
                <div className="ss-table ss-table-idb">
                  <div className="ss-table-header">
                    <span>ID</span>
                    <span>NAME</span>
                    <span>EMAIL</span>
                    <span>ROLE</span>
                  </div>
                  <div className="ss-table-row even">
                    <span className="ss-val">1</span>
                    <span className="ss-val">Alice Chen</span>
                    <span className="ss-val">alice@acme.io</span>
                    <span className="ss-val">admin</span>
                  </div>
                  <div className="ss-table-row odd">
                    <span className="ss-val">2</span>
                    <span className="ss-val">Bob Rivera</span>
                    <span className="ss-val">bob@acme.io</span>
                    <span className="ss-val">editor</span>
                  </div>
                  <div className="ss-table-row even">
                    <span className="ss-val">3</span>
                    <span className="ss-val">Carol Wu</span>
                    <span className="ss-val">carol@acme.io</span>
                    <span className="ss-val">viewer</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="ss-hud ss-hud-compact">
              <span className="ss-hud-dot" />
              <span>ENGINE: <strong className="ss-green">INDEXEDDB</strong></span>
              <span className="ss-divider" />
              <span>USED: 5.2 KB / 11 GB</span>
              <span className="ss-divider" />
              <span>QUOTA: <span className="ss-bar"><span className="ss-bar-fill" style={{ width: '40%' }} /></span> 4%</span>
              <span className="ss-divider" />
              <span>LAST OP: GETALL &quot;users&quot; — 3ms</span>
              <span className="ss-divider" />
              <span>RELATIONS: <strong className="ss-green">2 INFERRED</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Animated Terminal Block ──────────────────────────────── */

const TERMINAL_LINES = [
  { text: '> Connecting to IndexedDB "MyAppDB"...', color: '#e0e0e0' },
  { text: '✓ Connected. Found 3 object stores.', color: '#4ade80' },
  { text: '> Loading store "users" — 248 records', color: '#e0e0e0' },
  { text: '✓ Detected 2 foreign key relationships.', color: '#4ade80' },
  { text: '> Exporting full database...', color: '#e0e0e0' },
  { text: '✓ Exported 18.4 KB → myappdb-2026-06-12.json', color: '#4ade80' },
];

const READY_LINE = {
  text: '> Ready. Launch StorageExplorer to inspect your own data.',
  color: '#888888',
};

function AnimatedTerminal() {
  const [displayedLines, setDisplayedLines] = React.useState([]);
  const [currentLineIndex, setCurrentLineIndex] = React.useState(0);
  const [currentCharIndex, setCurrentCharIndex] = React.useState(0);
  const [inProgressLineText, setInProgressLineText] = React.useState('');
  const [isPaused, setIsPaused] = React.useState(false);
  const [terminalFlash, setTerminalFlash] = React.useState(false);
  const [phase, setPhase] = React.useState('typing');

  const currentLineIndexRef = React.useRef(currentLineIndex);
  const currentCharIndexRef = React.useRef(currentCharIndex);
  const phaseRef = React.useRef(phase);

  React.useEffect(() => { currentLineIndexRef.current = currentLineIndex; }, [currentLineIndex]);
  React.useEffect(() => { currentCharIndexRef.current = currentCharIndex; }, [currentCharIndex]);
  React.useEffect(() => { phaseRef.current = phase; }, [phase]);

  React.useEffect(() => {
    let intervalId;
    let timeoutId;

    const resetAll = () => {
      setDisplayedLines([]);
      setCurrentLineIndex(0);
      setCurrentCharIndex(0);
      setInProgressLineText('');
      setPhase('typing');
      setIsPaused(false);
    };

    const tick = () => {
      const lineIdx = currentLineIndexRef.current;
      const charIdx = currentCharIndexRef.current;
      const currentPhase = phaseRef.current;

      if (currentPhase === 'typing' && lineIdx >= TERMINAL_LINES.length) {
        clearInterval(intervalId);
        setIsPaused(true);
        timeoutId = setTimeout(() => {
          setPhase('ready');
          setCurrentCharIndex(0);
          setInProgressLineText('');
          setIsPaused(false);
        }, 1000);
        return;
      }

      if (currentPhase === 'ready-wait') return;

      const activeLine = currentPhase === 'ready' ? READY_LINE : TERMINAL_LINES[lineIdx];

      if (charIdx < activeLine.text.length) {
        setInProgressLineText(activeLine.text.substring(0, charIdx + 1));
        setCurrentCharIndex((prev) => prev + 1);
      } else {
        clearInterval(intervalId);
        setIsPaused(true);
        timeoutId = setTimeout(() => {
          if (currentPhase === 'ready') {
            setDisplayedLines((prev) => [...prev, activeLine]);
            setInProgressLineText('');
            setPhase('ready-wait');
            timeoutId = setTimeout(resetAll, 3000);
            return;
          }
          if (activeLine.color === '#4ade80' && activeLine.text.startsWith('✓')) {
            setTerminalFlash(true);
            setTimeout(() => setTerminalFlash(false), 300);
          }
          setDisplayedLines((prev) => [...prev, activeLine]);
          setInProgressLineText('');
          setCurrentLineIndex((prev) => prev + 1);
          setCurrentCharIndex(0);
          setIsPaused(false);
        }, currentPhase === 'ready' ? 400 : 600);
      }
    };

    if (!isPaused && (phase === 'typing' || phase === 'ready')) {
      intervalId = setInterval(tick, 55);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPaused, phase]);

  const activeLine = phase === 'typing' && currentLineIndex < TERMINAL_LINES.length
    ? TERMINAL_LINES[currentLineIndex]
    : phase === 'ready'
      ? READY_LINE
      : null;

  return (
    <div className="lp-terminal-wrap">
      <p className="lp-section-label monospace">SEE IT IN ACTION</p>
      <div className={`animated-terminal${terminalFlash ? ' terminal-flash' : ''}`}>
        <div className="terminal-topbar">
          <div className="terminal-dots">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
          </div>
          <div className="terminal-title monospace">StorageExplorer</div>
        </div>
        <div className="terminal-content monospace">
          {displayedLines.map((line, idx) => (
            <div key={idx} className="terminal-line" style={{ color: line.color }}>
              {line.text}
            </div>
          ))}
          {activeLine && (
            <div className="terminal-line" style={{ color: activeLine.color }}>
              {inProgressLineText}
              <span className="terminal-cursor">|</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: 'ti-database',
    title: 'Unified view',
    desc: 'LocalStorage, SessionStorage, and IndexedDB from one interface.',
    size: 'large',
    decoration: 'ascii-table',
  },
  {
    icon: 'ti-edit',
    title: 'Live editing',
    desc: 'Double-click any cell to edit. Writes to real browser storage instantly.',
    size: 'small',
    decoration: 'editing',
  },
  {
    icon: 'ti-chart-bar',
    title: 'Quota monitor',
    desc: 'See storage usage update live after every read and write operation.',
    size: 'small',
  },
  {
    icon: 'ti-git-branch',
    title: 'Schema inspector',
    desc: 'Auto-detects foreign key relationships across your object stores.',
    size: 'large',
  },
  {
    icon: 'ti-download',
    title: 'JSON export',
    desc: 'Download a full backup of any storage engine with one click.',
    size: 'equal',
    decoration: 'json',
  },
  {
    icon: 'ti-bookmark',
    title: 'Workspace memory',
    desc: 'Remembers your last engine, open stores, and layout on reload.',
    size: 'equal',
  },
];

const COMPARISON_ROWS = [
  { feature: 'Inline cell editing', devtools: '✗', explorer: '✓' },
  { feature: 'Export as JSON', devtools: '✗', explorer: '✓' },
  { feature: 'Schema relationship detection', devtools: '✗', explorer: '✓' },
  { feature: 'Real-time quota monitoring', devtools: 'Partial', explorer: '✓' },
  { feature: 'All engines in one view', devtools: '✗', explorer: '✓' },
  { feature: 'Works without opening DevTools', devtools: '✗', explorer: '✓' },
];

const PERSONAS = [
  { icon: 'ti-code', title: 'Frontend developers', desc: 'Debug localStorage and sessionStorage without leaving your IDE workflow' },
  { icon: 'ti-device-mobile', title: 'PWA builders', desc: 'Inspect IndexedDB caches and verify offline data is stored correctly' },
  { icon: 'ti-bug', title: 'QA engineers', desc: 'Audit storage state before and after test scenarios' },
  { icon: 'ti-chart-bar', title: 'Students & learners', desc: 'Understand how browser storage works with a visual, interactive tool' },
];

function FeatureDecoration({ type }) {
  if (type === 'ascii-table') {
    return (
      <pre className="lp-feature-deco lp-feature-deco-ascii" aria-hidden="true">
        {`┌──┬──┐\n│k │v │\n└──┴──┘`}
      </pre>
    );
  }
  if (type === 'editing') {
    return (
      <span className="lp-feature-deco lp-feature-deco-edit monospace" aria-hidden="true">
        ▌editing<span className="lp-feature-deco-cursor">...</span>
      </span>
    );
  }
  if (type === 'json') {
    return (
      <span className="lp-feature-deco lp-feature-deco-json monospace" aria-hidden="true">
        {'{ json: true }'}
      </span>
    );
  }
  return null;
}

function ComparisonCell({ value }) {
  if (value === '✓') return <span className="lp-cmp-yes">✓</span>;
  if (value === '✗') return <span className="lp-cmp-no">✗</span>;
  if (value === 'Partial') return <span className="lp-cmp-partial">Partial</span>;
  return <span>{value}</span>;
}

/* ── Landing Page ─────────────────────────────────────────── */

export default function LandingPage() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px', threshold: 0.1 });

    const elements = document.querySelectorAll('.fade-in-section');
    elements.forEach((el) => observer.observe(el));
    return () => elements.forEach((el) => observer.unobserve(el));
  }, []);

  return (
    <div className="landing-page">
      <SiteNavbar />

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="lp-hero">
        <span className="lp-eyebrow">browser devtools, reimagined</span>
        <h1 className="lp-headline">Your browser's database,<br/>finally visible.</h1>
        <p className="lp-sub">
          Inspect, edit, and export LocalStorage, SessionStorage, and IndexedDB —<br/>
          no extensions, no servers, just your browser.
        </p>
        <button className="lp-cta" onClick={() => navigate('/app')}>Launch Explorer →</button>
        <p className="lp-compat">Works in Chrome, Firefox, Safari. No install needed.</p>
      </section>

      {/* ── STATS BAR ────────────────────────────────────── */}
      <section className="lp-stats-bar fade-in-section">
        <div className="lp-stats-container">
          <div className="lp-stat-item">
            <span className="lp-stat-number monospace">3</span>
            <span className="lp-stat-label monospace">Storage APIs</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-item">
            <span className="lp-stat-number monospace">6</span>
            <span className="lp-stat-label monospace">Core features</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-item">
            <span className="lp-stat-number monospace">&lt; 1s</span>
            <span className="lp-stat-label monospace">Load time</span>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat-item">
            <span className="lp-stat-number monospace">100%</span>
            <span className="lp-stat-label monospace">Client-side</span>
          </div>
        </div>
      </section>

      {/* ── PRODUCT SCREENSHOT ────────────────────────────── */}
      <section className="lp-screenshot-section fade-in-section">
        <ProductScreenshot />
      </section>

      {/* ── ANIMATED TERMINAL ─────────────────────────────── */}
      <section className="lp-terminal-section fade-in-section">
        <AnimatedTerminal />
      </section>

      {/* ── FEATURES GRID ────────────────────────────────── */}
      <section className="lp-features fade-in-section">
        <span className="lp-features-eyebrow monospace">WHY STORAGEEXPLORER</span>
        <h2 className="lp-features-title">Everything you need to inspect browser storage</h2>
        <div className="lp-features-grid">
          {FEATURES.map((card, idx) => (
            <div
              key={card.title}
              className={`lp-feature-card lp-feature-${card.size}`}
              data-index={idx}
            >
              <i className={`ti ${card.icon} lp-feature-icon`} />
              <h3 className="lp-feature-title-text">{card.title}</h3>
              <p className="lp-feature-desc-text">{card.desc}</p>
              {card.decoration && <FeatureDecoration type={card.decoration} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────── */}
      <section className="lp-comparison fade-in-section">
        <p className="lp-section-label monospace">VS BROWSER DEVTOOLS</p>
        <h2 className="lp-comparison-title">Everything DevTools can&apos;t do</h2>
        <div className="lp-comparison-table">
          <div className="lp-comparison-header">
            <span>Feature</span>
            <span>Browser DevTools</span>
            <span className="lp-comparison-se-col">◈ StorageExplorer</span>
          </div>
          {COMPARISON_ROWS.map((row, idx) => (
            <div key={row.feature} className={`lp-comparison-row${idx % 2 === 1 ? ' alt' : ''}`}>
              <span className="lp-comparison-feature monospace">{row.feature}</span>
              <span className="lp-comparison-cell"><ComparisonCell value={row.devtools} /></span>
              <span className="lp-comparison-cell"><ComparisonCell value={row.explorer} /></span>
            </div>
          ))}
        </div>
      </section>

      {/* ── BUILT FOR DEVELOPERS ─────────────────────────── */}
      <section className="lp-developers fade-in-section">
        <div className="lp-developers-inner">
          <div className="lp-developers-left">
            <p className="lp-section-label lp-section-label-left monospace">WHO IT&apos;S FOR</p>
            <h2 className="lp-developers-title">Built for developers who care about their data.</h2>
            <p className="lp-developers-desc">
              Whether you&apos;re debugging a React app&apos;s localStorage, inspecting an IndexedDB cache,
              or auditing storage usage before shipping — StorageExplorer gives you the visibility you need
              without opening a single DevTools panel.
            </p>
          </div>
          <div className="lp-developers-right">
            {PERSONAS.map((p) => (
              <div key={p.title} className="lp-persona-card">
                <i className={`ti ${p.icon} lp-persona-icon`} />
                <div>
                  <h3 className="lp-persona-title">{p.title}</h3>
                  <p className="lp-persona-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="lp-how fade-in-section">
        <h2 className="lp-how-title">How it works</h2>
        <div className="lp-how-steps">
          <div className="lp-how-step">
            <span className="lp-how-step-num monospace">01</span>
            <h3 className="lp-how-step-title">Connect</h3>
            <p className="lp-how-step-desc">Choose LocalStorage, SessionStorage, or IndexedDB. For IDB, enter a database name to open or create.</p>
          </div>
          <div className="lp-how-divider" />
          <div className="lp-how-step">
            <span className="lp-how-step-num monospace">02</span>
            <h3 className="lp-how-step-title">Explore</h3>
            <p className="lp-how-step-desc">Browse all your data in a live table. Filter by key, double-click to edit, delete rows inline.</p>
          </div>
          <div className="lp-how-divider" />
          <div className="lp-how-step">
            <span className="lp-how-step-num monospace">03</span>
            <h3 className="lp-how-step-title">Export</h3>
            <p className="lp-how-step-desc">Download the entire storage engine as a structured JSON file with one click.</p>
          </div>
        </div>
      </section>

      {/* ── QUOTE STRIP ─────────────────────────────────── */}
      <section className="lp-quote-strip fade-in-section">
        <span className="lp-quote-mark">&ldquo;</span>
        <blockquote className="lp-quote-text">
          The browser always had a database. Nobody gave us a proper way to look inside it.
        </blockquote>
        <div className="lp-quote-attribution monospace">— A developer who needed this</div>
        <div className="lp-quote-divider" />
        <blockquote className="lp-quote-text lp-quote-text-secondary">
          Finally, a tool that treats browser storage as a first-class citizen.
        </blockquote>
        <div className="lp-quote-attribution monospace">— Built for the modern web</div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────── */}
      <section className="lp-bottom-cta fade-in-section">
        <div className="lp-bottom-cta-grid" aria-hidden="true" />
        <div className="lp-bottom-cta-inner">
          <div className="lp-bottom-cta-pills">
            <span className="lp-engine-pill monospace"><span className="lp-pill-diamond">◈</span> LocalStorage</span>
            <span className="lp-engine-pill monospace"><span className="lp-pill-diamond">◈</span> SessionStorage</span>
            <span className="lp-engine-pill monospace"><span className="lp-pill-diamond">◈</span> IndexedDB</span>
          </div>
          <span className="lp-bottom-cta-label monospace">open source · free forever · no account</span>
          <h2 className="lp-bottom-cta-title monospace">Ready to look inside your browser?</h2>
          <p className="lp-bottom-cta-sub">Join developers who finally have a proper browser storage tool.</p>
          <div className="lp-bottom-cta-buttons">
            <button className="lp-cta-primary" onClick={() => navigate('/app')}>Launch Explorer →</button>
            <button className="lp-cta-secondary" onClick={() => navigate('/docs')}>View Docs →</button>
          </div>
          <p className="lp-bottom-cta-compat">Works in Chrome · Firefox · Safari · No install needed</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-left" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '700', color: '#4ade80' }}>◈</span>
          <span style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '500', color: '#e0e0e0', marginLeft: '6px' }}>StorageExplorer</span>
        </div>
        <div className="lp-footer-right monospace">
          Built by Yuvraj Mishra · ITM University · 2026
        </div>
      </footer>
    </div>
  );
}
