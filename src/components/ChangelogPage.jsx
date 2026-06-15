import React, { useMemo, useState } from 'react';
import SiteNavbar from './SiteNavbar';
import './ChangelogPage.css';

const RELEASES = [
  {
    version: 'v1.0.0',
    date: 'June 2025',
    dot: 'green',
    badge: 'LATEST',
    title: 'Full release — all features complete',
    tags: ['Feature', 'Polish'],
    changes: [
      'Landing page with animated terminal demo',
      'Docs, About, Changelog pages',
      'Light / dark theme toggle',
      'Keyboard shortcuts modal',
      'Toast notification system',
      'Onboarding walkthrough',
      'Workspace persistence across reloads',
    ],
  },
  {
    version: 'v0.4.0',
    date: 'May 2025',
    dot: 'blue',
    title: 'Schema inspector + export',
    tags: ['Feature'],
    changes: [
      'Auto-detect foreign key relationships (Id, _id, _key patterns)',
      'Relations graph view in left panel',
      'JSON export for LocalStorage and IndexedDB',
      'Bottom HUD with real-time quota monitoring',
      'Transaction log panel (last 20 operations)',
    ],
  },
  {
    version: 'v0.3.0',
    date: 'April 2025',
    dot: 'blue',
    title: 'IndexedDB support',
    tags: ['Feature'],
    changes: [
      'Promisified IDBWrapper class (open, getAll, put, delete, getCount)',
      'Object store tree navigator in left panel',
      'Dynamic table — columns auto-generated from record keys',
      'Inline editing writes directly to IndexedDB',
      'Create new object stores from the UI',
    ],
  },
  {
    version: 'v0.2.0',
    date: 'March 2025',
    dot: 'amber',
    title: 'LocalStorage + SessionStorage reader',
    tags: ['Feature', 'Fix'],
    changes: [
      'Key-value table with inline editing',
      'Double-click to edit, Enter to save, Escape to cancel',
      'Delete rows with × button',
      'Add new key-value pairs from bottom form',
      'Filter keys by text input (real-time, case-insensitive)',
      'Byte weight calculation per row',
    ],
  },
  {
    version: 'v0.1.0',
    date: 'February 2025',
    dot: 'gray',
    title: 'Project scaffold',
    tags: ['Foundation'],
    changes: [
      '3-zone layout: top console, dual-pane workspace, bottom HUD',
      'Zustand global state setup',
      'Dark theme CSS variables',
      'Engine switcher (LOCAL / SESSION / IDB)',
      'React Router with / and /app routes',
    ],
  },
];

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'features', label: 'Features', match: (tags) => tags.includes('Feature') || tags.includes('Polish') },
  { id: 'fixes', label: 'Fixes', match: (tags) => tags.includes('Fix') },
];

function tagClass(tag) {
  const map = {
    Feature: 'tag-feature',
    Fix: 'tag-fix',
    Foundation: 'tag-foundation',
    Polish: 'tag-polish',
  };
  return map[tag] || 'tag-feature';
}

export default function ChangelogPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredReleases = useMemo(() => {
    const filter = FILTERS.find((f) => f.id === activeFilter);
    if (!filter?.match) return RELEASES;
    return RELEASES.filter((r) => filter.match(r.tags));
  }, [activeFilter]);

  return (
    <div className="changelog-page">
      <SiteNavbar />

      <header className="changelog-hero">
        <span className="changelog-eyebrow">release history</span>
        <h1 className="changelog-title monospace">Changelog</h1>
        <p className="changelog-subtitle">Every version of StorageExplorer, documented.</p>
        <p className="changelog-stats monospace">
          <span>5 releases</span>
          <span className="changelog-stats-sep">·</span>
          <span>12 weeks of development</span>
        </p>
      </header>

      <div className="changelog-filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={`changelog-filter-pill monospace${activeFilter === filter.id ? ' active' : ''}`}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="changelog-timeline">
        {filteredReleases.map((release, idx) => (
          <article
            key={release.version}
            className={`changelog-entry${idx < filteredReleases.length - 1 ? ' has-divider' : ''}`}
          >
            <div className={`changelog-dot changelog-dot-${release.dot}`} />
            <div className="changelog-entry-body">
              <div className="changelog-entry-meta">
                <span className="changelog-version monospace">{release.version}</span>
                <span className="changelog-date monospace">{release.date}</span>
                {release.badge && (
                  <span className="changelog-badge monospace">{release.badge}</span>
                )}
              </div>
              <h2 className="changelog-entry-title">{release.title}</h2>
              <div className="changelog-tags">
                {release.tags.map((tag) => (
                  <span key={tag} className={`changelog-tag monospace ${tagClass(tag)}`}>
                    [{tag}]
                  </span>
                ))}
              </div>
              <ul className="changelog-changes">
                {release.changes.map((change) => (
                  <li key={change} className="changelog-change monospace">
                    <span className="changelog-change-bullet">✦</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <footer className="changelog-footer monospace">
        StorageExplorer is a college project by Yuvraj Mishra · DTU · 2025
      </footer>
    </div>
  );
}
