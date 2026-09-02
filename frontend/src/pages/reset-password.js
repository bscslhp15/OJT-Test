import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/page-header';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await resetPassword(token, password);
      navigate('/login');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'This reset link is invalid or expired.');
    }
  };

  return (
    <>
      <PageHeader title="Reset Password" subtitle="Choose a new password for your account." />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-2xl font-semibold text-slate-900">Reset Password</h2>
          {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="New Password" minLength="8" required />
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Confirm New Password" minLength="8" required />
            <button type="submit" className="w-full rounded-xl bg-[#22C55E] px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600">Reset Password</button>
          </form>
          <Link to="/login" className="mt-5 block text-center text-sm !text-[#22C55E] hover:!text-[#22C55E] focus:!text-[#22C55E] active:!text-[#22C55E] hover:underline">Back to Login</Link>
        </div>
      </section>
    </>
  );
};

export default ResetPassword;