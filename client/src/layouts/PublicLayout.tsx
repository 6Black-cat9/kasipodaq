import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowUpRight, Menu, X, ShieldCheck, Phone, Mail, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Brand, Ornament } from '../components/Brand';
import { Notifications } from '../components/Notifications';
import { useApi } from '../hooks/useApi';
import type { Settings } from '../types';
const links = [
  { to: '/', label: 'Басты бет' },
  { to: '/news', label: 'Жаңалықтар' },
  { to: '/documents', label: 'Құжаттар' },
  { to: '/events', label: 'Іс-шаралар' },
];
export function PublicLayout() {
  const { user } = useAuth();
  const [menu, setMenu] = useState(false);
  const { data: settings } = useApi<Settings>('/settings');
  const cabinet = user?.role === 'MEMBER' ? '/cabinet' : '/admin';
  return (
    <>
      <a className="skip-link" href="#main-content">
        Негізгі мазмұнға өту
      </a>
      <div className="announcement">
        <div className="container announcement-inner">
          <span>
            <ShieldCheck size={14} /> Бірлігіміз берік. Құқығымыз қорғалған.
          </span>
          <Link to="/documents">
            Кәсіподақ мүшелеріне арналған ақпарат <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <header className="public-header">
        <div className="container header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Негізгі мәзір">
            {links.map((link) => (
              <NavLink end={link.to === '/'} key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-right">
            {user && <Notifications />}
            <Link className="btn btn-primary header-login" to={user ? cabinet : '/login'}>
              {user ? 'Жеке кабинет' : 'Жеке кабинет'}
              <ArrowUpRight size={17} />
            </Link>
            <button
              className="icon-btn mobile-toggle"
              aria-label={menu ? 'Мәзірді жабу' : 'Мәзірді ашу'}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-public-nav" aria-label="Мобильді мәзір">
            {links.map((link) => (
              <NavLink
                end={link.to === '/'}
                key={link.to}
                to={link.to}
                onClick={() => setMenu(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Link to={user ? cabinet : '/login'} onClick={() => setMenu(false)}>
              Жеке кабинет <ArrowRight size={16} />
            </Link>
          </nav>
        )}
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="public-footer">
        <div className="container">
          <div className="footer-top">
            <div className="footer-brand-area">
              <Brand light />
              <p>
                Әр қызметкердің мүддесін қорғап,
                <br />
                ортақ болашағымызды бірге құрамыз.
              </p>
              <span className="footer-motto">Бір мектеп. Бір мақсат. Бір кәсіподақ.</span>
            </div>
            <div>
              <h3>Платформа</h3>
              <Link to="/news">Жаңалықтар</Link>
              <Link to="/documents">Құжаттар</Link>
              <Link to="/events">Іс-шаралар</Link>
              <Link to={user ? cabinet : '/login'}>Жеке кабинет</Link>
            </div>
            <div>
              <h3>Мүшелерге</h3>
              <Link to="/cabinet/applications/new">Өтініш беру</Link>
              <Link to="/cabinet/applications">Өтініш мәртебесі</Link>
              <Link to="/documents">Құқықтық ақпарат</Link>
              <a href="/#about">Кәсіподақ туралы</a>
            </div>
            <div className="footer-contacts">
              <h3>Байланыс</h3>
              {settings?.phone && (
                <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>
                  <Phone size={16} />
                  {settings.phone}
                </a>
              )}
              {settings?.email && (
                <a href={`mailto:${settings.email}`}>
                  <Mail size={16} />
                  {settings.email}
                </a>
              )}
              {settings?.address && (
                <p>
                  <MapPin size={16} />
                  {settings.address}
                </p>
              )}
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} КӘСІПОДАҚ. Барлық құқықтар қорғалған.</span>
            <span>
              Қазақстан <Ornament className="footer-ornament" />
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
