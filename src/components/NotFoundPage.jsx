import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SiteNavbar from './SiteNavbar';
import './NotFoundPage.css';

const CHAR_DELAY_MS = 40;
const START_DELAY_MS = 300;

function buildTerminalScript(pathname) {
  return [
    {
      segments: [{ text: '> ERROR: Store not found', className: 'nf-term-red' }],
      pause: 350,
    },
    {
      segments: [
        { text: '> Path: ', className: 'nf-term-muted' },
        { text: pathname, className: 'nf-term-green' },
      ],
      pause: 350,
    },
    {
      segments: [{ text: '> Searching all object stores...', className: 'nf-term-muted' }],
      pause: 350,
    },
    {
      segments: [{ text: '✗ No records matched. Query returned 0 results.', className: 'nf-term-red' }],
      pause: 350,
    },
    {
      segments: [{ text: '> Suggestion: check the URL or return to home', className: 'nf-term-dim' }],
      pause: 0,
    },
  ];
}

function formatTimestamp(date) {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function renderLine(line, key) {
  if (!line) return null;
  return (
    <div key={key} className="nf-terminal-line">
      {line.segments.map((seg, idx) => (
        <span key={idx} className={seg.className}>
          {seg.text}
        </span>
      ))}
    </div>
  );
}

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const script = useMemo(() => buildTerminalScript(pathname), [pathname]);

  const [completedLines, setCompletedLines] = useState([]);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [inProgressSegments, setInProgressSegments] = useState([]);
  const [typingDone, setTypingDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  const timestamp = useMemo(() => formatTimestamp(new Date()), []);

  useEffect(() => {
    const fadeTimer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(fadeTimer);
  }, []);

  useEffect(() => {
    setCompletedLines([]);
    setActiveLineIndex(0);
    setSegmentIndex(0);
    setCharIndex(0);
    setInProgressSegments([]);
    setTypingDone(false);
  }, [pathname]);

  useEffect(() => {
    if (typingDone) return;

    let startTimer;
    let charTimer;
    let pauseTimer;

    const startTyping = () => {
      const line = script[activeLineIndex];
      if (!line) {
        setTypingDone(true);
        return;
      }

      const segment = line.segments[segmentIndex];
      if (!segment) {
        setCompletedLines((prev) => [...prev, line]);
        setInProgressSegments([]);
        setSegmentIndex(0);
        setCharIndex(0);

        if (activeLineIndex >= script.length - 1) {
          setTypingDone(true);
          return;
        }

        pauseTimer = setTimeout(() => {
          setActiveLineIndex((prev) => prev + 1);
        }, line.pause);
        return;
      }

      if (charIndex < segment.text.length) {
        const nextChar = segment.text[charIndex];
        setInProgressSegments((prev) => {
          const next = [...prev];
          if (!next[segmentIndex]) {
            next[segmentIndex] = { text: '', className: segment.className };
          }
          next[segmentIndex] = {
            ...next[segmentIndex],
            text: next[segmentIndex].text + nextChar,
          };
          return next;
        });
        charTimer = setTimeout(() => setCharIndex((prev) => prev + 1), CHAR_DELAY_MS);
      } else {
        setSegmentIndex((prev) => prev + 1);
        setCharIndex(0);
      }
    };

    startTimer = setTimeout(startTyping, activeLineIndex === 0 && segmentIndex === 0 && charIndex === 0 && completedLines.length === 0
      ? START_DELAY_MS
      : 0);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(charTimer);
      clearTimeout(pauseTimer);
    };
  }, [
    activeLineIndex,
    segmentIndex,
    charIndex,
    completedLines.length,
    script,
    typingDone,
  ]);

  const inProgressLine = inProgressSegments.length > 0
    ? { segments: inProgressSegments.filter(Boolean) }
    : null;

  return (
    <div className={`not-found-page${mounted ? ' is-visible' : ''}`}>
      <SiteNavbar />

      <main className="not-found-center">
        <div className="nf-terminal-wrap">
          <span className="nf-bg-404 monospace" aria-hidden="true">404</span>

          <div className="nf-terminal">
            <div className="nf-terminal-topbar">
              <div className="nf-terminal-dots">
                <span className="nf-dot nf-dot-red" />
                <span className="nf-dot nf-dot-yellow" />
                <span className="nf-dot nf-dot-green" />
              </div>
              <span className="nf-terminal-title monospace">StorageExplorer — error</span>
            </div>

            <div className="nf-terminal-body monospace">
              {completedLines.map((line, idx) => renderLine(line, `done-${idx}`))}
              {inProgressLine && (
                <div className="nf-terminal-line">
                  {inProgressLine.segments.map((seg, idx) => (
                    <span key={idx} className={seg.className}>
                      {seg.text}
                    </span>
                  ))}
                  {!typingDone && <span className="nf-cursor">|</span>}
                </div>
              )}
              {!typingDone && !inProgressLine && (
                <span className="nf-cursor nf-cursor-solo">|</span>
              )}
              {typingDone && <span className="nf-cursor nf-cursor-solo">|</span>}
            </div>
          </div>
        </div>

        <h1 className="nf-heading monospace">Object store not found</h1>
        <p className="nf-subtext">
          The page you&apos;re looking for doesn&apos;t exist in this database. It may have been
          deleted, moved, or never created.
        </p>

        <div className="nf-details-card">
          <div className="nf-details-header monospace">Query details</div>
          <div className="nf-details-row monospace">
            <span className="nf-details-label">path</span>
            <span className="nf-details-value nf-details-red">{pathname}</span>
          </div>
          <div className="nf-details-row monospace">
            <span className="nf-details-label">engine</span>
            <span className="nf-details-value nf-details-muted">unknown</span>
          </div>
          <div className="nf-details-row monospace">
            <span className="nf-details-label">records found</span>
            <span className="nf-details-value nf-details-red">0</span>
          </div>
          <div className="nf-details-row monospace nf-details-row-last">
            <span className="nf-details-label">timestamp</span>
            <span className="nf-details-value nf-details-muted">{timestamp}</span>
          </div>
        </div>

        <div className="nf-actions">
          <Link to="/" className="nf-btn nf-btn-outline monospace">
            ← Go home
          </Link>
          <Link to="/app" className="nf-btn nf-btn-primary monospace">
            Launch Explorer →
          </Link>
        </div>

        <p className="nf-credit monospace">StorageExplorer · DTU 2025</p>
      </main>
    </div>
  );
}
