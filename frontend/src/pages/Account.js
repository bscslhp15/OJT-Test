import { useContext, useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/page-header';
import AuthContext from '../context/auth-context';
import { updateProfile as updateProfileRequest, requestPasswordChange } from '../services/api';

const firstRichTextToPlainText = (html) => {
  const container = document.createElement('div');
  container.innerHTML = html || '';
  for (const node of container.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      return node.textContent.replace(/\s+/g, ' ').trim();
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node.matches('p, h1, h2, h3, h4, h5, h6, blockquote, li')
        ? node
        : node.querySelector('p, h1, h2, h3, h4, h5, h6, blockquote, li');
      const text = element?.textContent || (node.tagName !== 'BR' ? node.textContent : '');
      if (text?.trim()) return text.replace(/\s+/g, ' ').trim();
    }
  }
  return (container.textContent || '').replace(/\s+/g, ' ').trim();
};

const firstTwoSentences = (text) => {
  const sentences = String(text || '').match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [];
  return sentences.slice(0, 2).join(' ').trim();
};

const getPostExcerpt = (post) => {
  if (post.description || post.excerpt) return firstTwoSentences(post.description || post.excerpt);
  if (typeof post.content !== 'string') return 'No description available';

  try {
    const parsed = JSON.parse(post.content);
    if (parsed && Array.isArray(parsed.blocks)) {
      const firstBlock = parsed.blocks.find((block) => block.type === 'paragraph' && block.data?.text)
        || parsed.blocks.find((block) => block.data?.text || block.data?.caption);
      const text = firstBlock
        ? firstRichTextToPlainText(firstBlock.data?.text || firstBlock.data?.caption || '')
        : '';
      return text ? firstTwoSentences(text) : 'No description available';
    }
  } catch (error) {
    // Continue with the legacy HTML excerpt below.
  }

  const text = firstRichTextToPlainText(post.content);
  return text ? firstTwoSentences(text) : 'No description available';
};

const ProfileField = ({ label, name, value, type = 'text', onChange }) => (
  <div className="min-w-0">
    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
    />
  </div>
);

const ProfileValue = ({ value }) => (
  <span className="min-w-0 break-words text-sm font-medium text-slate-700 [overflow-wrap:anywhere]">
    {value || 'Not provided'}
  </span>
);

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const Account = () => {
  const { user, updateProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordRequestExpiresAt, setPasswordRequestExpiresAt] = useState(0);
  const [passwordRequestRemaining, setPasswordRequestRemaining] = useState(0);
  const savedProfilePhoto = user?.profile_photo || (user?.email ? localStorage.getItem(`testsite-profile-${user.email.toLowerCase()}`) : null);
  const [photoPreview, setPhotoPreview] = useState(savedProfilePhoto);
  const photoInputRef = useRef(null);
  const canvasRef = useRef(null);
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    newPassword: '',
    bio: user?.bio || '',
    facebook: user?.social?.facebook || '',
    twitter: user?.social?.twitter || '',
    instagram: user?.social?.instagram || '',
    linkedin: user?.social?.linkedin || '',
    profilePhoto: user?.profile_photo || ''
  }));
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user?.email) return undefined;
    const storageKey = `testsite-change-password-expires-${user.email.toLowerCase()}`;
    const storedExpiresAt = Number(localStorage.getItem(storageKey) || 0);
    const activeExpiry = storedExpiresAt > Date.now() ? storedExpiresAt : 0;
    setPasswordRequestExpiresAt(activeExpiry);
    setPasswordRequestRemaining(activeExpiry > 0 ? Math.max(0, Math.ceil((activeExpiry - Date.now()) / 1000)) : 0);

    const timer = window.setInterval(() => {
      const nextExpiry = Number(localStorage.getItem(storageKey) || 0);
      const currentExpiry = nextExpiry > Date.now() ? nextExpiry : 0;
      setPasswordRequestExpiresAt(currentExpiry);
      setPasswordRequestRemaining(currentExpiry > 0 ? Math.max(0, Math.ceil((currentExpiry - Date.now()) / 1000)) : 0);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [user?.email]);

  useEffect(() => {
    const profilePhoto = user?.profile_photo || (user?.email ? localStorage.getItem(`testsite-profile-${user.email.toLowerCase()}`) : null);
    setPhotoPreview(profilePhoto || null);
    setForm((prev) => ({
      ...prev,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      profilePhoto: profilePhoto || ''
    }));
  }, [user]);

  if (!user) {
    return (
      <>
        <PageHeader title="My Account" subtitle="Please sign in to manage your profile." />
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Not signed in</h2>
            <p className="mt-4 text-slate-600">Please log in to view your profile and your posts.</p>
            <Link to="/login" className="mt-6 inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Go to Login</Link>
          </div>
        </section>
      </>
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  const handlePasswordFormChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChangeRequest = async () => {
    setPasswordChangeError('');
    setPasswordChangeMessage('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordChangeError('All password fields are required.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordChangeError('New password must be at least 8 characters long.');
      return;
    }

    try {
      const response = await requestPasswordChange({
        authKey: user.authKey,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmNewPassword: passwordForm.confirmPassword
      });

      const serverExpiresAt = Number(response.data.resetExpiresAt || 0);
      const expiresAt = Number.isFinite(serverExpiresAt) && serverExpiresAt > Date.now()
        ? serverExpiresAt
        : Date.now() + FIVE_MINUTES_MS;

      localStorage.setItem(`testsite-change-password-expires-${user.email.toLowerCase()}`, String(expiresAt));
      setPasswordRequestExpiresAt(expiresAt);
      setPasswordRequestRemaining(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
      setPasswordChangeMessage(response.data.message || 'A password change confirmation email has been sent.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      setPasswordChangeError(error.response?.data?.message || 'Unable to send the password change confirmation email.');
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
        setForm((prev) => ({ ...prev, profilePhoto: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const updates = {
      firstName: form.firstName,
      lastName: form.lastName,
      username: form.username,
      email: form.email,
      phone: form.phone,
      address: form.address,
      bio: form.bio,
      social: { 
        facebook: form.facebook,
        twitter: form.twitter,
        instagram: form.instagram,
        linkedin: form.linkedin 
      },
      profile_photo: form.profilePhoto
    };

    try {
      await updateProfileRequest({ ...updates, authKey: user.authKey });
      updateProfile(updates);
      setIsEditing(false);
    } catch (error) {
      alert(error.response?.data?.message || 'Unable to save profile changes.');
    }
  };

  const draftKey = `testsite-drafts-${String(user.email || user.username || 'anonymous').toLowerCase()}`;
  const drafts = JSON.parse(localStorage.getItem(draftKey) || '[]');
  const posts = [
    ...(user.posts || []),
    ...(Array.isArray(drafts) ? drafts.filter((draft) => !(user.posts || []).some((post) => String(post.id) === String(draft.id))) : [])
  ];

  return (
    <>
      <PageHeader title="My Account" subtitle="Manage your profile and your published blog posts." />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_759px] xl:gap-8">
          {/* Left Column - Profile Form */}
          <div className="w-full rounded-3xl bg-white p-5 shadow-xl self-start sm:p-8 xl:p-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">Edit Profile</h2>
                <p className="mt-1 text-sm text-slate-500">Update your account details and preferences.</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#22C55E] text-white hover:bg-emerald-600"
                type="button"
                aria-label={isEditing ? 'Cancel editing profile' : 'Edit profile'}
                title={isEditing ? 'Cancel editing' : 'Edit profile'}
              >
                <i className={`fas ${isEditing ? 'fa-times' : 'fa-pen'} text-base`} aria-hidden="true"></i>
              </button>
            </div>

            {/* Form Fields - Two Columns */}
            <div className="mt-8">
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-500 bg-slate-100 shadow-lg">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <i className="fas fa-user text-4xl"></i>
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="absolute -bottom-2 right-0 rounded-full bg-[#22C55E] px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-600"
                    >
                      Upload
                    </button>
                  )}
                </div>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="space-y-10">
                <div>
                  {isEditing ? (
                    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                      <ProfileField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
                      <ProfileField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
                      <ProfileField label="Email" name="email" value={form.email} type="email" onChange={handleChange} />
                      <ProfileField label="Username" name="username" value={form.username} onChange={handleChange} />
                      <ProfileField label="Phone" name="phone" value={form.phone} type="tel" onChange={handleChange} />
                      <ProfileField label="Address" name="address" value={form.address} onChange={handleChange} />
                    </div>
                  ) : (
                    <div className="space-y-3 px-1 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-slate-900">
                        <ProfileValue value={form.firstName} />
                        <ProfileValue value={form.lastName} />
                      </div>
                      <div className="relative grid gap-2 pt-3 sm:grid-cols-2 before:absolute before:bottom-0 before:left-1/2 before:top-3 before:w-px before:-translate-x-1/2 before:bg-slate-200">
                        <ProfileValue value={form.email} />
                        <ProfileValue value={form.username} />
                      </div>
                      <div className="relative grid gap-2 pt-3 sm:grid-cols-2 before:absolute before:bottom-0 before:left-1/2 before:top-3 before:w-px before:-translate-x-1/2 before:bg-slate-200">
                        <ProfileValue value={form.phone} />
                        <ProfileValue value={form.address} />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-[2rem] font-bold tracking-tight text-slate-900">Security</h3>
                  <div className="mt-4 border-t border-slate-300" />

                  {!showPasswordForm && !passwordChangeMessage && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(true)}
                        className="rounded-xl bg-[#22C55E] px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
                      >
                        Change Password
                      </button>
                    </div>
                  )}

                  {showPasswordForm && (
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current Password</label>
                        <input
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordFormChange}
                          type="password"
                          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">New Password</label>
                        <input
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordFormChange}
                          type="password"
                          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Confirm New Password</label>
                        <input
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordFormChange}
                          type="password"
                          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                        />
                      </div>

                      {passwordChangeError && (
                        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{passwordChangeError}</div>
                      )}

                      <button
                        type="button"
                        onClick={handlePasswordChangeRequest}
                        className="w-full rounded-xl bg-[#22C55E] px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
                      >
                        Change Password
                      </button>
                    </div>
                  )}

                  {passwordChangeMessage && passwordRequestExpiresAt > 0 && (
                    <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                      <p className="font-semibold">Check your email</p>
                      <p className="mt-1">{passwordChangeMessage}</p>
                      <p className={`mt-3 font-semibold ${passwordRequestRemaining === 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {passwordRequestRemaining > 0
                          ? `Confirmation link expires in ${Math.floor(passwordRequestRemaining / 60)}:${String(passwordRequestRemaining % 60).padStart(2, '0')}`
                          : 'This confirmation link has expired. Request a new password change.'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-[2rem] font-bold tracking-tight text-slate-900">Social links</h3>
                  <div className="mt-4 border-t border-slate-300" />
                  <div className="mt-6 space-y-3">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                      <span className="flex w-full shrink-0 items-center whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 sm:w-36 sm:py-0">
                        <i className="fab fa-facebook mr-2 text-[#22C55E]"></i> facebook.com/
                      </span>
                      <input
                        name="facebook"
                        value={form.facebook}
                        onChange={handleChange}
                        disabled={!isEditing}
                        type="text"
                        placeholder="yourprofile"
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 disabled:bg-slate-50"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                      <span className="flex w-full shrink-0 items-center whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 sm:w-36 sm:py-0">
                        <i className="fab fa-twitter mr-2 text-[#22C55E]"></i> twitter.com/
                      </span>
                      <input
                        name="twitter"
                        value={form.twitter}
                        onChange={handleChange}
                        disabled={!isEditing}
                        type="text"
                        placeholder="yourhandle"
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 disabled:bg-slate-50"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                      <span className="flex w-full shrink-0 items-center whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 sm:w-36 sm:py-0">
                        <i className="fab fa-instagram mr-2 text-[#22C55E]"></i> instagram.com/
                      </span>
                      <input
                        name="instagram"
                        value={form.instagram}
                        onChange={handleChange}
                        disabled={!isEditing}
                        type="text"
                        placeholder="yourprofile"
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 disabled:bg-slate-50"
                      />
                    </div>

                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                      <span className="flex w-full shrink-0 items-center whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 sm:w-36 sm:py-0">
                        <i className="fab fa-linkedin mr-2 text-[#22C55E]"></i> linkedin.com/in/
                      </span>
                      <input
                        name="linkedin"
                        value={form.linkedin}
                        onChange={handleChange}
                        disabled={!isEditing}
                        type="text"
                        placeholder="yourprofile"
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bio</label>
                    <textarea
                      name="bio"
                      value={form.bio}
                      onChange={handleChange}
                      disabled={!isEditing}
                      rows="4"
                      placeholder="Tell us about yourself..."
                      className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {isEditing && (
                <button
                  onClick={handleSave}
                  type="button"
                  className="mt-8 rounded-xl bg-[#22C55E] px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  Save Profile
                </button>
              )}
            </div>
          </div>

          {/* Right Column - Blog Posts */}
          <div className="w-full xl:w-[759px] xl:justify-self-end">
            <div className="rounded-3xl bg-white p-4 shadow-xl sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Your Blog Posts</h2>
                  <p className="mt-1 text-sm text-slate-500">Manage your posts.</p>
                </div>
              </div>
              <Link to="/create-post" className="mt-4 block rounded-xl bg-[#22C55E] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-600">
                Create Post
              </Link>
              <div className="mt-6 space-y-4">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 p-5 text-center text-sm text-slate-600">No posts yet. Create your first blog post.</div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-md">
                    {/* Post Title */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-slate-900 text-base">{post.title}</p>
                        {post.status === 'draft' && <span className="shrink-0 border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">Draft</span>}
                      </div>
                    </div>

                    {/* Post Date */}
                    <div className="px-5">
                      <p className="text-xs text-slate-500">{post.date}</p>
                    </div>

                    {/* Featured Image */}
                    {(post.featuredImage || post.image) && (
                      <div className="mt-3 px-5">
                        <img 
                          src={post.featuredImage || post.image} 
                          alt={post.title} 
                          className="h-56 w-full rounded-xl object-cover sm:h-64"
                        />
                      </div>
                    )}

                    {/* Post Description/Content */}
                    <div className="mt-3 px-5">
                      <p className="text-sm text-slate-700 line-clamp-2">{getPostExcerpt(post)}</p>
                    </div>

                    {/* Read Story Link */}
                    <div className="mt-4 px-5 pb-5">
                      <Link
                        to={post.status === 'draft' ? `/edit-post/${post.id}` : `/blog/${post.id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        {post.status === 'draft' ? 'Edit draft' : 'Read story'}
                        <i className="fas fa-arrow-right text-xs"></i>
                      </Link>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Account;
