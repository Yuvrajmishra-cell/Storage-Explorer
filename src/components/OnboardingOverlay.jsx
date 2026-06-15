import React, { useState } from 'react';
import './OnboardingOverlay.css';

export default function OnboardingOverlay({ onDismiss }) {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleSkip = () => {
    onDismiss();
  };

  return (
    <>
      {/* Target highlights */}
      {step === 2 && <div className="onboarding-highlight-top" />}
      {step === 3 && <div className="onboarding-highlight-bottom" />}

      {/* Main Overlay Backdrop */}
      <div
        className={`onboarding-overlay-wrapper step-${step} ${
          step === 1 ? 'dimmed' : 'transparent'
        }`}
      >
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
                  <button className="onboarding-btn primary" onClick={handleNext}>
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
                  <button className="onboarding-btn secondary" onClick={handleSkip}>
                    Skip
                  </button>
                  <button className="onboarding-btn primary" onClick={handleNext}>
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
                  <button className="onboarding-btn primary" onClick={handleSkip}>
                    Start exploring →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Progress and Skip Controls */}
          <div className="onboarding-dots">
            <span className={`onboarding-dot ${step === 1 ? 'active' : ''}`} />
            <span className={`onboarding-dot ${step === 2 ? 'active' : ''}`} />
            <span className={`onboarding-dot ${step === 3 ? 'active' : ''}`} />
          </div>

          <button className="onboarding-skip-link" onClick={handleSkip}>
            Skip tour
          </button>
        </div>
      </div>
    </>
  );
}
