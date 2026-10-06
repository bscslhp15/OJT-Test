import { useContext, useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import AuthContext from '../context/auth-context';
import { createAdminUser } from '../services/api';

const fieldClassName = 'h-10 w-full max-w-[350px] rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm text-[#1E1E1E] outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]';
const labelClassName = 'pt-2 text-sm font-semibold text-[#1E1E1E]';

const getPasswordStrength = (password) => {
  if (!password) return null;

  const characterGroups = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((pattern) => pattern.test(password)).length;
  const score = Number(password.length >= 8)
    + Number(password.length >= 12)
    + Number(characterGroups >= 2)
    + Number(characterGroups >= 3)
    + Number(characterGroups >= 4);

  if (password.length < 6 || score <= 1) return { label: 'Very weak', className: 'bg-[#fca5a5]' };
  if (score <= 2) return { label: 'Weak', className: 'bg-[#fecaca]' };
  if (score <= 4) return { label: 'Medium', className: 'bg-[#fed7aa]' };
  return { label: 'Strong', className: 'bg-[#bbf7d0]' };
};

const AdminAddUser = () => {
  const { user } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const passwordStrength = getPasswordStrength(password);

  const generatePassword = () => {
    const alphabet = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*';
    const randomValues = window.crypto.getRandomValues(new Uint32Array(20));
    setPassword(Array.from(randomValues, (value) => alphabet[value % alphabet.length]).join(''));
    setShowPassword(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback({ type: '', message: '' });

    const formData = new FormData(event.currentTarget);
    const payload = {
      username: formData.get('username').trim(),
      email: formData.get('email').trim(),
      firstName: formData.get('firstName').trim(),
      lastName: formData.get('lastName').trim(),
      website: formData.get('website').trim(),
      password,
      role: formData.get('role'),
      sendNotification: formData.get('sendNotification') === 'on'
    };

    try {
      const authKey = user?.authKey || user?.auth_key;
      const { data } = await createAdminUser(authKey, payload);
      const message = data.emailSent
        ? 'User created. An account notification was sent to the email address.'
        : data.emailSent === false
          ? 'User created, but the notification email could not be sent. Check the mail server settings.'
          : 'User created. No notification email was sent.';
      setFeedback({ type: data.emailSent === false ? 'error' : 'success', message });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'The user could not be created. Check the information and try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
  <main className="min-h-full bg-[#F7FAF7] px-4 py-6 text-[#1E1E1E] md:px-6">
    <h1 className="text-2xl font-normal">Add User</h1>
    <p className="mt-4 text-[13px] text-[#69736A]">Create a brand new user and add them to this site.</p>

    {feedback.message && <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`mt-5 max-w-[760px] rounded-xl border-l-4 bg-white px-4 py-3 text-sm ${feedback.type === 'error' ? 'border-red-600 text-red-700' : 'border-[#22C55E] text-[#176B34]'}`}>{feedback.message}</div>}

    <form onSubmit={handleSubmit} className="mt-7 max-w-[760px]">
    <div className="grid grid-cols-1 gap-x-0 gap-y-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-y-[29px]">
      <label className={labelClassName} htmlFor="new-username">Username (required)</label>
      <input className={fieldClassName} id="new-username" name="username" type="text" autoComplete="username" required />

      <label className={labelClassName} htmlFor="new-email">Email (required)</label>
      <input className={fieldClassName} id="new-email" name="email" type="email" autoComplete="email" required />

      <label className={labelClassName} htmlFor="new-first-name">First Name</label>
      <input className={fieldClassName} id="new-first-name" name="firstName" type="text" autoComplete="given-name" />

      <label className={labelClassName} htmlFor="new-last-name">Last Name</label>
      <input className={fieldClassName} id="new-last-name" name="lastName" type="text" autoComplete="family-name" />

      <label className={labelClassName} htmlFor="new-website">Website</label>
      <input className={fieldClassName} id="new-website" name="website" type="url" />

      <label className={labelClassName} htmlFor="new-password">Password</label>
      <div className="flex w-full max-w-[445px] flex-col items-start gap-3">
        <button type="button" onClick={generatePassword} className="h-10 rounded-xl border border-[#22C55E] px-4 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Generate password</button>
        <div className="flex w-full flex-wrap items-start gap-1.5">
          <div className="min-w-[200px] flex-1 basis-[280px]">
            <input
              className={fieldClassName}
              id="new-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            {passwordStrength && (
              <div aria-live="polite" className={`flex h-6 items-center justify-center rounded-b-xl text-sm font-semibold text-[#1E1E1E] ${passwordStrength.className}`}>
                {passwordStrength.label}
              </div>
            )}
          </div>
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">
            {showPassword ? <EyeSlashIcon className="h-4 w-4" aria-hidden="true" /> : <EyeIcon className="h-4 w-4" aria-hidden="true" />}
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <span className={labelClassName}>Send User Notification</span>
      <label className="flex min-h-10 items-center gap-2 text-sm text-[#69736A]">
        <input type="checkbox" name="sendNotification" defaultChecked className="green-checkbox focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#22C55E]" />
        <span>Send the new user an email about their account</span>
      </label>

      <label className={labelClassName} htmlFor="new-user-role">Role</label>
      <select className="h-10 w-fit min-w-[123px] rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm text-[#1E1E1E] outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]" id="new-user-role" name="role" defaultValue="author">
        <option value="author">Author</option>
        <option value="administrator">Administrator</option>
      </select>
    </div>

    <button type="submit" disabled={submitting} className="mt-8 h-10 rounded-xl border border-[#22C55E] px-4 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718] disabled:cursor-wait disabled:opacity-60">{submitting ? 'Creating...' : 'Add User'}</button>
    </form>
  </main>
  );
};

export default AdminAddUser;