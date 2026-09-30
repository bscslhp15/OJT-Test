export const isPostVisible = (post) => {
  if (post?.status === 'trash' || String(post?.status || '').startsWith('trash:')) return false;
  if (post?.status !== 'scheduled') return post?.status !== 'draft';
  const publishTime = Date.parse(post.publishAt || '');
  return Number.isFinite(publishTime) && publishTime <= Date.now();
};
