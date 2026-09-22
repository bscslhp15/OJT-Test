import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const formatArchiveName = (slug) => decodeURIComponent(slug || '')
  .split('-')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let pageTitle = 'TestSite';

    if (path === '/about') pageTitle = 'About - TestSite';
    if (path === '/login') pageTitle = 'Login - TestSite';
    if (path === '/register') pageTitle = 'Sign Up - TestSite';
    if (path === '/services') pageTitle = 'Services - TestSite';
    if (path === '/pricing') pageTitle = 'Pricing - TestSite';
    if (path === '/contact') pageTitle = 'Contact - TestSite';
    if (path === '/create-post') pageTitle = 'Create Post - TestSite';
    if (path.startsWith('/edit-post/')) pageTitle = 'Edit Post - TestSite';
    if (path === '/blog') pageTitle = 'Blog - TestSite';
    if (path.startsWith('/blog/category/')) {
      pageTitle = `${formatArchiveName(path.split('/').pop())} - TestSite`;
    }
    if (path.startsWith('/blog/tag/')) {
      pageTitle = `${formatArchiveName(path.split('/').pop())} - TestSite`;
    }
    if (path.startsWith('/blog/')) pageTitle = pageTitle === 'TestSite' ? 'Blog - TestSite' : pageTitle;
    if (path.startsWith('/author/')) {
      pageTitle = `Author ${formatArchiveName(path.split('/').pop())} - TestSite`;
    }
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length === 1 && pageTitle === 'TestSite') {
      pageTitle = `${pathSegments[0]} - TestSite`;
    }

    document.title = pageTitle;
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-slate-50">
      <Navbar />
      <main className="w-full min-h-0 flex-1 bg-slate-50">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
