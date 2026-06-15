import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import OnboardingOverlay from './OnboardingOverlay';

export default function AppOnboarding() {
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (location.pathname !== '/app') {
      setShowOnboarding(false);
      return;
    }

    try {
      const onboarded = localStorage.getItem('dbExplorer_onboarded');
      setShowOnboarding(onboarded !== 'true');
    } catch {
      setShowOnboarding(true);
    }
  }, [location.pathname]);

  const handleDismiss = () => {
    try {
      localStorage.setItem('dbExplorer_onboarded', 'true');
    } catch {
      // localStorage may be unavailable in private/restricted contexts
    }
    setShowOnboarding(false);
  };

  if (!showOnboarding) return null;

  return <OnboardingOverlay onDismiss={handleDismiss} />;
}
