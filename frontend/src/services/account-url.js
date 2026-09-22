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

export const getPostAuthorUrl = (post) => {
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const postAuthorId = normalize(post?.authorId);

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
  return getAuthorUrl({ name: post?.author || 'author' });
};
