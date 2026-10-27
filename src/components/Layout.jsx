import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

const NAV = [
  { to: '/artists', label: 'Artists', icon: 'book' },
  { to: '/events', label: 'Events', icon: 'calendar' },
  { to: '/musicians', label: 'Find Band', icon: 'users' },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand" aria-label="KMArtists home">
            <Logo size={34} />
          </Link>
          <nav className={`nav ${open ? 'is-open' : ''}`}>
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="nav-link">
                <Icon name={item.icon} size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar-actions">
            <Link to="/artists/new" className="btn btn-primary btn-sm hide-sm">
              <Icon name="plus" size={16} /> Write article
            </Link>
            <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
              <Icon name={open ? 'x' : 'menu'} />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <Logo size={28} />
            <p className="muted small">The community wiki, gig board and jam finder for people who live for music.</p>
          </div>
          <div className="footer-links">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
            <Link to="/events/new">Post an event</Link>
          </div>
        </div>
        <div className="container footer-bottom muted small">© {new Date().getFullYear()} KMArtists · Turn it up.</div>
      </footer>
    </div>
  );
}
