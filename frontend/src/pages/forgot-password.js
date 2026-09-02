import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/page-header';
import { requestPasswordReset } from '../services/api';

const ForgotPassword = ({ sent = false }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState(null);
  const email = searchParams.get('email') || '';
  const resetStorageKey = email => email ? `testsite-reset-expires-${email.toLowerCase()}` : null;
  const [expiresAt, setExpiresAt] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!sent || !email) return undefined;
    const storedExpiresAt = Number(localStorage.getItem(resetStorageKey(email)) || 0);
    setExpiresAt(storedExpiresAt);
    setRemainingSeconds(Math.max(0, Math.ceil((storedExpiresAt - Date.now()) / 1000)));
    const timer = window.setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((storedExpiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [sent, email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const response = await requestPasswordReset(identifier.trim());
      const resetExpiresAt = response.data.resetExpiresAt;
      const normalizedIdentifier = identifier.trim();
      const resetEmail = response.data.resetEmail || normalizedIdentifier;
      if (resetExpiresAt) {
        localStorage.setItem(resetStorageKey(resetEmail), String(resetExpiresAt));
      }
      navigate(`/forgot-password/sent?email=${encodeURIComponent(resetEmail)}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send the password reset email.');
    }
  };

  return (
    <>
      <PageHeader title="Forgot Password" subtitle="Recover access to your TestSite account." />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-10 shadow-xl">
          {sent ? (
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-900">Check your email</h2>
              <p className="mt-4 text-slate-600">If an account matches {email || 'your details'}, we sent a password reset link.</p>
              {expiresAt > 0 && (
                <p className={`mt-3 text-sm font-semibold ${remainingSeconds === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {remainingSeconds > 0
                    ? `Link expires in ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`
                    : 'This reset link has expired. Request a new one.'}
                </p>
              )}
              <Link to="/login" className="mt-6 inline-flex rounded-xl bg-[#22C55E] px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600">Back to Login</Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-slate-900">Forgot Password</h2>
              <p className="mt-2 text-sm text-slate-500">Enter your username or email address to receive a reset link.</p>
              {error && <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" placeholder="Username or Email" required />
                <button type="submit" className="w-full rounded-xl bg-[#22C55E] px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600">Send Reset Link</button>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default ForgotPassword;