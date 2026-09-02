import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/auth-context';
import Layout from './components/layout';
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
import PostEditor from './pages/post-editor';
import Account from './pages/Account';
import Team from './pages/Team';
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
