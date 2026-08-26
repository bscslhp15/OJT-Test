import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="w-full flex-1 bg-slate-50">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
