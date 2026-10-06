import { useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowLeftOnRectangleIcon,
  ArrowRightIcon,
  Bars3Icon,
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentTextIcon,
  FolderIcon,
  PlusIcon,
  TagIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AuthContext from '../context/auth-context';
import { useLocation } from 'react-router-dom';
import { fetchAdminUsers } from '../services/api';
import { loadPublicPosts } from '../services/public-data';
import { getStoredCategories } from '../services/categories';
import { getStoredTags } from '../services/tags';
import { isPostVisible } from '../services/post-status';

const adminItems = [
  { label: 'Dashboard', to: '/testsite/admin/dashboard', icon: ChartBarIcon, end: true },
  {
    label: 'Posts',
    icon: DocumentTextIcon,
    children: [
      { label: 'All Posts', to: '/testsite/admin/posts' },
      { label: 'Add Post', to: '/create-post' },
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
      { label: 'Profile', to: '/leyharvie' }
    ]
  }
];

export const AdminPage = ({ title }) => (
  <main className="min-h-full bg-[#F7FAF7] px-5 py-7 md:px-8">
    <h1 className="text-[23px] font-normal leading-tight text-[#1E1E1E]">{title}</h1>
  </main>
);

const formatDashboardDate = (value) => {
  const date = new Date(value || '');
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const DashboardStat = ({ label, value, detail, icon: Icon, tone }) => (
  <div className="rounded-lg border border-[#C8D0C8] bg-white p-4">
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#69736A]">{label}</span>
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    </div>
    <div className="mt-3 text-2xl font-semibold text-[#1E1E1E]">{value}</div>
    <div className="mt-1 text-xs text-[#69736A]">{detail}</div>
  </div>
);

export const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [userCount, setUserCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const authKey = user?.authKey || user?.auth_key;
    const usersRequest = authKey
      ? fetchAdminUsers(authKey)
        .then(({ data }) => Array.isArray(data?.users) ? data.users.length : 0)
        .catch(() => null)
      : Promise.resolve(null);

    Promise.all([loadPublicPosts(), usersRequest])
      .then(([loadedPosts, loadedUserCount]) => {
        if (!isMounted) return;
        setPosts(Array.isArray(loadedPosts) ? loadedPosts : []);
        setUserCount(loadedUserCount);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [user?.authKey, user?.auth_key]);

  const activePosts = posts.filter(isPostVisible);
  const publishedCount = activePosts.filter((post) => (post.status || 'published') === 'published').length;
  const draftCount = posts.filter((post) => post.status === 'draft').length;
  const categoryNames = [
    ...getStoredCategories().map((category) => category.name),
    ...posts.flatMap((post) => String(post.category || 'Uncategorized').split(','))
  ].map((name) => String(name || '').trim().toLowerCase()).filter(Boolean);
  const tagNames = [
    ...getStoredTags().map((tag) => tag.name),
    ...posts.flatMap((post) => Array.isArray(post.tags) ? post.tags : String(post.tags || '').split(','))
  ].map((name) => String(name || '').trim().toLowerCase()).filter(Boolean);
  const categoryCount = new Set(categoryNames).size;
  const tagCount = new Set(tagNames).size;
  const recentPosts = [...posts]
    .sort((left, right) => Date.parse(right.publishedAt || right.createdAt || right.created_at || '') - Date.parse(left.publishedAt || left.createdAt || left.created_at || ''))
    .slice(0, 6);
  const stats = [
    { label: 'Published posts', value: loading ? '—' : publishedCount, detail: 'Visible on your site', icon: DocumentTextIcon, tone: 'bg-[#E7F6EC] text-[#16803C]' },
    { label: 'Drafts', value: loading ? '—' : draftCount, detail: 'Still in progress', icon: ClockIcon, tone: 'bg-[#FFF4E5] text-[#A65C00]' },
    { label: 'Categories', value: loading ? '—' : categoryCount, detail: 'Organize your posts', icon: FolderIcon, tone: 'bg-[#EAF1FB] text-[#416DA8]' },
    { label: 'Tags', value: loading ? '—' : tagCount, detail: 'Topics readers follow', icon: TagIcon, tone: 'bg-[#F1ECFA] text-[#7652A6]' },
    { label: 'Users', value: userCount === null ? '—' : userCount, detail: 'Site accounts', icon: UsersIcon, tone: 'bg-[#E9F3F3] text-[#287777]' }
  ];
  const quickActions = [
    { label: 'Create a post', description: 'Write and publish something new', to: '/create-post', icon: PlusIcon },
    { label: 'Manage posts', description: 'Edit, filter, or review content', to: '/testsite/admin/posts', icon: DocumentTextIcon },
    { label: 'Add a user', description: 'Create an author or administrator', to: '/testsite/admin/users/add', icon: UsersIcon },
    { label: 'Categories and tags', description: 'Keep site content organized', to: '/testsite/admin/posts/categories', icon: TagIcon }
  ];

  return (
    <main className="min-h-full bg-[#F7FAF7] px-4 py-6 text-[#1E1E1E] md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal">Dashboard</h1>
          <p className="mt-1 text-sm text-[#69736A]">A snapshot of your TestSite content and activity.</p>
        </div>
        <Link to="/create-post" className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">
          <PlusIcon className="h-4 w-4" aria-hidden="true" /> Create post
        </Link>
      </div>

      <section aria-label="Site overview" className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => <DashboardStat key={stat.label} {...stat} />)}
      </section>

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <section aria-labelledby="recent-posts-heading" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="recent-posts-heading" className="text-base font-semibold">Recent posts</h2>
              <p className="mt-1 text-xs text-[#69736A]">The latest content added to your site.</p>
            </div>
            <Link to="/testsite/admin/posts" className="inline-flex items-center gap-1 text-sm text-[#16803C] hover:underline">All posts <ArrowRightIcon className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[#C8D0C8] bg-white">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead className="text-[#384238]">
                <tr className="border-b border-[#C8D0C8]">
                  <th className="px-3 py-3 font-medium">Title</th>
                  <th className="px-3 py-3 font-medium">Author</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-[#69736A]">Loading posts...</td></tr>
                ) : recentPosts.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-[#69736A]">No posts yet. Create your first post to get started.</td></tr>
                ) : recentPosts.map((post, index) => {
                  const status = post.status || 'published';
                  const statusTone = status === 'published'
                    ? 'bg-[#E7F6EC] text-[#176B34]'
                    : status === 'draft'
                      ? 'bg-[#FFF4E5] text-[#8A5100]'
                      : 'bg-[#EFF2EF] text-[#526052]';
                  return (
                    <tr key={`${post.id}-${index}`} className={`border-b border-[#DCE5DC] last:border-0 ${index % 2 ? 'bg-[#F7FAF7]' : 'bg-white'}`}>
                      <td className="max-w-[260px] truncate px-3 py-3 font-medium text-[#2271B1]">{post.title || 'Untitled'}</td>
                      <td className="px-3 py-3 text-[#526052]">{post.author || 'Author'}</td>
                      <td className="px-3 py-3"><span className={`inline-flex rounded-full px-2 py-1 text-xs capitalize ${statusTone}`}>{status.startsWith('trash:') ? 'Trash' : status}</span></td>
                      <td className="whitespace-nowrap px-3 py-3 text-[#69736A]">{formatDashboardDate(post.publishedAt || post.createdAt || post.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="quick-actions-heading" className="rounded-lg border border-[#C8D0C8] bg-white p-4">
          <h2 id="quick-actions-heading" className="text-base font-semibold">Quick actions</h2>
          <p className="mt-1 text-xs text-[#69736A]">Common tasks for managing TestSite.</p>
          <div className="mt-3 divide-y divide-[#E5EBE5]">
            {quickActions.map(({ label, description, to, icon: Icon }) => (
              <Link key={label} to={to} className="group flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E7F6EC] text-[#16803C]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[#1E1E1E] group-hover:text-[#16803C]">{label}</span>
                  <span className="mt-0.5 block text-xs text-[#69736A]">{description}</span>
                </span>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-[#899389] group-hover:text-[#16803C]" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

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
      <header className="sticky top-0 z-50 flex h-9 items-center bg-[#1E1E1E] px-3 text-sm text-white">
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
