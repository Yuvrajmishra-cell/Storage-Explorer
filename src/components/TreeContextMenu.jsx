import React, { useEffect, useRef, useState } from 'react';

export function TreeContextMenu({ open, items, onClose, anchorRef }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (
        menuRef.current?.contains(e.target) ||
        anchorRef?.current?.contains(e.target)
      ) {
        return;
      }
      onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div className="tree-context-menu" ref={menuRef}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`tree-context-menu-item${item.danger ? ' danger' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            item.onClick();
          }}
        >
          {item.icon && <i className={`ti ${item.icon}`} />}
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function TreeRowWithMenu({ className, onRowClick, menuItems, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef(null);

  const openMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  };

  return (
    <li
      className={`${className}${menuOpen ? ' tree-menu-open' : ''}`}
      onContextMenu={openMenu}
    >
      <div className="tree-row-with-menu">
        <div className="tree-row-main" onClick={onRowClick}>
          {children}
        </div>
        <button
          ref={btnRef}
          type="button"
          className="tree-menu-btn"
          title="Options"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
        >
          <i className="ti ti-dots" />
        </button>
        <TreeContextMenu
          open={menuOpen}
          items={menuItems}
          onClose={() => setMenuOpen(false)}
          anchorRef={btnRef}
        />
      </div>
    </li>
  );
}
