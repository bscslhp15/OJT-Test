import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useContext, useRef, useEffect } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import AuthContext from '../context/AuthContext';

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Services', to: '/services' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' }
];

const aboutMenu = [
  { label: 'About Us', to: '/about' },
  { label: 'Team', to: '/team' },
  { label: 'Testimonials', to: '/testimonials' },
  { label: 'Deep Drop Down', to: '/about#deep-drop-down' }
];

const socialLinks = [
  {
    label: 'Twitter',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M23 3a10.9 10.9 0 0 1-3.14.86 4.48 4.48 0 0 0 1.95-2.48 9 9 0 0 1-2.83 1.08 4.48 4.48 0 0 0-7.86 3.06A12.8 12.8 0 0 1 1.64 1.15 4.48 4.48 0 0 0 3.13 9.72a4.41 4.41 0 0 1-2.03-.56v.06a4.48 4.48 0 0 0 3.59 4.39 4.52 4.52 0 0 1-2.02.08 4.48 4.48 0 0 0 4.18 3.11 9 9 0 0 1-5.59 1.92A9.32 9.32 0 0 1 0 20.29a12.86 12.86 0 0 0 6.95 2.03c8.35 0 12.91-6.92 12.91-12.93 0-.2 0-.39-.01-.59A9.22 9.22 0 0 0 24 4.56a9.19 9.19 0 0 1-2.54.7z" />
      </svg>
    )
  },
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07c0 5 3.66 9.15 8.44 9.93v-7.03H8.44V12h2V9.66c0-2.2 1.2-3.42 3.24-3.42.94 0 1.94.17 1.94.17v2.12h-1.09c-1.08 0-1.42.67-1.42 1.36V12h2.42l-.39 2.97h-2.03v7.03C18.34 21.22 22 17.08 22 12.07z" />
      </svg>
    )
  },
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5h.01" />
      </svg>
    )
  },
  {
    label: 'LinkedIn',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M4.98 3.5A2.5 2.5 0 0 0 2.5 6v12A2.5 2.5 0 0 0 4.98 20.5h14.04A2.5 2.5 0 0 0 21.5 18V6a2.5 2.5 0 0 0-2.48-2.5H4.98zM8.34 17.75H5.75V10.5h2.59v7.25zM7.05 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6.56 8.25h-2.59v-3.75c0-.95-.34-1.6-1.19-1.6-.65 0-1.03.44-1.2.87-.06.14-.08.34-.08.54v3.94H6.93V10.5h2.49v1.03c.33-.5.93-1.2 2.27-1.2 1.66 0 2.91 1.08 2.91 3.4v4.02z" />
      </svg>
    )
  }
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const aboutRef = useRef(null);
  const profileRef = useRef(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const isAuthenticated = Boolean(user);
  const isUnconfirmed = isAuthenticated && !user.confirmed;
  const profilePhoto = user?.profile_photo || (user?.email ? localStorage.getItem(`testsite-profile-${user.email.toLowerCase()}`) : null);

  const getSocialUrl = (platform, value) => {
    if (!value) return '#';
    if (/^https?:\/\//i.test(value)) return value;

    const cleanValue = value.replace(/^@/, '').replace(/^\/+|\/+$/g, '');
    const prefixes = {
      facebook: 'https://facebook.com/',
      instagram: 'https://instagram.com/',
      twitter: 'https://twitter.com/',
      linkedin: 'https://linkedin.com/in/'
    };
    return `${prefixes[platform]}${cleanValue}`;
  };

  const handleCreatePost = () => {
    setProfileOpen(false);
    setMobileOpen(false);
    navigate(isUnconfirmed ? `/confirm?email=${encodeURIComponent(user.email || '')}` : '/create-post');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aboutRef.current && !aboutRef.current.contains(event.target)) {
        setAboutOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (src) => {
    const name = src || user?.username || user?.email || '';
    return name
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            <span className="uppercase">
              <span style={{ color: '#22C55E' }}>TEST</span>
              <span style={{ color: '#000' }}>SITE</span>
            </span>
          </Link>
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div className="flex items-center gap-8">
              {navItems.slice(0, -1).map((item) => {
                if (item.label === 'About') {
                  return (
                    <div key={item.label} className="relative" ref={aboutRef}>
                      <button
                        onClick={() => setAboutOpen(!aboutOpen)}
                        className="flex items-center gap-1 text-slate-600 group hover:text-emerald-600 transition"
                        type="button"
                      >
                        <span className={`${window.location.pathname === item.to ? 'text-[#22C55E]' : ''} relative inline-block`}>{item.label}
                          <span className={`${window.location.pathname === item.to ? 'w-full' : 'w-0 group-hover:w-full'} absolute left-0 -bottom-1 h-0.5 bg-emerald-600 transition-all duration-200`} />
                        </span>
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06-.02L10 10.585l3.71-3.396a.75.75 0 111.02 1.1l-4.2 3.84a.75.75 0 01-1.02 0l-4.2-3.84a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {aboutOpen && (
                        <div className="absolute left-0 z-20 mt-3 w-56 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                          {aboutMenu.map((menuItem) => (
                            <Link
                              key={menuItem.label}
                              to={menuItem.to}
                              onClick={() => setAboutOpen(false)}
                              className="block rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100"
                            >
                              {menuItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `${isActive ? 'text-[#22C55E]' : 'text-slate-600'} group hover:text-emerald-600 transition`
                    }
                  >
                    <span className="relative inline-block">
                      {item.label}
                      <span className={`${window.location.pathname === item.to ? 'w-full' : 'w-0 group-hover:w-full'} absolute left-0 -bottom-1 h-0.5 bg-emerald-600 transition-all duration-200`} />
                    </span>
                  </NavLink>
                );
              })}
            </div>

            <div className="flex items-center gap-6">
              <NavLink to="/contact" className={({ isActive }) => `${isActive ? 'text-[#22C55E]' : 'text-slate-600'} group hover:text-emerald-600 transition`}>
                <span className="relative inline-block">
                  Contact
                  <span className={`${window.location.pathname === '/contact' ? 'w-full' : 'w-0 group-hover:w-full'} absolute left-0 -bottom-1 h-0.5 bg-emerald-600 transition-all duration-200`} />
                </span>
              </NavLink>
              <div className="flex items-center gap-3">
                {!isAuthenticated ? (
                  <>
                    <Link to="/login" className="rounded-lg border border-emerald-500 px-4 py-2 text-sm text-emerald-600 transition hover:bg-emerald-50">Login</Link>
                    <Link to="/register" className="rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600">Sign Up</Link>
                  </>
                ) : (
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                      type="button"
                    >
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-semibold">{getInitials(user?.username || user?.email)}</span>
                      )}
                      <span className="hidden md:inline">{user?.username || (user?.email ? user.email.split('@')[0] : 'Account')}</span>
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06-.02L10 10.585l3.71-3.396a.75.75 0 111.02 1.1l-4.2 3.84a.75.75 0 01-1.02 0l-4.2-3.84a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 z-20 mt-3 w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                        <div className="flex items-start gap-3">
                          {profilePhoto ? (
                            <img src={profilePhoto} alt="Profile" className="h-12 w-12 rounded-full object-cover" />
                          ) : (
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-semibold">{getInitials(user?.username || user?.email)}</div>
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-800">{user?.name || user?.username || (user?.email ? user.email.split('@')[0] : 'User')}</div>
                            <div className="mt-1 text-xs text-slate-500">{user?.confirmed ? 'Confirmed account' : 'Unconfirmed account'}</div>
                          </div>
                        </div>
                        <div className="my-3 h-px bg-slate-100" />
                        <Link to="/account" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100">
                          <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
                          My account
                        </Link>
                        <button type="button" onClick={handleCreatePost} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100">
                          <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5l4 4L8 20l-4 1 1-4L16.5 3.5z"/></svg>
                          Create post
                        </button>
                        <button onClick={() => { logout(); setProfileOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-100">
                          <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
                          Log out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                {socialLinks.map((link) => {
                  const platform = link.label.toLowerCase();
                  const configuredLink = user?.social?.[platform];
                  return (
                  <a key={link.label} href={configuredLink ? getSocialUrl(platform, configuredLink) : '#'} target={configuredLink ? '_blank' : undefined} rel={configuredLink ? 'noreferrer' : undefined} aria-label={link.label} className="text-slate-600 transition hover:text-emerald-600">
                    {link.icon}
                  </a>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-slate-600 hover:text-emerald-600">
            {mobileOpen ? <XMarkIcon className="h-8 w-8" /> : <Bars3Icon className="h-8 w-8" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="space-y-2 px-4 py-4">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) => `block ${isActive ? 'text-[#22C55E]' : 'text-slate-700'} group hover:text-emerald-600`}
              >
                <span className="relative inline-block">
                  {item.label}
                  <span className={`${window.location.pathname === item.to ? 'w-full' : 'w-0 group-hover:w-full'} absolute left-0 -bottom-1 h-0.5 bg-emerald-600 transition-all duration-200`} />
                </span>
              </NavLink>
            ))}
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="block rounded-md border border-emerald-500 px-4 py-2 text-emerald-600">Login</Link>
                <Link to="/register" className="block rounded-md bg-[#22C55E] px-4 py-2 text-white hover:bg-emerald-600">Sign Up</Link>
              </>
            ) : (
              <>
                <Link to="/account" className="block rounded-md border border-slate-200 px-4 py-2 text-slate-700">My Account</Link>
                <button type="button" onClick={handleCreatePost} className="block w-full rounded-md border border-slate-200 px-4 py-2 text-left text-slate-700">Create Post</button>
                <button onClick={logout} className="w-full text-left rounded-md border border-slate-200 px-4 py-2 text-slate-700">Logout</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
