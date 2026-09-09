import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import Layout from './components/layout';
import Home from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import Confirm from './pages/confirm';
import About from './pages/about';
import Blog from './pages/blog';
import SingleBlog from './pages/single-blog';
import Contact from './pages/contact';
import Pricing from './pages/pricing';
import Services from './pages/services';
import Testimonials from './pages/testimonials';
import PostEditor from './pages/post-editor';
import Account from './pages/account';
import Team from './pages/team';
import ForgotPassword from './pages/forgot-password';
import ResetPassword from './pages/reset-password';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
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
            <Route path="blog/:id" element={<SingleBlog />} />
            <Route path="contact" element={<Contact />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="services" element={<Services />} />
            <Route path="team" element={<Team />} />
            <Route path="testimonials" element={<Testimonials />} />
            <Route path="create-post" element={<PostEditor />} />
            <Route path="edit-post/:id" element={<PostEditor />} />
            <Route path="account" element={<Account />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
