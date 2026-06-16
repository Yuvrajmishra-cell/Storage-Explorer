import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteNavbar from './SiteNavbar';
import { usePlan } from '../plan/usePlan';
import './PricingPage.css';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    description: 'For quick debugging and small local projects.',
    cta: 'Get Started',
    features: [
      'Connect to 1 database',
      'View up to 50 records per store',
      'JSON export limited to 3x/day',
      'Basic schema inspector',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$12',
    cadence: 'month',
    description: 'For heavier app debugging and production QA workflows.',
    cta: 'Upgrade to Pro',
    featured: true,
    features: [
      'Unlimited databases',
      'Unlimited records',
      'Unlimited exports',
      'Full schema relationship inspector',
      'Priority support',
    ],
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { plan } = usePlan();
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  return (
    <div className="pricing-page">
      <SiteNavbar />

      <main className="pricing-main">
        <section className="pricing-header">
          <span className="pricing-eyebrow monospace">StorageExplorer Pricing</span>
          <h1 className="pricing-title monospace">Start free. Upgrade when your data grows.</h1>
          <p className="pricing-subtitle">
            The free plan keeps the inspector useful for everyday debugging. Pro removes limits for larger databases, exports, and team workflows.
          </p>
        </section>

        <section className="pricing-grid" aria-label="Pricing tiers">
          {TIERS.map((tier) => (
            <article key={tier.id} className={`pricing-card${tier.featured ? ' featured' : ''}`}>
              {tier.featured && (
                <div className="pricing-card-badges" aria-label="Pro tier highlights">
                  <span className="pricing-card-badge recommended monospace">Recommended</span>
                  <span className="pricing-card-badge monospace">Coming soon</span>
                </div>
              )}
              <div className="pricing-card-header">
                <h2 className="pricing-card-name monospace">{tier.name}</h2>
                <p className="pricing-card-desc">{tier.description}</p>
              </div>

              <div className="pricing-price-row">
                <span className="pricing-price monospace">{tier.price}</span>
                <span className="pricing-cadence monospace">/{tier.cadence}</span>
              </div>

              <ul className="pricing-features">
                {tier.features.map((feature) => (
                  <li key={feature}>
                    <i className="ti ti-check" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {tier.id === 'free' ? (
                <button
                  type="button"
                  className={`pricing-cta secondary monospace${plan === 'free' ? ' active-plan' : ''}`}
                  onClick={() => navigate('/app')}
                >
                  {plan === 'free' ? (
                    <>
                      <i className="ti ti-check" aria-hidden="true" />
                      Current Plan
                    </>
                  ) : (
                    tier.cta
                  )}
                </button>
              ) : (
                <button type="button" className="pricing-cta primary monospace" onClick={() => setComingSoonOpen(true)}>
                  {tier.cta}
                </button>
              )}
            </article>
          ))}
        </section>

        {import.meta.env.DEV && (
          <p className="pricing-note monospace">
            Payment wiring is intentionally paused. Use the Settings dev toggle to simulate Pro while testing limits.
          </p>
        )}
      </main>

      {comingSoonOpen && (
        <div className="pricing-modal-overlay" onClick={() => setComingSoonOpen(false)}>
          <div className="pricing-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="pricing-modal-close" onClick={() => setComingSoonOpen(false)} aria-label="Close">
              ×
            </button>
            <span className="pricing-eyebrow monospace">Payment coming soon</span>
            <h2 className="pricing-modal-title monospace">Pro checkout is not wired yet.</h2>
            <p className="pricing-modal-text">
              The upgrade flow is ready for UI testing. Payment processing can be connected here later.
            </p>
            <Link className="pricing-modal-link monospace" to="/settings" onClick={() => setComingSoonOpen(false)}>
              Open Settings →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
