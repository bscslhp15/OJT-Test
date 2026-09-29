export const createAccountSlug = (username) => String(username || 'account')
  .replace(/\s+/g, '')
  .toLowerCase();

export const createAuthorSlug = (name) => String(name || 'author')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const getAccountUrl = (user) => `/${createAccountSlug(user?.username || user?.email?.split('@')[0])}`;

export const getProfileUrl = (user) => `${getAccountUrl(user)}?view=profile`;
export const getAuthorUrl = (user) => `/author/${createAuthorSlug([user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.username || user?.email?.split('@')[0])}`;

const isCurrentUserPostAuthor = (post, currentUser) => {
  if (!currentUser) return false;

  const normalize = (value) => String(value || '').trim().toLowerCase();
  const postAuthorId = normalize(post?.authorId || post?.author_id);
  const postUserId = normalize(post?.authorUserId || post?.author_user_id || (postAuthorId.includes('@') ? '' : post?.author_id));
  const currentUserId = normalize(currentUser?.id);
  const currentEmail = normalize(currentUser?.email);
  const currentUsername = normalize(currentUser?.username);
  const currentEmailUsername = currentEmail.split('@')[0];
  const currentFullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim();
  const postAuthorName = String(post?.author || '').trim();
  const currentNameSlug = currentFullName ? createAuthorSlug(currentFullName) : '';
  const postNameSlug = postAuthorName ? createAuthorSlug(postAuthorName) : '';
  const isCurrentUserAuthor = Boolean(currentUser && (
    (currentUserId && postUserId && currentUserId === postUserId) ||
    (currentEmail && postAuthorId === currentEmail) ||
    (currentUsername && (postAuthorId === currentUsername || (currentEmailUsername && postAuthorId === currentEmailUsername))) ||
    (currentNameSlug && postNameSlug && currentNameSlug === postNameSlug)
  ));

  return isCurrentUserAuthor;
};

export const getPostAuthorUrl = (post) => {
  const postAuthorId = String(post?.authorId || post?.author_id || '').trim().toLowerCase();

  if (postAuthorId.includes('@')) {
    let persistedUser = null;
    try {
      persistedUser = JSON.parse(localStorage.getItem(`testsite-user-persist-${postAuthorId}`) || 'null');
    } catch (error) {
      persistedUser = null;
    }
    if (persistedUser) return getAuthorUrl(persistedUser);
    return getAuthorUrl({ name: post?.author || postAuthorId.split('@')[0] });
  }
  return getAuthorUrl({ name: post?.author || postAuthorId || 'author' });
};

export const getPostAuthorClickHandler = (post, currentUser, navigate) => (event) => {
  const opensNewContext = event.button !== 0
    || event.metaKey
    || event.ctrlKey
    || event.shiftKey
    || event.altKey
    || event.currentTarget?.target === '_blank';

  if (!opensNewContext && isCurrentUserPostAuthor(post, currentUser)) {
    event.preventDefault();
    navigate(getAccountUrl(currentUser));
  }
};
