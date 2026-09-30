import { useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AuthContext from '../context/auth-context';
import { useLocation } from 'react-router-dom';

const adminItems = [
  { label: 'Dashboard', to: '/testsite/admin/dashboard', icon: ChartBarIcon, end: true },
  {
    label: 'Posts',
    icon: DocumentTextIcon,
    children: [
      { label: 'All Posts', to: '/testsite/admin/posts' },
      { label: 'Add Post', to: '/testsite/admin/posts/add' },
      { label: 'Categories', to: '/testsite/admin/posts/categories' },
      { label: 'Tags', to: '/testsite/admin/posts/tags' }
    ]
  },
  {
    label: 'Users',
    icon: UsersIcon,
    children: [
      { label: 'All Users', to: '/testsite/admin/users' },
      { label: 'Add User', to: '/testsite/admin/users/add' },
      { label: 'Profile', to: '/testsite/admin/users/profile' }
    ]
  }
];

export const AdminPage = ({ title }) => (
  <main className="min-h-full bg-[#F7FAF7] px-5 py-7 md:px-8">
    <h1 className="text-[23px] font-normal leading-tight text-[#1E1E1E]">{title}</h1>
  </main>
);

const AdminNavigation = ({ onNavigate }) => {
  const [sectionOpenState, setSectionOpenState] = useState({});
  const location = useLocation();
  const activeSection = adminItems.find((item) => item.children?.some((child) => (
    location.pathname === child.to || location.pathname.startsWith(`${child.to}/`)
  )))?.label;

  return (
    <nav aria-label="Admin navigation" className="space-y-1 py-3">
      {adminItems.map(({ label, to, icon: Icon, end, children }) => {
        if (!children) {
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) => `flex h-10 items-center gap-3 px-4 text-sm transition-colors ${isActive ? 'bg-[#22C55E] font-semibold text-[#102718]' : 'text-[#CBD4CB] hover:bg-[#2A332C] hover:text-[#22C55E]'}`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          );
        }

        const isExpanded = sectionOpenState[label] ?? (activeSection === label);
        const firstChildActive = children.some((child, index) => (
          (index === 0 && location.pathname === child.to)
          || (index > 0 && location.pathname === child.to)
        ));

        return (
          <div key={label} className="group relative">
            <button
              type="button"
              onClick={() => setSectionOpenState((current) => ({ ...current, [label]: !isExpanded }))}
              aria-expanded={isExpanded}
              aria-haspopup="true"
              className={`flex h-10 w-full items-center gap-3 px-4 text-left text-sm transition-colors ${isExpanded || firstChildActive ? 'bg-[#22C55E] font-semibold text-[#102718]' : 'text-[#CBD4CB] hover:bg-[#2A332C] hover:text-[#22C55E]'}`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {isExpanded
                ? <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                : <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />}
            </button>

            {isExpanded && (
              <div className="space-y-0.5 bg-[#151A16] py-1 pl-12 pr-3">
                {children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    onClick={onNavigate}
                    end
                    className={({ isActive }) => `block py-2 text-sm transition-colors ${isActive ? 'font-semibold text-[#22C55E]' : 'text-[#CBD4CB] hover:text-[#22C55E]'}`}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}

            {!isExpanded && (
              <div className="absolute left-full top-0 z-50 hidden min-w-48 bg-[#1E1E1E] py-1 shadow-xl group-hover:block group-focus-within:block">
                {children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    onClick={onNavigate}
                    end
                    className={({ isActive }) => `block px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-[#2A332C] text-[#22C55E]' : 'text-[#CBD4CB] hover:bg-[#2A332C] hover:text-[#22C55E]'}`}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const AdminLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Admin Dashboard - TestSite';
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F7FAF7] text-[#1E1E1E]">
      <header className="flex h-9 items-center bg-[#1E1E1E] px-3 text-sm text-white">
        <Link to="/testsite/admin/dashboard" className="font-semibold tracking-wide">
          <span className="text-[#22C55E]">TEST</span><span>SITE</span>
        </Link>
        <Link to="/" className="ml-5 text-[#CBD4CB] transition-colors hover:text-[#22C55E]">View site</Link>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-[#CBD4CB] sm:inline">Welcome back, {user?.username || user?.email?.split('@')[0]}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-8 w-8 items-center justify-center text-[#CBD4CB] transition-colors hover:text-[#22C55E]"
            title="Log out"
            aria-label="Log out"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-2.25rem)]">
        <aside className="hidden w-[220px] shrink-0 bg-[#1E1E1E] md:block">
          <AdminNavigation />
        </aside>

        {mobileOpen && (
          <>
            <button
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setMobileOpen(false)}
              className="fixed inset-9 z-30 bg-black/40 md:hidden"
            />
            <aside className="fixed bottom-0 left-0 top-9 z-40 w-[240px] bg-[#1E1E1E] shadow-xl md:hidden">
              <div className="flex h-12 items-center justify-between border-b border-white/10 px-4 text-sm font-semibold text-white">
                <span>Admin menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close admin navigation">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <AdminNavigation onNavigate={() => setMobileOpen(false)} />
            </aside>
          </>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex h-12 items-center justify-between border-b border-[#DCE5DC] bg-white px-4 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center text-[#526052]"
              aria-label="Open admin navigation"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <span className="text-sm font-medium">Administration</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
