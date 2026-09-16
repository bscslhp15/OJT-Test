export const createPostSlug = (title) => String(title || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

export const getPostUrl = (post) => `/blog/${createPostSlug(post.title) || post.id}`;

export const getEditPostUrl = (post) => `/edit-post/${createPostSlug(post.title) || post.id}`;