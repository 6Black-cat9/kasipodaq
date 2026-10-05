import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FilePenLine,
  Newspaper,
  FolderOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  UserRoundCog,
  Menu,
  X,
  LogOut,
  ArrowUpRight,
  ChevronRight,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Brand, Ornament } from '../components/Brand';
import { Notifications } from '../components/Notifications';
import { useAuth } from '../context/AuthContext';
import { memberName, roles } from '../utils/format';
import { errorMessage } from '../api/client';
export function WorkspaceLayout({ member = false }: { member?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const base = member ? '/cabinet' : '/admin';
  const items = member
    ? [
        { path: base, label: 'Жеке кабинет', icon: LayoutDashboard },
        { path: `${base}/applications`, label: 'Менің өтініштерім', icon: FilePenLine },
        { path: `${base}/profile`, label: 'Менің профилім', icon: UserRound },
      ]
    : [
        { path: base, label: 'Басқару тақтасы', icon: LayoutDashboard },
        { path: `${base}/members`, label: 'Мүшелер', icon: Users },
        { path: `${base}/applications`, label: 'Өтініштер', icon: FilePenLine },
        { path: `${base}/news`, label: 'Жаңалықтар', icon: Newspaper },
        { path: `${base}/documents`, label: 'Құжаттар', icon: FolderOpen, admin: true },
        { path: `${base}/events`, label: 'Іс-шаралар', icon: CalendarDays },
        { path: `${base}/statistics`, label: 'Статистика', icon: ChartNoAxesCombined },
        { path: `${base}/users`, label: 'Қолданушылар', icon: UserRoundCog, admin: true },
        { path: `${base}/settings`, label: 'Баптаулар', icon: Settings, admin: true },
      ];
  async function signOut() {
    try {
      await logout();
      navigate('/');
      toast.success('Жүйеден шықтыңыз');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }
  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-content">
        Негізгі мазмұнға өту
      </a>
      {open && (
        <button
          className="sidebar-backdrop"
          aria-label="Мәзірді жабу"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`workspace-sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Brand light compact />
          <button
            className="icon-btn mobile-toggle"
            aria-label="Мәзірді жабу"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <span className="sidebar-label">{member ? 'МҮШЕ КАБИНЕТІ' : 'БАСҚАРУ ОРТАЛЫҒЫ'}</span>
        <nav aria-label="Кабинет мәзірі">
          {items
            .filter((item) => !('admin' in item && item.admin) || user?.role === 'ADMIN')
            .map((item) => (
              <NavLink
                key={item.path}
                end={item.path === base}
                to={item.path}
                onClick={() => setOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                <ChevronRight className="nav-chevron" size={14} />
              </NavLink>
            ))}
        </nav>
        {member && (
          <div className="sidebar-public-links">
            <span className="sidebar-label">КӘСІПОДАҚ ӨМІРІ</span>
            <Link to="/news">
              <Newspaper size={19} />
              Жаңалықтар
            </Link>
            <Link to="/documents">
              <FolderOpen size={19} />
              Құжаттар
            </Link>
            <Link to="/events">
              <CalendarDays size={19} />
              Іс-шаралар
            </Link>
          </div>
        )}
        <div className="sidebar-support">
          <Ornament />
          <strong>Бірлікте — береке</strong>
          <p>Сіздің мүддеңіз — біздің ортақ мақсатымыз.</p>
          <Link to="/">
            Басты бетке <ArrowUpRight size={15} />
          </Link>
        </div>
        <button className="sidebar-logout" onClick={() => void signOut()}>
          <LogOut size={19} />
          Жүйеден шығу
        </button>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div>
            <button
              className="icon-btn mobile-toggle"
              aria-label="Мәзірді ашу"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </button>
            <Link to="/">КӘСІПОДАҚ</Link>
            <ChevronRight size={14} />
            <span>{member ? 'Жеке кабинет' : 'Әкімшілік'}</span>
          </div>
          <div>
            <Notifications />
            <span className="header-divider" />
            <Link className="workspace-profile" to={member ? '/cabinet/profile' : '/admin/profile'}>
              <span className="avatar">
                {user?.member?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
              </span>
              <span>
                <strong>{user?.member ? memberName(user.member) : 'Әкімші'}</strong>
                <small>{roles[user?.role || 'MEMBER']}</small>
              </span>
            </Link>
          </div>
        </header>
        <main id="workspace-content" className="workspace-content">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          © {new Date().getFullYear()} КӘСІПОДАҚ <span>Мектеп кәсіподағын басқару платформасы</span>
        </footer>
      </div>
    </div>
  );
}
