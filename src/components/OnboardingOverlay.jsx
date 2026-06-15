import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const OVERLAY_ROOT_ID = 'overlay-root';

function getWrapperClassName(step) {
  if (step === 1) {
    return 'onboarding-overlay-wrapper onboarding-overlay-step-1 onboarding-overlay-dimmed';
  }
  if (step === 2) {
    return 'onboarding-overlay-wrapper onboarding-overlay-step-2 onboarding-overlay-clear';
  }
  return 'onboarding-overlay-wrapper onboarding-overlay-step-3 onboarding-overlay-clear';
}

export default function OnboardingOverlay({ onDismiss }) {
  const [step, setStep] = useState(1);
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    const root =
      document.getElementById(OVERLAY_ROOT_ID) ||
      document.body;
    setPortalTarget(root);
    document.body.classList.add('onboarding-active');
    return () => document.body.classList.remove('onboarding-active');
  }, []);

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleSkip = () => {
    onDismiss();
  };

  if (!portalTarget) return null;

  return createPortal(
    <>
      {step === 2 && <div className="onboarding-highlight-top" aria-hidden="true" />}
      {step === 3 && <div className="onboarding-highlight-bottom" aria-hidden="true" />}

      <div className={getWrapperClassName(step)} role="dialog" aria-modal="true" aria-label="StorageExplorer onboarding">
        <div className="onboarding-modal" onClick={(e) => e.stopPropagation()}>
          {step === 1 && (
            <>
              <h2 className="onboarding-title">Welcome to StorageExplorer</h2>
              <div className="onboarding-db-icon-container">
                <pre className="onboarding-db-icon">
{`┌──────────┐
│  (o) DB  │
├──────────┤
│  (o) DB  │
├──────────┤
│  (o) DB  │
└──────────┘`}
                </pre>
              </div>
              <p className="onboarding-body">
                A unified interface for all your browser storage engines. Let's take a 30-second tour.
              </p>
              <div className="onboarding-footer">
                <div className="onboarding-actions">
                  <button type="button" className="onboarding-btn primary" onClick={handleNext}>
                    Get started →
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="onboarding-title">Connecting Engines</h2>
              <p className="onboarding-body">
                Start by clicking Connect to choose LocalStorage, SessionStorage, or IndexedDB.
              </p>
              <div className="onboarding-footer">
                <div className="onboarding-actions">
                  <button type="button" className="onboarding-btn secondary" onClick={handleSkip}>
                    Skip
                  </button>
                  <button type="button" className="onboarding-btn primary" onClick={handleNext}>
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="onboarding-title">Telemetry & Export</h2>
              <p className="onboarding-body">
                The HUD shows your storage usage, last operation, and lets you export your data anytime.
              </p>
              <div className="onboarding-footer">
                <div className="onboarding-actions">
                  <button type="button" className="onboarding-btn primary" onClick={handleSkip}>
                    Start exploring →
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="onboarding-dots" aria-hidden="true">
            <span className={step === 1 ? 'onboarding-dot active' : 'onboarding-dot'} />
            <span className={step === 2 ? 'onboarding-dot active' : 'onboarding-dot'} />
            <span className={step === 3 ? 'onboarding-dot active' : 'onboarding-dot'} />
          </div>

          <button type="button" className="onboarding-skip-link" onClick={handleSkip}>
            Skip tour
          </button>
        </div>
      </div>
    </>,
    portalTarget
  );
}
