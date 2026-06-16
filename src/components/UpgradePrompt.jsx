import { Link } from 'react-router-dom';
import './UpgradePrompt.css';

const FEATURE_COPY = {
  database: {
    title: 'Unlock more databases',
    message: 'Free workspaces can connect to 1 IndexedDB database. Upgrade to Pro to inspect unlimited databases.',
  },
  records: {
    title: 'View every record',
    message: 'Free workspaces show the first 50 records in each store. Upgrade to Pro to view all records.',
  },
  export: {
    title: 'Unlimited JSON exports',
    message: 'Free workspaces include 3 JSON exports per day. Upgrade to Pro for unlimited backups.',
  },
};

function resolveCopy(feature, message) {
  const fallback = FEATURE_COPY[feature] || {
    title: 'Upgrade to Pro',
    message: 'Upgrade to Pro to remove this limit.',
  };
  return { ...fallback, message: message || fallback.message };
}

export default function UpgradePrompt({
  feature = 'pro',
  message,
  variant = 'modal',
  onClose,
}) {
  const copy = resolveCopy(feature, message);

  if (variant === 'banner') {
    return (
      <div className="upgrade-prompt-banner">
        <div className="upgrade-prompt-banner-copy">
          <span className="upgrade-prompt-kicker monospace">FREE LIMIT</span>
          <span>{copy.message}</span>
        </div>
        <Link className="upgrade-prompt-link monospace" to="/pricing">
          Upgrade →
        </Link>
      </div>
    );
  }

  return (
    <div className="upgrade-prompt-overlay" onClick={onClose}>
      <div className="upgrade-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="upgrade-prompt-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <span className="upgrade-prompt-kicker monospace">PRO FEATURE</span>
        <h2 className="upgrade-prompt-title monospace">{copy.title}</h2>
        <p className="upgrade-prompt-message">{copy.message}</p>
        <div className="upgrade-prompt-actions">
          <Link className="upgrade-prompt-primary monospace" to="/pricing" onClick={onClose}>
            View Pricing →
          </Link>
          <button type="button" className="upgrade-prompt-secondary monospace" onClick={onClose}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

export function UpgradePromptHost({ prompt, onClose }) {
  if (!prompt) return null;
  return (
    <UpgradePrompt
      feature={prompt.feature}
      message={prompt.message}
      onClose={onClose}
    />
  );
}
