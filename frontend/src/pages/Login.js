import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/page-header';
import { loginUser } from '../services/api';
import AuthContext from '../context/auth-context';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await loginUser(form);
      const authenticatedUser = response.data?.user || response.data;
      login(authenticatedUser);
      navigate('/account');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    }
  };

  return (
    <>
      <PageHeader title="Login" subtitle="Sign in to access your TestSite account." />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-2xl font-semibold text-slate-900">Login</h2>
          <p className="mt-2 text-sm text-slate-500">Don’t have an account? <Link to="/register" className="text-emerald-600 hover:underline">Sign up</Link></p>
          {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input name="email" value={form.email} onChange={handleChange} type="email" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Email" required />
            <input name="password" value={form.password} onChange={handleChange} type="password" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Password" required />
            <button type="submit" className="w-full rounded-xl bg-[#22C55E] px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600">Login</button>
            <div className="text-sm text-slate-500"><Link to="/forgot-password" className="text-emerald-600 hover:underline">Forget Password?</Link></div>
          </form>
        </div>
      </section>
    </>
  );
};

export default Login;
