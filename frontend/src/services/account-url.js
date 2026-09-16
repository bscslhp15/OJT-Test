export const createAccountSlug = (username) => String(username || 'account')
  .replace(/\s+/g, '')
  .toLowerCase();

export const getAccountUrl = (user) => `/${createAccountSlug(user?.username || user?.email?.split('@')[0])}`;

export const getProfileUrl = (user) => `${getAccountUrl(user)}?view=profile`;

export const getPostAuthorUrl = (post) => {
  if (post?.authorId?.includes('@')) {
    let persistedUser = null;
    try {
      persistedUser = JSON.parse(localStorage.getItem(`testsite-user-persist-${post.authorId.toLowerCase()}`) || 'null');
    } catch (error) {
      persistedUser = null;
    }
    if (persistedUser) return getProfileUrl(persistedUser);
    return getProfileUrl({ email: post.authorId });
  }
  return getProfileUrl({ username: post?.author || 'author' });
};
