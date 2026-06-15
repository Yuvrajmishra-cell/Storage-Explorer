export function resolveTheme(theme) {
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemeToBody(theme) {
  const resolved = resolveTheme(theme);
  document.body.classList.toggle('light', resolved === 'light');
  return resolved;
}
