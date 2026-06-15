// For LocalStorage and SessionStorage
export const computeKeyValueBytes = (storage) => {
  let total = 0;
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key === null) continue;
      const value = storage.getItem(key) || '';
      total += (key.length + value.length) * 2; // UTF-16
    }
  } catch (e) {
    console.warn('Byte calculation failed:', e);
  }
  return total;
};

// For IndexedDB — uses real browser API
export const getStorageEstimate = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage: usage || 0, quota: quota || 5 * 1024 * 1024 * 1024 };
    }
  } catch (e) {
    console.warn('Storage estimate failed:', e);
  }
  return { usage: 0, quota: 5 * 1024 * 1024 * 1024 };
};

// Format bytes to human readable
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

// Format quota total
export const formatQuota = (bytes) => {
  if (bytes >= 1024 * 1024 * 1024) return `${Math.round(bytes / 1024 / 1024 / 1024)} GB`;
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};

export const getRawPercent = (used, total) => {
  if (!total || total <= 0) return 0;
  return (used / total) * 100;
};

export const computePercent = (used, total) => {
  const raw = getRawPercent(used, total);
  if (raw === 0) return 0;
  if (raw < 0.1) return 0.1;
  if (raw < 1) return parseFloat(raw.toFixed(2));
  return Math.round(raw);
};

export const getPercentLabel = (used, total) => {
  const percent = getRawPercent(used, total);
  if (percent === 0) return '0%';
  if (percent < 0.1) return '< 0.1%';
  if (percent < 1) return `${percent.toFixed(2)}%`;
  return `${Math.round(percent)}%`;
};

export const getBarColor = (percent) => {
  if (percent >= 80) return '#ef4444';
  if (percent >= 60) return '#fbbf24';
  return '#4ade80';
};
