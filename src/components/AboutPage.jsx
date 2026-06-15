import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SiteNavbar from './SiteNavbar';
import './AboutPage.css';

function AnimatedStat({ value, label, suffix = '' }) {
  const [display, setDisplay] = useState(typeof value === 'number' ? 0 : value);
  const ref = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (typeof value !== 'number') {
      setDisplay(value);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || hasAnimated.current) return;
      hasAnimated.current = true;

      const duration = 800;
      const stepMs = 30;
      const steps = Math.ceil(duration / stepMs);
      const increment = value / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step += 1;
        current = Math.min(value, Math.round(increment * step));
        setDisplay(current);
        if (step >= steps) {
          setDisplay(value);
          clearInterval(timer);
        }
      }, stepMs);

      observer.disconnect();
    }, { threshold: 0.3 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div className="about-stat-card" ref={ref}>
      <span className="about-stat-num monospace counting">{display}{suffix}</span>
      <span className="about-stat-label monospace">{label}</span>
    </div>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <SiteNavbar />

      {/* ── 1. HERO SECTION ────────────────────────────────── */}
      <header className="about-hero">
        <div className="about-hero-inner">
          <div className="about-hero-left">
            <span className="about-eyebrow">college project · 2026</span>
            <h1 className="about-title">About StorageExplorer</h1>
            <p className="about-subtitle">A frontend-only browser database management tool.</p>
          </div>
          <div className="about-hero-right">
            <div className="about-ascii-box">
              <pre className="about-ascii monospace">
{`┌─────────────────────┐
│  ◈ StorageExplorer  │
├─────────────────────┤
│  engine  : IndexedDB│
│  stores  : 3        │
│  records : 248      │
│  quota   : 4%       │
│  version : 1.0.0    │
└─────────────────────┘`}
              </pre>
            </div>
          </div>
        </div>
        <div className="about-hero-accent-line" aria-hidden="true" />
      </header>

      {/* ── 2. STATS ROW ───────────────────────────────────── */}
      <section className="about-stats-row">
        <div className="about-stats-container">
          <AnimatedStat value={3} label="Storage engines" />
          <div className="about-stat-divider"></div>
          <AnimatedStat value={6} label="Core features" />
          <div className="about-stat-divider"></div>
          <AnimatedStat value={100} suffix="%" label="Client-side" />
          <div className="about-stat-divider"></div>
          <AnimatedStat value={0} label="Dependencies" />
        </div>
      </section>

      {/* Centered Content Wrapper for sections */}
      <div className="about-content">
        
        {/* ── 3. THE PROJECT SECTION ──────────────────────── */}
        <section className="about-section">
          <div className="about-project-grid">
            <div className="about-project-left">
              <h2 className="about-section-heading">What it does</h2>
              <p className="about-text">
                StorageExplorer was built as a college project to explore browser storage APIs in depth.
                The goal was to create a developer tool that works entirely client-side — no backend,
                no database — while offering the same inspection and editing experience as tools like
                pgAdmin or MongoDB Compass.
              </p>
              <p className="about-text">
                The project covers LocalStorage, SessionStorage, and IndexedDB, with features including
                inline editing, quota monitoring, schema relationship inference, and JSON export.
              </p>
            </div>
            <div className="about-project-right">
              <div className="about-goals-card">
                <h3 className="about-card-title"><span className="about-goals-prefix">§</span> Project goals</h3>
                <ul className="about-goals-list monospace">
                  <li><span className="checkmark">✓</span> Replace browser DevTools storage tab</li>
                  <li><span className="checkmark">✓</span> Support all 3 browser storage APIs</li>
                  <li><span className="checkmark">✓</span> Zero server, zero install</li>
                  <li><span className="checkmark">✓</span> Real-time quota monitoring</li>
                  <li><span className="checkmark">✓</span> Auto-detect schema relationships</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. BUILT WITH TECH CARDS ─────────────────────── */}
        <section className="about-section">
          <h2 className="about-section-heading">Built With</h2>
          <div className="about-tech-grid">
            {[
              { name: 'React', icon: 'ti-brand-react', desc: 'UI & component architecture' },
              { name: 'Zustand', icon: 'ti-circle-dot', desc: 'Lightweight global state' },
              { name: 'IndexedDB API', icon: 'ti-database', desc: 'Native browser database' },
              { name: 'CSS Grid', icon: 'ti-layout', desc: 'Layout & dual-pane split' },
              { name: 'Vite', icon: 'ti-bolt', desc: 'Build tool & dev server' },
            ].map((tech) => (
              <div key={tech.name} className="about-tech-card">
                <i className={`ti ${tech.icon} about-tech-icon`}></i>
                <h3 className="about-tech-name">{tech.name}</h3>
                <p className="about-tech-desc">{tech.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 5. TIMELINE SECTION ──────────────────────────── */}
        <section className="about-section">
          <h2 className="about-section-heading centered">Development timeline</h2>
          <div className="about-timeline-container">
            <div className="about-timeline">
              {[
                { week: 'Week 1', title: 'Research & paper writing', desc: 'Studied LocalStorage, SessionStorage, IndexedDB APIs.' },
                { week: 'Week 2', title: 'UI scaffold', desc: 'Built 3-zone layout, Zustand store, dark theme.' },
                { week: 'Week 3', title: 'Storage engines', desc: 'Implemented LocalStorage and SessionStorage readers with inline editing.' },
                { week: 'Week 4', title: 'IndexedDB', desc: 'Built promisified IDBWrapper, object store tree, dynamic table.' },
                { week: 'Week 5', title: 'Polish', desc: 'Quota monitor, schema inspector, JSON export, landing page.' },
              ].map((item, idx) => (
                <div key={idx} className="about-timeline-item">
                  <div className="about-timeline-dot"></div>
                  <div className="about-timeline-content">
                    <span className="about-timeline-week monospace">{item.week}</span>
                    <h3 className="about-timeline-title">{item.title}</h3>
                    <p className="about-timeline-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. RESEARCH PAPER FEATURED CARD ─────────────── */}
        <section className="about-section">
          <h2 className="about-section-heading">Research Paper</h2>
          <div className="about-paper-card">
            <div className="about-paper-left">
              <div className="about-paper-icon-wrapper">
                <i className="ti ti-file-text about-paper-icon"></i>
              </div>
              <div className="about-paper-details">
                <span className="about-paper-eyebrow-label monospace">Research Paper</span>
                <h3 className="about-paper-title">
                  Web Storage Local Database Schema Explorer — A Frontend Architecture Study
                </h3>
                <p className="about-paper-meta">ITM University · 2026</p>
              </div>
            </div>
            <div className="about-paper-right">
              <button className="about-paper-action-btn" onClick={() => {}}>
                Read the paper →
              </button>
            </div>
          </div>
        </section>

        {/* ── 7. AUTHOR CARD ───────────────────────────────── */}
        <section className="about-section about-author-section">
          <div className="about-author-outer">
            <h2 className="about-section-heading">Author</h2>
            <div className="about-author-card">
            <div className="about-author-left">
              <div className="about-avatar-wrap">
                <div className="about-avatar">YM</div>
              </div>
              <div className="about-author-details">
                <h3 className="about-author-name">Yuvraj Mishra</h3>
                <p className="about-author-role monospace">Computer Science Student</p>
                <p className="about-author-college">ITM University</p>
                <p className="about-author-bio">Building tools for developers, one API at a time.</p>
              </div>
            </div>
            <div className="about-author-right">
              <h4 className="about-connect-title monospace">Connect</h4>
              <div className="about-author-links">
                <a className="about-link-btn" href="https://www.linkedin.com/in/yuvraj-mishra-b4184637a" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                  <i className="ti ti-brand-linkedin"></i>
                </a>
                <a className="about-link-btn" href="mailto:yuvrajam9@gmail.com" title="Email">
                  <i className="ti ti-mail"></i>
                </a>
              </div>
              <div className="about-author-tags">
                <span className="about-tag-pill">Open Source</span>
                <span className="about-tag-pill">College Project</span>
                <span className="about-tag-pill">Frontend</span>
                <span className="about-tag-pill">Browser APIs</span>
              </div>
            </div>
            </div>
          </div>
        </section>

        {/* ── 8. FOOTER ────────────────────────────────────── */}
        <footer className="about-footer">
          <span className="about-back-link" onClick={() => navigate('/')}>
            ← Back to home
          </span>
          <span className="about-copyright">© 2026 StorageExplorer</span>
        </footer>
      </div>
    </div>
  );
}
