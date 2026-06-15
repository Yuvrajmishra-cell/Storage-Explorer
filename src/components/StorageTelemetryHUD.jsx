import React, { useState, useEffect, useRef } from 'react';
import useStore from '../store/useStore';
import { exportStorageData } from '../utils/storage';
import { formatBytes, formatQuota, getBarColor, getPercentLabel, getRawPercent } from '../utils/storageQuota';

const formatTime = (timestamp) => {
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

function getLogPreviewClass(text) {
  if (!text) return 'log-muted';
  if (text.includes('[ERROR]')) return 'log-error';
  if (/\b(GETALL|GET |READ|AUTO-RESTORED|OPEN)\b/i.test(text)) return 'log-read';
  if (/\b(SET|UPDATE|DELETE|ADD|PUT|CREATE|PURGE|CLEAR|EXPORT)\b/i.test(text)) return 'log-write';
  return 'log-muted';
}

function getEngineLabel(engine) {
  if (engine === 'local') return 'LocalStorage';
  if (engine === 'session') return 'SessionStorage';
  if (engine === 'indexeddb') return 'IndexedDB';
  return engine;
}

function QuotaBar() {
  const activeEngine = useStore((s) => s.activeEngine);
  const quotaSource = useStore((s) => s.quotaSource);
  const quotaUsed = useStore((s) => s.quotaUsed);
  const quotaTotal = useStore((s) => s.quotaTotal);

  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, bottom: 0 });
  const wrapRef = useRef(null);

  const rawPercent = getRawPercent(quotaUsed, quotaTotal);
  const percentLabel = getPercentLabel(quotaUsed, quotaTotal);
  const barColor = getBarColor(rawPercent);
  const fillPx = quotaUsed > 0 ? Math.max((rawPercent / 100) * 80, 3) : 0;

  const handleMouseEnter = () => {
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setTooltipPos({
        left: rect.left,
        bottom: window.innerHeight - rect.top + 8,
      });
    }
    setTooltipOpen(true);
  };

  const sourceLabel = quotaSource === 'api'
    ? 'navigator.storage.estimate()'
    : 'UTF-16 byte estimation';

  const totalLabel = quotaSource === 'api'
    ? formatQuota(quotaTotal)
    : '~5 MB';

  return (
    <>
      <div
        ref={wrapRef}
        className="quota-bar-wrap"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setTooltipOpen(false)}
      >
        <span className="label">QUOTA:</span>
        <div className="quota-bar-track">
          <div
            className="quota-bar-fill"
            style={{
              width: `${fillPx}px`,
              background: barColor,
            }}
          />
        </div>
        <span className="quota-bar-percent" style={{ color: barColor }}>
          {percentLabel}
        </span>
      </div>

      {tooltipOpen && (
        <div
          className="quota-tooltip monospace text-11"
          style={{ left: tooltipPos.left, bottom: tooltipPos.bottom }}
        >
          <div className="quota-tooltip-title">Storage breakdown</div>
          <div className="quota-tooltip-divider" />
          <div className="quota-tooltip-row">
            <span className="quota-tooltip-key">Engine:</span>
            <span className="quota-tooltip-val">{getEngineLabel(activeEngine)}</span>
          </div>
          <div className="quota-tooltip-row">
            <span className="quota-tooltip-key">Used:</span>
            <span className="quota-tooltip-val">{formatBytes(quotaUsed)}</span>
          </div>
          <div className="quota-tooltip-row">
            <span className="quota-tooltip-key">Total:</span>
            <span className="quota-tooltip-val">{totalLabel}</span>
          </div>
          <div className="quota-tooltip-row">
            <span className="quota-tooltip-key">Percent:</span>
            <span className="quota-tooltip-val">{percentLabel}</span>
          </div>
          <div className="quota-tooltip-row">
            <span className="quota-tooltip-key">Source:</span>
            <span className="quota-tooltip-val">{sourceLabel}</span>
          </div>
          {quotaSource === 'api' && (
            <p className="quota-tooltip-note">
              Note: Estimate includes all origin storage, not just IndexedDB.
            </p>
          )}
        </div>
      )}
    </>
  );
}

export default function StorageTelemetryHUD() {
  const activeEngine = useStore((s) => s.activeEngine);
  const dbConnection = useStore((s) => s.dbConnection);
  const quotaDisplay = useStore((s) => s.quotaDisplay);
  const quotaSource = useStore((s) => s.quotaSource);
  const updateQuota = useStore((s) => s.updateQuota);
  const transactionLogs = useStore((s) => s.transactionLogs);

  // Relations state from Zustand
  const relationCount = useStore((s) => s.relationCount);
  const relationsMap = useStore((s) => s.relationsMap);
  const idbStores = useStore((s) => s.idbStores);
  const selectedRelation = useStore((s) => s.selectedRelation);
  const setSelectedRelation = useStore((s) => s.setSelectedRelation);

  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [isWritingLocal, setIsWritingLocal] = useState(false);
  const [logWriteFade, setLogWriteFade] = useState(false);

  const panelRef = useRef(null);
  const modalRef = useRef(null);

  // Close logs panel on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        logPanelOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !e.target.closest('.last-op-segment')
      ) {
        setLogPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [logPanelOpen]);

  // Close graph modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && graphModalOpen) {
        setGraphModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graphModalOpen]);

  // Close graph modal on clicking outside the container
  const handleModalOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      setGraphModalOpen(false);
    }
  };

  const lastLog = transactionLogs.length > 0 ? transactionLogs[transactionLogs.length - 1] : null;
  const last20Logs = [...transactionLogs].reverse().slice(0, 20);

  const handleExport = () => {
    exportStorageData(activeEngine, dbConnection);
  };

  useEffect(() => {
    void updateQuota();

    const refreshQuota = () => {
      void updateQuota();
    };

    window.addEventListener('focus', refreshQuota);
    window.addEventListener('storage', refreshQuota);

    return () => {
      window.removeEventListener('focus', refreshQuota);
      window.removeEventListener('storage', refreshQuota);
    };
  }, [activeEngine, updateQuota]);

  useEffect(() => {
    if (!lastLog) return;
    void updateQuota();
    setIsWritingLocal(true);
    const logClass = getLogPreviewClass(lastLog.text);
    if (logClass === 'log-write') {
      setLogWriteFade(false);
      const fadeTimer = setTimeout(() => setLogWriteFade(true), 1200);
      const writeTimer = setTimeout(() => setIsWritingLocal(false), 500);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(writeTimer);
      };
    }
    const timer = setTimeout(() => setIsWritingLocal(false), 500);
    return () => clearTimeout(timer);
  }, [activeEngine, lastLog?.timestamp, updateQuota]);

  /* ─── SVG Layout Computation ────────────────────────── */
  const svgWidth = 560;
  const svgHeight = 340;
  const nodeWidth = 100;
  const nodeHeight = 36;
  const yPosition = 150;

  // Space nodes out horizontally
  const nodes = idbStores.map((store, index) => {
    const totalNodes = idbStores.length;
    const padding = 30;
    const availableWidth = svgWidth - padding * 2 - nodeWidth;
    const x = totalNodes > 1
      ? padding + index * (availableWidth / (totalNodes - 1))
      : padding + availableWidth / 2;
    return { id: store, x, y: yPosition };
  });

  // Flatten relation edges
  const edges = [];
  Object.entries(relationsMap || {}).forEach(([sourceStore, info]) => {
    if (info && info.foreignKeys) {
      info.foreignKeys.forEach(({ field, target }) => {
        edges.push({ sourceStore, field, targetStore: target });
      });
    }
  });

  return (
    <div className="telemetry-hud monospace text-11">
      {/* Slide up log panel */}
      {logPanelOpen && (
        <div className="log-panel" ref={panelRef}>
          <div className="log-panel-header">
            <span>TRANSACTION LOGS (LAST 20)</span>
            <button className="log-close-btn" onClick={() => setLogPanelOpen(false)}>✕</button>
          </div>
          <div className="log-panel-body">
            {last20Logs.length === 0 ? (
              <div className="log-empty">No activity logs recorded yet.</div>
            ) : (
              last20Logs.map((log, index) => (
                <div key={index} className="log-line">
                  <span className="log-timestamp">[{formatTime(log.timestamp)}]</span>{' '}
                  <span className="log-text">{log.text}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SVG Graph Modal */}
      {graphModalOpen && (
        <div className="modal-overlay" onClick={handleModalOverlayClick}>
          <div className="modal-container" ref={modalRef}>
            <div className="modal-header">
              <span className="modal-title monospace text-11">SCHEMA RELATIONSHIPS MAP</span>
              <button className="modal-close-btn" onClick={() => setGraphModalOpen(false)}>✕</button>
            </div>
            <div className="modal-content">
              <svg className="svg-graph" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                <defs>
                  <marker
                    id="arrow-normal"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted-color)" />
                  </marker>
                  <marker
                    id="arrow-highlighted"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--accent-color)" />
                  </marker>
                </defs>

                {/* Render Edges */}
                {edges.map((edge, index) => {
                  const src = nodes.find(n => n.id === edge.sourceStore);
                  const tgt = nodes.find(n => n.id === edge.targetStore);
                  if (!src || !tgt) return null;

                  const isLeftToRight = src.x < tgt.x;
                  const startX = isLeftToRight ? src.x + nodeWidth : src.x;
                  const startY = yPosition + nodeHeight / 2;

                  let endX = isLeftToRight ? tgt.x : tgt.x + nodeWidth;
                  const endY = yPosition + nodeHeight / 2;

                  // Shorten edge path so arrowhead is visible
                  endX = isLeftToRight ? endX - 8 : endX + 8;

                  const midX = (startX + endX) / 2;
                  const distance = Math.abs(startX - endX);
                  const controlY = isLeftToRight
                    ? yPosition - 40 - Math.min(80, distance * 0.2)
                    : yPosition + nodeHeight + 40 + Math.min(80, distance * 0.2);

                  const pathD = `M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`;
                  
                  // Label Position (Bezier curves formula for t=0.5)
                  const labelX = midX;
                  const labelY = 0.5 * startY + 0.5 * controlY;
                  
                  const isEdgeHighlighted =
                    selectedRelation &&
                    selectedRelation.sourceStore === edge.sourceStore &&
                    selectedRelation.field === edge.field &&
                    selectedRelation.targetStore === edge.targetStore;

                  const labelWidth = edge.field.length * 6 + 10;

                  return (
                    <g key={index}>
                      <path
                        className={`svg-edge-path ${isEdgeHighlighted ? 'highlighted' : ''}`}
                        d={pathD}
                        markerEnd={isEdgeHighlighted ? 'url(#arrow-highlighted)' : 'url(#arrow-normal)'}
                      />
                      <g cursor="help" onClick={() => setSelectedRelation(isEdgeHighlighted ? null : edge)}>
                        <rect
                          x={labelX - labelWidth / 2}
                          y={labelY - 7}
                          width={labelWidth}
                          height={14}
                          fill="var(--bg-color)"
                          stroke={isEdgeHighlighted ? 'var(--accent-color)' : 'var(--border-color)'}
                          rx="3"
                        />
                        <text
                          x={labelX}
                          y={labelY + 1}
                          textAnchor="middle"
                          fill={isEdgeHighlighted ? 'var(--accent-color)' : 'var(--muted-color)'}
                          className="monospace"
                          style={{ fontSize: '9px', pointerEvents: 'none' }}
                        >
                          {edge.field}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Render Nodes */}
                {nodes.map((node) => {
                  const isHighlighted =
                    selectedRelation &&
                    (selectedRelation.sourceStore === node.id || selectedRelation.targetStore === node.id);
                  return (
                    <g key={node.id}>
                      <rect
                        x={node.x}
                        y={node.y}
                        width={nodeWidth}
                        height={nodeHeight}
                        className={`svg-node-rect ${isHighlighted ? 'selected' : ''}`}
                      />
                      <text
                        x={node.x + nodeWidth / 2}
                        y={node.y + nodeHeight / 2}
                        className="svg-node-text"
                      >
                        {node.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Segment 1: ENGINE */}
      <div className="hud-segment">
        <span className={`hud-dot ${isWritingLocal ? 'pulse-slow' : ''}`}></span>
        <span className="label">ENGINE:</span>
        <span className="value accent-green">{activeEngine.toUpperCase()}</span>
      </div>

      {/* Segment 2: USED */}
      <div className="hud-segment">
        <span
          className="label hud-used-label"
          title={quotaSource === 'estimated' ? '¹ UTF-16 byte estimation' : undefined}
        >
          USED{quotaSource === 'estimated' && <sup className="hud-est-sup">¹</sup>}:
        </span>
        <span className="value">{quotaDisplay}</span>
      </div>

      {/* Segment 3: QUOTA */}
      <div className="hud-segment hud-quota-segment">
        <QuotaBar />
      </div>

      {/* Segment 4: LAST OP */}
      <div
        className="hud-segment last-op-segment"
        onClick={() => setLogPanelOpen(!logPanelOpen)}
        title="Click to view all transaction logs"
      >
        <span className="label">LAST OP:</span>
        <span className={`value log-preview ${lastLog ? getLogPreviewClass(lastLog.text) : ''}${logWriteFade && getLogPreviewClass(lastLog?.text) === 'log-write' ? ' log-write-fade' : ''}`}>
          {lastLog ? lastLog.text : 'No activity'}
        </span>
      </div>

      {/* Segment 5: RELATIONS */}
      <div className="hud-segment">
        <span className="label">RELATIONS:</span>
        <span className="value">{relationCount} inferred</span>
        {activeEngine === 'indexeddb' && relationCount > 0 && (
          <span className="view-graph-btn" onClick={() => setGraphModalOpen(true)}>
            | View Graph
          </span>
        )}
      </div>

      {/* Segment 6: EXPORT */}
      <div className="hud-segment export-segment" onClick={handleExport} title="Export current storage data as JSON">
        <span className="value export-btn">⬇ Export</span>
      </div>
    </div>
  );
}
