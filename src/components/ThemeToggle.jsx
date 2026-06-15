import React from 'react';
import useStore from '../store/useStore';

const THEME_META = {
  dark: { icon: 'ti-sun', title: 'Dark mode — click for light' },
  light: { icon: 'ti-moon', title: 'Light mode — click for system' },
  system: { icon: 'ti-device-desktop', title: 'System theme — click for dark' },
};

export default function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const cycleTheme = useStore((s) => s.cycleTheme);
  const meta = THEME_META[theme] || THEME_META.dark;

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={cycleTheme}
      title={meta.title}
      aria-label="Cycle theme: dark, light, system"
    >
      <i className={`ti ${meta.icon}`} />
    </button>
  );
}
