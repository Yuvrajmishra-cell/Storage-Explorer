export const PLAN_STORAGE_KEY = 'storageExplorer_plan';
export const FREE_DATABASE_KEY = 'storageExplorer_free_database_name';
export const EXPORT_USAGE_KEY = 'storageExplorer_export_usage';

export const PLAN_LIMITS = {
  free: {
    databaseCount: 1,
    recordsPerStore: 50,
    exportsPerDay: 3,
  },
  pro: {
    databaseCount: Infinity,
    recordsPerStore: Infinity,
    exportsPerDay: Infinity,
  },
};

export function getCurrentPlan() {
  const saved = window.localStorage.getItem(PLAN_STORAGE_KEY);
  return saved === 'pro' ? 'pro' : 'free';
}

export function setCurrentPlan(plan) {
  const nextPlan = plan === 'pro' ? 'pro' : 'free';
  window.localStorage.setItem(PLAN_STORAGE_KEY, nextPlan);
  window.dispatchEvent(new Event('storageExplorerPlanChange'));
  return nextPlan;
}

export function isProPlan(plan = getCurrentPlan()) {
  return plan === 'pro';
}

export function getFreeDatabaseName() {
  return window.localStorage.getItem(FREE_DATABASE_KEY);
}

export function markFreeDatabaseName(dbName) {
  if (!dbName || isProPlan()) return;
  if (!getFreeDatabaseName()) {
    window.localStorage.setItem(FREE_DATABASE_KEY, dbName);
  }
}

export function canConnectDatabase(dbName) {
  if (isProPlan()) return true;
  const allowedDb = getFreeDatabaseName();
  return !allowedDb || allowedDb === dbName;
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export function getExportUsage() {
  const today = todayKey();
  const fallback = { date: today, count: 0 };
  const raw = window.localStorage.getItem(EXPORT_USAGE_KEY);

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.date === today && Number.isFinite(parsed.count)) {
      return { date: today, count: parsed.count };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function getExportCountToday() {
  return getExportUsage().count;
}

export function canExportToday() {
  if (isProPlan()) return true;
  return getExportCountToday() < PLAN_LIMITS.free.exportsPerDay;
}

export function recordExportToday() {
  if (isProPlan()) return getExportUsage();

  const usage = getExportUsage();
  const next = { date: usage.date, count: usage.count + 1 };
  window.localStorage.setItem(EXPORT_USAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('storageExplorerPlanUsageChange'));
  return next;
}

export function resetPlanUsage() {
  window.localStorage.removeItem(EXPORT_USAGE_KEY);
  window.dispatchEvent(new Event('storageExplorerPlanUsageChange'));
}

export function resetFreeDatabaseName() {
  window.localStorage.removeItem(FREE_DATABASE_KEY);
  window.dispatchEvent(new Event('storageExplorerPlanUsageChange'));
}
