import { useCallback, useEffect, useMemo, useState } from 'react';
import PlanContext from './planContextCore';
import {
  PLAN_LIMITS,
  getCurrentPlan,
  getExportCountToday,
  getFreeDatabaseName,
  resetFreeDatabaseName,
  resetPlanUsage,
  setCurrentPlan,
} from '../utils/planLimits';

export function PlanProvider({ children }) {
  const [plan, setPlanState] = useState(() => getCurrentPlan());
  const [exportCountToday, setExportCountToday] = useState(() => getExportCountToday());
  const [freeDatabaseName, setFreeDatabaseName] = useState(() => getFreeDatabaseName());

  const refresh = useCallback(() => {
    setPlanState(getCurrentPlan());
    setExportCountToday(getExportCountToday());
    setFreeDatabaseName(getFreeDatabaseName());
  }, []);

  useEffect(() => {
    window.addEventListener('storage', refresh);
    window.addEventListener('storageExplorerPlanChange', refresh);
    window.addEventListener('storageExplorerPlanUsageChange', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('storageExplorerPlanChange', refresh);
      window.removeEventListener('storageExplorerPlanUsageChange', refresh);
    };
  }, [refresh]);

  const setPlan = useCallback((nextPlan) => {
    setPlanState(setCurrentPlan(nextPlan));
  }, []);

  const clearExportUsage = useCallback(() => {
    resetPlanUsage();
    refresh();
  }, [refresh]);

  const clearFreeDatabase = useCallback(() => {
    resetFreeDatabaseName();
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({
    plan,
    isPro: plan === 'pro',
    limits: plan === 'pro' ? PLAN_LIMITS.pro : PLAN_LIMITS.free,
    freeLimits: PLAN_LIMITS.free,
    exportCountToday,
    freeDatabaseName,
    setPlan,
    refresh,
    clearExportUsage,
    clearFreeDatabase,
  }), [plan, exportCountToday, freeDatabaseName, setPlan, refresh, clearExportUsage, clearFreeDatabase]);

  return (
    <PlanContext.Provider value={value}>
      {children}
    </PlanContext.Provider>
  );
}
