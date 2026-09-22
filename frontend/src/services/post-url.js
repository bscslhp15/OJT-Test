export const createPostSlug = (title) => String(title || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const getPostDateParts = (post) => {
  const rawDate = post?.publishedAt || post?.createdAt || post?.date;
  if (!rawDate) return null;

  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return { year, month, day };
};

export const getPostSlug = (post) => {
  const rawSlug = String(post?.slug || '').trim();
  const isLegacyTimestampSlug = /^post-\d+$/i.test(rawSlug);

  if (rawSlug && !isLegacyTimestampSlug) return rawSlug;

  return createPostSlug(post?.title) || String(post?.id || 'post');
};

export const getPostUrl = (post) => {
  const slug = getPostSlug(post);
  const dateParts = getPostDateParts(post);

  if (!dateParts) return `/blog/${slug}`;

  return `/blog/${dateParts.year}/${dateParts.month}/${dateParts.day}/${slug}`;
};

export const getEditPostUrl = (post) => `/edit-post/${getPostSlug(post)}`;