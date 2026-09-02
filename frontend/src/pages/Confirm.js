import { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/page-header';
import { confirmAccount, resendConfirmationEmail } from '../services/api';
import AuthContext from '../context/auth-context';

const Confirm = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const confirmationStorageKey = email ? `testsite-confirmation-expires-${email.toLowerCase()}` : null;
  const [expiresAt, setExpiresAt] = useState(() => {
    const stored = confirmationStorageKey ? Number(localStorage.getItem(confirmationStorageKey)) : 0;
    return stored || 0;
  });
  const [remainingSeconds, setRemainingSeconds] = useState(() => expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)) : 0);
  const [message, setMessage] = useState(token ? 'Confirming your account...' : 'Check your email to confirm your account.');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { updateProfile } = useContext(AuthContext);

  useEffect(() => {
    if (token || !expiresAt) return undefined;
    const timer = window.setInterval(() => {
      setRemainingSeconds(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [token, expiresAt]);

  useEffect(() => {
    async function confirm() {
      if (!token) {
        return;
      }
      if (token === 'undefined') {
        setMessage('This confirmation link is invalid. Please register again.');
        return;
      }
      try {
        const response = await confirmAccount(token);
        updateProfile({ confirmed: true });
        setMessage(response.data.message || 'Account confirmed.');
        setTimeout(() => navigate('/login'), 2000);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Confirmation failed.');
      }
    }
    confirm();
  }, [token, navigate]);

  const handleResend = async () => {
    if (!email) {
      setMessage('Enter your email address on the registration page to request a new confirmation email.');
      return;
    }
    setIsResending(true);
    try {
      const response = await resendConfirmationEmail(email);
      const newExpiresAt = response.data.confirmationExpiresAt;
      if (confirmationStorageKey && newExpiresAt) {
        localStorage.setItem(confirmationStorageKey, String(newExpiresAt));
        setExpiresAt(newExpiresAt);
        setRemainingSeconds(Math.max(0, Math.ceil((newExpiresAt - Date.now()) / 1000)));
      }
      setMessage(response.data.message || 'A new confirmation email has been sent.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to resend the confirmation email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <PageHeader title="Confirmation" subtitle="Confirming your account now." />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
          <p className="text-slate-700 text-lg">{message}</p>
          {!token && (
            <>
              <p className="mt-4 text-sm text-slate-500">We sent a confirmation link to {email || 'your email address'}.</p>
              {expiresAt > 0 && (
                <p className={`mt-3 text-sm font-semibold ${remainingSeconds === 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {remainingSeconds > 0
                    ? `Link expires in ${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`
                    : 'This link has expired. Request a new confirmation email.'}
                </p>
              )}
              <button type="button" onClick={handleResend} disabled={isResending} className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                {isResending ? 'Sending...' : 'Resend confirmation email'}
              </button>
            </>
          )}
          <button type="button" onClick={() => navigate('/')} className="mt-4 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </section>
    </>
  );
};

export default Confirm;
