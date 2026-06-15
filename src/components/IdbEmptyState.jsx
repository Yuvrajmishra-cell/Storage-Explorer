import React from 'react';
import useStore from '../store/useStore';

export function IdbLeftEmptyState() {
  const openIdbConnectModal = useStore((s) => s.openIdbConnectModal);

  return (
    <div className="idb-empty-state">
      <i className="ti ti-database idb-empty-icon" />
      <p className="idb-empty-title monospace">No database connected</p>
      <p className="idb-empty-desc monospace">
        Click &quot;Connect&quot; in the top bar
        <br />
        to open or create a database
      </p>
      <button type="button" className="idb-connect-now-btn monospace" onClick={openIdbConnectModal}>
        Connect now →
      </button>
    </div>
  );
}

export function IdbRightEmptyState() {
  const openIdbConnectModal = useStore((s) => s.openIdbConnectModal);

  return (
    <div className="idb-empty-state idb-empty-state-right">
      <span className="idb-empty-logo monospace">◈</span>
      <p className="idb-empty-title monospace">Connect to an IndexedDB database</p>
      <p className="idb-empty-desc monospace">to browse your object stores</p>
      <button type="button" className="idb-connect-now-btn monospace" onClick={openIdbConnectModal}>
        Connect now →
      </button>
    </div>
  );
}
