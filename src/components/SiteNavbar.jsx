import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './SiteNavbar.css';

export default function SiteNavbar({ showDocsBadge = false }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const { pathname } = useLocation();
  const onSettings = pathname === '/settings';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`site-navbar${isScrolled ? ' scrolled' : ''}`}>
      <Link to="/" className="site-navbar-brand">
        <span className="site-navbar-logo">◈</span>
        <span className="site-navbar-name">StorageExplorer</span>
        {showDocsBadge && <span className="site-navbar-docs-badge">Docs</span>}
      </Link>

      <div className="site-navbar-links">
        <NavLink to="/" end className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}>
          Home
        </NavLink>
        <NavLink to="/docs" className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}>
          Docs
        </NavLink>
        <NavLink to="/pricing" className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}>
          Pricing
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => `site-nav-link${isActive ? ' active' : ''}`}>
          About
        </NavLink>
        <Link to="/app" className="site-navbar-launch-btn">
          Launch App →
        </Link>
        <ThemeToggle />
        <Link
          to="/settings"
          className={`site-navbar-settings-btn${onSettings ? ' active' : ''}`}
          title="Settings"
          aria-current={onSettings ? 'page' : undefined}
        >
          <i className="ti ti-settings" />
        </Link>
      </div>
    </nav>
  );
}
