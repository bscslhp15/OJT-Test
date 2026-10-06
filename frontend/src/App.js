import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider } from './context/auth-context';
import AuthContext from './context/auth-context';
import Layout from './components/Layout';
import AdminLayout, { AdminDashboard, AdminPage } from './components/Admin';
import AdminCategories from './components/AdminCategories';
import AdminTags from './components/AdminTags';
import AdminPosts from './components/AdminPosts';
import AdminUsers from './components/AdminUsers';
import AdminAddUser from './components/AdminAddUser';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Confirm from './pages/Confirm';
import About from './pages/About';
import Blog from './pages/Blog';
import SingleBlog from './pages/single-blog';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import Services from './pages/Services';
import Testimonials from './pages/Testimonials';
import PostEditor from './pages/PostEditor';
import Account from './pages/Account';
import Team from './pages/Team';
import Portfolio from './pages/Portfolio';
import ForgotPassword from './pages/forgot-password';
import ResetPassword from './pages/reset-password';

const RequireAdmin = () => {
  const { user } = useContext(AuthContext);
  return user?.isAdmin ? <Outlet /> : <Navigate to={user ? '/' : '/login'} replace />;
};

const LegacyAdminRedirect = () => {
  const location = useLocation();
  const destination = location.pathname === '/admin'
    ? '/testsite/admin/dashboard'
    : `/testsite${location.pathname}`;
  return <Navigate to={`${destination}${location.search}${location.hash}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RequireAdmin />}>
            <Route path="admin/*" element={<LegacyAdminRedirect />} />
            <Route path="testsite/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="posts">
                <Route index element={<AdminPosts />} />
                <Route path="add" element={<AdminPage title="Add Post" />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="tags" element={<AdminTags />} />
              </Route>
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/add" element={<AdminAddUser />} />
              <Route path="users/profile" element={<AdminPage title="Profile" />} />
            </Route>
          </Route>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="forgot-password/sent" element={<ForgotPassword sent />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
            <Route path="register" element={<Register />} />
            <Route path="confirm/:token" element={<Confirm />} />
            <Route path="confirm" element={<Confirm />} />
            <Route path="about" element={<About />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/category/:categorySlug" element={<Blog />} />
            <Route path="blog/tag/:tagSlug" element={<Blog />} />
            <Route path="blog/:year/:month/:day/:slug" element={<SingleBlog />} />
            <Route path="blog/:id" element={<SingleBlog />} />
            <Route path="contact" element={<Contact />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="services" element={<Services />} />
            <Route path="team" element={<Team />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="create-post" element={<PostEditor />} />
            <Route path="edit-post/:id" element={<PostEditor />} />
            <Route path="account" element={<Account />} />
            <Route path="author/:authorSlug" element={<Account />} />
            <Route path=":username" element={<Account />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
