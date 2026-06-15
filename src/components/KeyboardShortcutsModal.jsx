import React, { useEffect } from 'react';
import useStore from '../store/useStore';

const CATEGORIES = [
  {
    title: 'Navigation',
    items: [
      { action: 'Switch to LocalStorage', keys: ['Ctrl', '1'] },
      { action: 'Switch to SessionStorage', keys: ['Ctrl', '2'] },
      { action: 'Switch to IndexedDB', keys: ['Ctrl', '3'] },
      { action: 'Focus filter input', keys: ['Ctrl', 'F'] },
      { action: 'Open this modal', keys: ['?'] },
    ]
  },
  {
    title: 'Data',
    items: [
      { action: 'Save inline edit', keys: ['Enter'] },
      { action: 'Cancel inline edit', keys: ['Escape'] },
      { action: 'Delete selected row', keys: ['Delete'], note: '(when row focused)' },
    ]
  },
  {
    title: 'Export & Backup',
    items: [
      { action: 'Export current engine', keys: ['Ctrl', 'E'] },
      { action: 'Export as JSON', keys: ['Ctrl', 'Shift', 'E'] },
    ]
  },
  {
    title: 'View',
    items: [
      { action: 'Toggle HUD log panel', keys: ['Ctrl', 'L'] },
      { action: 'Refresh current store', keys: ['Ctrl', 'R'] },
    ]
  }
];

export default function KeyboardShortcutsModal() {
  const showShortcutsModal = useStore((s) => s.showShortcutsModal);
  const setShowShortcutsModal = useStore((s) => s.setShowShortcutsModal);

  useEffect(() => {
    if (!showShortcutsModal) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowShortcutsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsModal, setShowShortcutsModal]);

  if (!showShortcutsModal) return null;

  return (
    <div className="shortcuts-backdrop" onClick={() => setShowShortcutsModal(false)}>
      <div className="shortcuts-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header">
          <div>
            <h2 className="shortcuts-modal-title">Keyboard shortcuts</h2>
            <p className="shortcuts-modal-subtitle">Available anywhere in the app</p>
          </div>
          <button className="shortcuts-modal-close" onClick={() => setShowShortcutsModal(false)}>
            &times;
          </button>
        </div>
        
        <div className="shortcuts-modal-body">
          {CATEGORIES.map((cat) => (
            <div key={cat.title} className="shortcut-category-group">
              <div className="shortcut-category-header monospace">{cat.title}</div>
              <table className="shortcut-table">
                <tbody>
                  {cat.items.map((item) => (
                    <tr key={item.action}>
                      <td className="shortcut-action">
                        {item.action} {item.note && <span className="shortcut-note">{item.note}</span>}
                      </td>
                      <td className="shortcut-keys">
                        {item.keys.map((k, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className="shortcut-plus"> + </span>}
                            <kbd>{k}</kbd>
                          </React.Fragment>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
