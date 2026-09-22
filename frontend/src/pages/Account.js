import { useContext, useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/page-header';
import AuthContext, { getDeletedPostIds } from '../context/auth-context';
import { fetchComments, updatePost as updatePostRequest, updateProfile as updateProfileRequest, requestPasswordChange } from '../services/api';
import { createPostSlug, getEditPostUrl, getPostUrl } from '../services/post-url';
import { createAccountSlug, createAuthorSlug, getAccountUrl, getPostAuthorUrl, getProfileUrl } from '../services/account-url';
import { isPostVisible } from '../services/post-status';
import { loadPublicProfile } from '../services/public-data';

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

const getReadMoreExcerpt = (html) => {
  const markerMatch = String(html || '').match(/data-read-more\s*=\s*(['"])true\1/i);
  if (!markerMatch) return null;
  const markerIndex = markerMatch.index;
  const container = document.createElement('div');
  container.innerHTML = String(html).slice(0, markerIndex);
  return (container.textContent || '').replace(/\s+/g, ' ').trim();
};

const getPostSortTimestamp = (post) => {
  const rawValue = post?.publishedAt || post?.createdAt || post?.date || '';
  const parsed = new Date(rawValue).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const getPostExcerpt = (post) => {
  if (typeof post.content !== 'string') return 'No description available';

  try {
    const parsed = JSON.parse(post.content);
    if (parsed && Array.isArray(parsed.blocks)) {
      const contentBeforeReadMore = getReadMoreExcerpt(parsed.blocks.map((block) => block.data?.text || block.data?.caption || '').join('<p></p>'));
      if (contentBeforeReadMore !== null) return contentBeforeReadMore || 'No description available';
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

  const contentBeforeReadMore = getReadMoreExcerpt(post.content);
  if (contentBeforeReadMore !== null) return contentBeforeReadMore || 'No description available';
  if (post.description || post.excerpt) return firstTwoSentences(post.description || post.excerpt);
  const text = firstRichTextToPlainText(post.content);
  return text ? firstTwoSentences(text) : 'No description available';
};

const getCommentCount = (postId, commentCounts = {}) => {
  if (Object.prototype.hasOwnProperty.call(commentCounts, String(postId))) {
    return commentCounts[String(postId)];
  }
  try {
    const savedComments = JSON.parse(localStorage.getItem(`testsite-comments-${postId}`) || '[]');
    return Array.isArray(savedComments) ? savedComments.length : 0;
  } catch (error) {
    return 0;
  }
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

const getSocialHandleValue = (value) => {
  try {
    const parsed = new URL(String(value).match(/^https?:\/\//i) ? value : `https://${value}`);
    return parsed.pathname.replace(/^\/+|\/+$/g, '') || parsed.hostname;
  } catch (error) {
    return String(value || '').replace(/^@/, '').replace(/^\/+|\/+$/g, '');
  }
};

const FIVE_MINUTES_MS = 5 * 60 * 1000;

const getPersistedProfileBySlug = (slug) => {
  if (!slug) return null;
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith('testsite-user-persist-')) continue;
    try {
      const persistedUser = JSON.parse(localStorage.getItem(key) || 'null');
      if (createAccountSlug(persistedUser?.username || persistedUser?.email?.split('@')[0]) === slug
        || createAuthorSlug([persistedUser?.firstName, persistedUser?.lastName].filter(Boolean).join(' ')) === slug) {
        const posts = persistedUser.email
          ? JSON.parse(localStorage.getItem(`testsite-posts-${persistedUser.email.toLowerCase()}`) || '[]')
          : [];
        return { ...persistedUser, posts: Array.isArray(posts) ? posts : [] };
      }
    } catch (error) {
      // Ignore malformed profile storage.
    }
  }

  const globalPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
  const authorPosts = Array.isArray(globalPosts)
    ? globalPosts.filter((post) => createAccountSlug(post.authorId?.split('@')[0] || post.author) === slug)
    : [];
  const sourcePost = authorPosts[0];
  if (sourcePost) {
    const [firstName = '', ...lastNameParts] = String(sourcePost.author || '').split(' ');
    return {
      username: slug,
      firstName,
      lastName: lastNameParts.join(' '),
      email: sourcePost.authorId?.includes('@') ? sourcePost.authorId : '',
      profile_photo: sourcePost.authorAvatar || '',
      social: sourcePost.authorSocial || {},
      bio: sourcePost.authorBio || '',
      posts: authorPosts
    };
  }
  return null;
};

const PublicProfile = ({ profile }) => {
  const profilePosts = (Array.isArray(profile.posts) ? profile.posts : []).filter(isPostVisible).sort((left, right) => getPostSortTimestamp(right) - getPostSortTimestamp(left));
  const [commentCounts, setCommentCounts] = useState({});
  const profilePhoto = profile.profile_photo || (profile.email ? localStorage.getItem(`testsite-profile-${profile.email.toLowerCase()}`) : null);
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.name || profile.username || 'User';
  const socialLinks = [
    ['Facebook', 'fa-facebook', 'facebook.com/', profile.social?.facebook],
    ['Twitter', 'fa-twitter', 'twitter.com/', profile.social?.twitter],
    ['Instagram', 'fa-instagram', 'instagram.com/', profile.social?.instagram],
    ['LinkedIn', 'fa-linkedin', 'linkedin.com/in/', profile.social?.linkedin]
  ].filter(([, , , value]) => value);

  const getSocialHandle = (value) => {
    try {
      const parsed = new URL(value.match(/^https?:\/\//i) ? value : `https://${value}`);
      return parsed.pathname.replace(/^\/+|\/+$/g, '') || parsed.hostname;
    } catch (error) {
      return String(value).replace(/^@/, '').replace(/^\/+|\/+$/g, '');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadCommentCounts = async () => {
      const entries = await Promise.all(profilePosts.map(async (post) => {
        try {
          const { data } = await fetchComments(post.id);
          return [String(post.id), Array.isArray(data) ? data.length : 0];
        } catch (error) {
          return null;
        }
      }));
      if (isMounted) setCommentCounts(Object.fromEntries(entries.filter(Boolean)));
    };
    if (profilePosts.length > 0) loadCommentCounts();
    return () => { isMounted = false; };
  }, [profilePosts.map((post) => String(post.id)).join(',')]);

  return (
    <>
      <PageHeader title={fullName} subtitle="Profile" />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_759px] xl:gap-8">
          <div className="w-full rounded-3xl bg-white p-5 text-center shadow-xl sm:p-8 xl:p-10">
            {profilePhoto ? <img src={profilePhoto} alt={profile.username || 'Profile'} className="mx-auto h-32 w-32 rounded-full border-4 border-emerald-500 object-cover" /> : <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-emerald-600 text-4xl font-semibold text-white">{(profile.username || 'A')[0].toUpperCase()}</div>}
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">{fullName}</h2>
            <div className="relative mt-5 grid gap-2 border-t border-slate-100 pt-5 text-center sm:grid-cols-2 before:absolute before:bottom-0 before:left-1/2 before:top-5 before:w-px before:-translate-x-1/2 before:bg-slate-200">
              <ProfileValue value={profile.email} />
              <ProfileValue value={profile.username} />
              <ProfileValue value={profile.phone} />
              <ProfileValue value={profile.address} />
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5 text-left">
              <h3 className="text-sm font-semibold text-slate-900">Social links</h3>
              <div className="mt-4 border-t border-slate-300" />
              {socialLinks.length > 0 && (
                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  {socialLinks.map(([name, icon, prefix, value]) => (
                    <li key={name} className="flex min-w-0 items-center gap-3">
                      <i className={`fab ${icon} w-4 shrink-0 text-[#22C55E]`} aria-hidden="true" />
                      <a href={value.startsWith('http') ? value : `https://${prefix}${getSocialHandle(value)}`} target="_blank" rel="noreferrer" className="min-w-0 break-all hover:text-emerald-600">
                        {prefix}{getSocialHandle(value)}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {profile.bio && (
                <div className="mt-6 border-t border-slate-100 pt-5 text-left">
                  <h3 className="text-sm font-semibold text-slate-900">Bio</h3>
                  <div className="mt-4 border-t border-slate-300" />
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-600">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
          <div className="w-full xl:w-[759px] xl:justify-self-end space-y-8">
            {profilePosts.map((post) => (
              <article key={post.id} className="group relative overflow-hidden rounded-3xl bg-white shadow-lg">
                {(post.featuredImage || post.image) && <Link to={getPostUrl(post)} className="block"><img src={post.featuredImage || post.image} alt={post.title} className="h-80 w-full object-cover transition duration-200 hover:brightness-95" /></Link>}
                <div className="p-8">
                  <h2 className="text-2xl font-semibold text-slate-900"><Link to={getPostUrl(post)} className="transition hover:text-emerald-600">{post.title}</Link></h2>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span><i className="fas fa-user mr-1" aria-hidden="true" />{post.author || fullName}</span>
                    <span><i className="far fa-calendar mr-1" aria-hidden="true" />{post.date}</span>
                    <Link to={`${getPostUrl(post)}#comments`} className="hover:text-emerald-600"><i className="far fa-comments mr-1" aria-hidden="true" />{commentCounts[String(post.id)] ?? getCommentCount(post.id)} Comments</Link>
                  </div>
                  <p className="mt-4 text-slate-600">{getPostExcerpt(post)}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs opacity-100 select-none"><Link to={getPostUrl(post)} className="cursor-pointer text-[#22C55E] hover:underline">View</Link></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

const Account = () => {
  const { user, updateProfile, deletePost } = useContext(AuthContext);
  const { username, authorSlug } = useParams();
  const profileSlug = authorSlug || username;
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [trashConfirmPostId, setTrashConfirmPostId] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordRequestExpiresAt, setPasswordRequestExpiresAt] = useState(0);
  const [passwordRequestRemaining, setPasswordRequestRemaining] = useState(0);
  const [publicProfileState, setPublicProfileState] = useState(null);
  const [quickEditPostId, setQuickEditPostId] = useState(null);
  const [quickEditForm, setQuickEditForm] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
  const isOwnProfile = Boolean(user && profileSlug && createAccountSlug(user.username || user.email?.split('@')[0]) === profileSlug);
  const isPublicProfile = Boolean(authorSlug) || location.search === '?view=profile' || Boolean(profileSlug && !isOwnProfile);
  const publicProfile = isPublicProfile
    ? (publicProfileState || getPersistedProfileBySlug(profileSlug) || user)
    : (!user || createAccountSlug(user.username || user.email?.split('@')[0]) !== profileSlug
      ? (publicProfileState || getPersistedProfileBySlug(profileSlug))
      : user);
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
    if (user && !profileSlug && !isPublicProfile && location.pathname !== getAccountUrl(user)) {
      navigate(getAccountUrl(user), { replace: true });
    }
  }, [user, profileSlug, isPublicProfile, location.pathname, navigate]);

  useEffect(() => {
    let isMounted = true;
    if (profileSlug) {
      loadPublicProfile(profileSlug).then((profile) => {
        if (isMounted) setPublicProfileState(profile);
      });
    }
    return () => { isMounted = false; };
  }, [isPublicProfile, profileSlug, user]);

  useEffect(() => {
    let isMounted = true;
    const posts = [
      ...(Array.isArray(publicProfileState?.posts) ? publicProfileState.posts : []),
      ...(Array.isArray(user?.posts) ? user.posts : [])
    ].filter((post, index, allPosts) => allPosts.findIndex((item) => String(item.id) === String(post.id)) === index);

    const loadCommentCounts = async () => {
      const entries = await Promise.all(posts.map(async (post) => {
        try {
          const { data } = await fetchComments(post.id);
          return [String(post.id), Array.isArray(data) ? data.length : 0];
        } catch (error) {
          return null;
        }
      }));
      if (isMounted) setCommentCounts(Object.fromEntries(entries.filter(Boolean)));
    };

    if (posts.length > 0) loadCommentCounts();
    return () => { isMounted = false; };
  }, [publicProfileState?.posts, user?.posts]);

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

  if (isPublicProfile && publicProfile) return <PublicProfile profile={publicProfile} />;

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

  const handleSocialChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: getSocialHandleValue(value) }));
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

  const handleCancel = () => {
    const profilePhoto = user?.profile_photo || (user?.email ? localStorage.getItem(`testsite-profile-${user.email.toLowerCase()}`) : null);
    setForm((prev) => ({
      ...prev,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      bio: user?.bio || '',
      facebook: user?.social?.facebook || '',
      twitter: user?.social?.twitter || '',
      instagram: user?.social?.instagram || '',
      linkedin: user?.social?.linkedin || '',
      profilePhoto: profilePhoto || ''
    }));
    setPhotoPreview(profilePhoto || null);
    setIsEditing(false);
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
  const deletedPostIds = getDeletedPostIds();
  const drafts = JSON.parse(localStorage.getItem(draftKey) || '[]')
    .filter((draft) => !deletedPostIds.has(String(draft.id)));
  const publicPosts = Array.isArray(publicProfileState?.posts) ? publicProfileState.posts : [];
  const localPosts = [
    ...(user.posts || []),
    ...(Array.isArray(drafts) ? drafts : [])
  ];
  const posts = [
    ...publicPosts,
    ...localPosts.filter((post) => !publicPosts.some((remotePost) => String(remotePost.id) === String(post.id)))
  ]
    .filter((post) => !deletedPostIds.has(String(post.id)))
    .filter((post, index, allPosts) => allPosts.findIndex((item) => String(item.id) === String(post.id)) === index)
    .sort((left, right) => getPostSortTimestamp(right) - getPostSortTimestamp(left));
  const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage));
  const paginatedPosts = posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  const handleConfirmTrashDelete = () => {
    if (!trashConfirmPostId) return;
    deletePost(trashConfirmPostId);
    setTrashConfirmPostId(null);
  };

  const beginQuickEdit = (post) => {
    const parsedDate = post?.publishedAt ? new Date(post.publishedAt) : new Date(post?.date || Date.now());
    const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    setQuickEditPostId(post.id);
    setQuickEditForm({
      title: post.title || '',
      slug: post.slug || createPostSlug(post.title || ''),
      date: validDate.toISOString().slice(0, 16),
      category: post.category || 'Uncategorized',
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      allowComments: post.allowComments !== false,
      status: post.status || 'published'
    });
  };

  const saveQuickEdit = async (post) => {
    if (!user) return;

    const nextDate = quickEditForm.date ? new Date(quickEditForm.date) : new Date(post?.publishedAt || post?.date || Date.now());
    const normalizedTitle = String(quickEditForm.title || post.title || 'Untitled').trim() || 'Untitled';
    const normalizedSlug = String(quickEditForm.slug || '').trim() || createPostSlug(normalizedTitle) || String(post.id || 'post');
    const normalizedCategory = String(quickEditForm.category || post.category || 'Uncategorized').trim() || 'Uncategorized';
    const nextPost = {
      ...post,
      id: post.id,
      title: normalizedTitle,
      slug: normalizedSlug,
      category: normalizedCategory,
      status: quickEditForm.status || post.status || 'published',
      tags: String(quickEditForm.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      allowComments: quickEditForm.allowComments !== false,
      date: nextDate.toLocaleDateString(),
      publishedAt: nextDate.toISOString(),
      updatedAt: new Date().toISOString()
    };

    const authKey = user.authKey || user.auth_key;
    if (authKey && /^\d+$/.test(String(post.id))) {
      try {
        await updatePostRequest(post.id, {
          authKey,
          title: normalizedTitle,
          content: post.content || '',
          image: post.featuredImage || post.image || '',
          slug: normalizedSlug,
          category: normalizedCategory,
          tags: nextPost.tags,
          status: nextPost.status
        });
      } catch (error) {
        console.warn('Backend quick edit failed; keeping the local update.', error);
      }
    }

    const updatePostsList = (posts) => {
      const safePosts = Array.isArray(posts) ? posts : [];
      const foundMatch = safePosts.some((item) => String(item.id) === String(post.id));
      return foundMatch
        ? safePosts.map((item) => (String(item.id) === String(post.id) ? { ...item, ...nextPost, id: item.id } : item))
        : [nextPost, ...safePosts];
    };

    const globalPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
    const userKey = `testsite-posts-${String(user.email || user.username || 'anonymous').toLowerCase()}`;
    const savedUserPosts = JSON.parse(localStorage.getItem(userKey) || '[]');
    const draftKey = `testsite-drafts-${String(user.email || user.username || 'anonymous').toLowerCase()}`;
    const drafts = JSON.parse(localStorage.getItem(draftKey) || '[]');
    const nextGlobalPosts = updatePostsList(globalPosts);
    const nextUserPosts = updatePostsList(user.posts || []);
    const nextDrafts = updatePostsList(drafts);

    localStorage.setItem('testsite-posts', JSON.stringify(nextGlobalPosts));
    localStorage.setItem(userKey, JSON.stringify(nextUserPosts));
    localStorage.setItem(draftKey, JSON.stringify(nextDrafts));

    updateProfile({ posts: nextUserPosts });
    setQuickEditPostId(null);
  };

  return (
    <>
      <PageHeader title={user?.username || 'My Account'} subtitle="Manage your profile and your published blog posts." />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_759px] xl:gap-8">
          {/* Left Column - Profile Form */}
          <div className="w-full rounded-3xl bg-white p-5 shadow-xl self-start sm:p-8 xl:p-10">
            {!isEditing ? (
              <div className="flex justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1fae58]"
                  type="button"
                  aria-label="Edit profile"
                  title="Edit profile"
                >
                  <i className="fas fa-pen text-base" aria-hidden="true"></i>
                  <span>Edit profile</span>
                </button>
              </div>
            ) : (
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleSave}
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1fae58]"
                >
                  <i className="fas fa-save" aria-hidden="true"></i>
                  <span>Save Profile</span>
                </button>
                <button
                  onClick={handleCancel}
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50"
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                  <span>Cancel</span>
                </button>
              </div>
            )}

            {/* Form Fields - Two Columns */}
            <div className="mt-8">
              <div className="mb-4 flex justify-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={!isEditing}
                    aria-label="Upload profile photo"
                    title={isEditing ? 'Upload profile photo' : 'Enable editing to change profile photo'}
                    className="group flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-500 bg-slate-100 text-left shadow-lg transition-transform duration-200 hover:scale-105 disabled:cursor-default disabled:hover:scale-100"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="h-full w-full object-cover transition duration-200 group-hover:brightness-75" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-slate-400">
                        <i className="fas fa-user text-4xl"></i>
                      </span>
                    )}
                  </button>
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

                {isEditing && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Security</h3>
                  <div className="mt-4 border-t border-slate-300" />

                  {!showPasswordForm && !passwordChangeMessage && (
                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1fae58]"
                      >
                        <i className="fas fa-key" aria-hidden="true"></i>
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#22C55E] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1fae58]"
                      >
                        <i className="fas fa-key" aria-hidden="true"></i>
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
                )}

                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Social links</h3>
                  <div className="mt-4 border-t border-slate-300" />
                  {isEditing ? (
                    <div className="mt-6 space-y-3">
                      {[
                        ['facebook', 'fa-facebook', 'facebook.com/', 'yourprofile'],
                        ['twitter', 'fa-twitter', 'twitter.com/', 'yourhandle'],
                        ['instagram', 'fa-instagram', 'instagram.com/', 'yourprofile'],
                        ['linkedin', 'fa-linkedin', 'linkedin.com/in/', 'yourprofile']
                      ].map(([name, icon, prefix, placeholder]) => (
                        <div key={name} className="flex min-w-0 flex-col gap-2 sm:flex-row">
                          <span className="flex w-full shrink-0 items-center whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 sm:w-36 sm:py-0">
                            <i className={`fab ${icon} mr-2 text-[#22C55E]`} /> {prefix}
                          </span>
                          <input
                            name={name}
                            value={getSocialHandleValue(form[name])}
                            onChange={handleSocialChange}
                            type="text"
                            placeholder={placeholder}
                            className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <ul className="mt-5 space-y-3 text-sm text-slate-700">
                      {[
                        ['facebook', 'fa-facebook', 'facebook.com/'],
                        ['twitter', 'fa-twitter', 'twitter.com/'],
                        ['instagram', 'fa-instagram', 'instagram.com/'],
                        ['linkedin', 'fa-linkedin', 'linkedin.com/in/']
                      ].filter(([name]) => form[name]).map(([name, icon, prefix]) => (
                        <li key={name} className="flex min-w-0 items-center gap-3">
                          <i className={`fab ${icon} w-4 shrink-0 text-[#22C55E]`} aria-hidden="true" />
                          <a href={form[name].startsWith('http') ? form[name] : `https://${prefix}${getSocialHandleValue(form[name])}`} target="_blank" rel="noreferrer" className="min-w-0 break-all hover:text-emerald-600">
                            {prefix}{getSocialHandleValue(form[name])}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-900">Bio</label>
                    <div className="mt-4 border-t border-slate-300" />
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Tell us about yourself..."
                        className="mt-6 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-500 focus:border-[#22C55E] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/20"
                      />
                    ) : (
                      <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-slate-600">{form.bio || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSave}
                  type="button"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1fae58]"
                >
                  <i className="fas fa-save" aria-hidden="true"></i>
                  Save Profile
                </button>
                <button
                  onClick={handleCancel}
                  type="button"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50"
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                  Cancel
                </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Blog Posts */}
          <div className="w-full xl:w-[759px] xl:justify-self-end">
            <div className="mb-8 flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                {photoPreview ? (
                  <img src={photoPreview} alt="Your profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    <i className="fas fa-user" aria-hidden="true"></i>
                  </div>
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-500">Share what you noticed today...</span>
              <Link to="/create-post" className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-[#22C55E] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#1fae58]">
                <i className="fas fa-plus" aria-hidden="true"></i>
                <span>Create post</span>
              </Link>
            </div>
            <div className="space-y-8">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 p-5 text-center text-sm text-slate-600">No posts yet. Create your first blog post.</div>
              ) : (
                paginatedPosts.map((post) => (
                  <article key={post.id} className="group relative overflow-hidden rounded-3xl bg-white shadow-lg">
                    {(post.featuredImage || post.image) && (
                      post.status === 'draft' ? (
                        <img src={post.featuredImage || post.image} alt={post.title} className="h-80 w-full object-cover" />
                      ) : (
                        <Link to={getPostUrl(post)} className="block">
                          <img src={post.featuredImage || post.image} alt={post.title} className="h-80 w-full object-cover transition duration-200 hover:brightness-95" />
                        </Link>
                      )
                    )}
                    <div className="p-8">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-2xl font-semibold text-slate-900">
                          {post.status === 'draft' ? post.title : <Link to={getPostUrl(post)} className="transition hover:text-emerald-600">{post.title}</Link>}
                        </h2>
                        {post.status === 'draft' && <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">Draft</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span><i className="fas fa-user mr-1"></i>{post.status === 'draft' ? (post.author || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Author') : <Link to={getPostAuthorUrl(post, user)} className="hover:text-emerald-600">{post.author || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || 'Author'}</Link>}</span>
                        <span><i className="far fa-calendar mr-1"></i>{post.date}</span>
                        {post.status === 'draft' ? (
                          <span><i className="far fa-comments mr-1"></i>{getCommentCount(post.id, commentCounts)} Comments</span>
                        ) : (
                          <Link to={`${getPostUrl(post)}#comments`} className="hover:text-emerald-600"><i className="far fa-comments mr-1"></i>{getCommentCount(post.id, commentCounts)} Comments</Link>
                        )}
                      </div>
                      <p className="mt-4 line-clamp-2 text-slate-600">{getPostExcerpt(post)}</p>
                      <div className="mt-3 flex items-center gap-1 text-xs opacity-0 select-none transition duration-200 group-hover:opacity-100">
                        <Link to={getEditPostUrl(post)} className="cursor-pointer text-[#22C55E] hover:underline">Edit</Link>
                        <span className="pointer-events-none text-slate-400">|</span>
                        <button type="button" onClick={() => beginQuickEdit(post)} className="cursor-pointer text-[#22C55E] hover:underline">Quick Edit</button>
                        <span className="pointer-events-none text-slate-400">|</span>
                        <button type="button" onClick={() => setTrashConfirmPostId(post.id)} className="cursor-pointer text-[#22C55E] hover:underline">Trash</button>
                        <span className="pointer-events-none text-slate-400">|</span>
                        <Link to={getPostUrl(post)} className="cursor-pointer text-[#22C55E] hover:underline">View</Link>
                      </div>

                      {quickEditPostId === post.id && (
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-3">
                              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                Title
                                <input
                                  type="text"
                                  value={quickEditForm.title || ''}
                                  onChange={(event) => setQuickEditForm((current) => ({ ...current, title: event.target.value }))}
                                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#22C55E]"
                                />
                              </label>
                              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                Slug
                                <input
                                  type="text"
                                  value={quickEditForm.slug || ''}
                                  onChange={(event) => setQuickEditForm((current) => ({ ...current, slug: event.target.value }))}
                                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#22C55E]"
                                />
                              </label>
                              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                Date
                                <input
                                  type="datetime-local"
                                  value={quickEditForm.date || ''}
                                  onChange={(event) => setQuickEditForm((current) => ({ ...current, date: event.target.value }))}
                                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#22C55E]"
                                />
                              </label>
                            </div>

                            <div className="space-y-3">
                              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Categories</span>
                              <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                                {Object.keys(
                                  posts.reduce((grouped, entry) => {
                                    if (entry.category) grouped[entry.category] = true;
                                    return grouped;
                                  }, {})
                                ).map((category) => (
                                  <label key={category} className="flex items-center gap-2 text-sm text-slate-600">
                                    <input
                                      type="radio"
                                      name={`quick-edit-category-${post.id}`}
                                      checked={quickEditForm.category === category}
                                      onChange={() => setQuickEditForm((current) => ({ ...current, category }))}
                                      className="h-4 w-4 accent-[#22C55E]"
                                    />
                                    <span>{category}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                Tags
                                <input
                                  type="text"
                                  value={quickEditForm.tags || ''}
                                  onChange={(event) => setQuickEditForm((current) => ({ ...current, tags: event.target.value }))}
                                  placeholder="tag1, tag2"
                                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#22C55E]"
                                />
                              </label>
                              <label className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={quickEditForm.allowComments !== false}
                                  onChange={(event) => setQuickEditForm((current) => ({ ...current, allowComments: event.target.checked }))}
                                  className="h-4 w-4 accent-[#22C55E]"
                                />
                                Allow Comments
                              </label>
                              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                                Status
                                <select
                                  value={quickEditForm.status || 'published'}
                                  onChange={(event) => setQuickEditForm((current) => ({ ...current, status: event.target.value }))}
                                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#22C55E]"
                                >
                                  <option value="published">Published</option>
                                  <option value="draft">Draft</option>
                                </select>
                              </label>
                            </div>
                          </div>

                          <div className="mt-5 flex justify-end gap-3">
                            <button type="button" onClick={() => setQuickEditPostId(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                              Cancel
                            </button>
                            <button type="button" onClick={() => saveQuickEdit(post)} className="rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1fae58]">
                              Update
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setCurrentPage(number)}
                      className={`h-11 w-11 rounded-full text-sm font-semibold transition ${
                        number === currentPage
                          ? 'bg-[#22C55E] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {trashConfirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Move post to trash?</h3>
            <p className="mt-4 text-slate-600">This post will be deleted and removed from your blog.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setTrashConfirmPostId(null)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmTrashDelete} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700">
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Account;
