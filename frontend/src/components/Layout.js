import { Outlet } from 'react-router-dom';
import Navbar from './navbar';
import Footer from './footer';

const Layout = () => {
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
