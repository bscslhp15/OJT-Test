import { fetchPost, fetchPosts, fetchProfileBySlug } from './api';

const legacyCategories = new Set(['General', 'Design', 'Development', 'Branding', 'Marketing']);

export const normalizeCategory = (category) => {
  const value = String(category || '').trim();
  return legacyCategories.has(value) ? 'Uncategorized' : value || 'Uncategorized';
};

const flattenContentBlocks = (blocks) => blocks.flatMap((block) => {
  const text = block?.data?.text || '';
  try {
    const nested = JSON.parse(text);
    if (nested && Array.isArray(nested.blocks)) return flattenContentBlocks(nested.blocks);
  } catch (error) {
    // The block contains regular HTML.
  }
  return [block];
});

const normalizePostContent = (content) => {
  if (typeof content !== 'string') return content || '';
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.blocks)) {
      return JSON.stringify({ ...parsed, blocks: flattenContentBlocks(parsed.blocks) });
    }
  } catch (error) {
    // Keep legacy HTML content unchanged.
  }
  return content;
};

export const normalizePublicPost = (post = {}) => {
  const createdAt = post.publishedAt || post.created_at || post.createdAt || post.date || new Date().toISOString();
  const normalizedDate = new Date(createdAt);
  const safeDate = Number.isNaN(normalizedDate.getTime()) ? new Date() : normalizedDate;
  const title = post.title || 'Untitled';
  const authorIdValue = post.authorId ?? post.author_id ?? '';

  return {
    ...post,
    id: post.id,
    title,
    slug: post.slug || String(title).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled',
    content: normalizePostContent(post.content || ''),
    date: post.date || safeDate.toLocaleDateString(),
    createdAt: post.createdAt || createdAt,
    publishedAt: post.publishedAt || createdAt,
    category: normalizeCategory(post.category),
    tags: Array.isArray(post.tags) ? post.tags : [],
    status: post.status || 'published',
    allowComments: post.allowComments !== false && post.allow_comments !== false,
    image: post.image || post.featuredImage || '',
    featuredImage: post.featuredImage || post.image || '',
    author: post.author || 'Author',
    authorId: authorIdValue === null || authorIdValue === undefined ? '' : String(authorIdValue),
    authorUserId: post.authorUserId ?? post.author_user_id ?? post.author_id ?? '',
    authorAvatar: post.authorAvatar || post.author_photo || post.profile_photo || '',
    authorBio: post.authorBio || '',
    authorSocial: post.authorSocial || {},
  };
};

export const getLegacyPosts = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
    return Array.isArray(stored) ? stored.map(normalizePublicPost) : [];
  } catch (error) {
    return [];
  }
};

export const getLegacyProfile = (slug) => {
  if (!slug) return null;

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith('testsite-user-persist-')) continue;
      const persistedUser = JSON.parse(localStorage.getItem(key) || 'null');
      const persistedSlug = String(persistedUser?.username || persistedUser?.email?.split('@')[0] || '').toLowerCase().replace(/\s+/g, '');
      if (persistedSlug === String(slug).toLowerCase().replace(/\s+/g, '')) {
        return { ...persistedUser, posts: Array.isArray(persistedUser?.posts) ? persistedUser.posts.map(normalizePublicPost) : [] };
      }
    }
    const posts = getLegacyPosts();
    const sourcePost = posts.find((post) => String(post.authorId || '').toLowerCase() === String(slug).toLowerCase() || String(post.author || '').toLowerCase() === String(slug).toLowerCase());
    if (!sourcePost) return null;
    return {
      username: slug,
      firstName: '',
      lastName: '',
      email: sourcePost.authorId || '',
      profile_photo: sourcePost.authorAvatar || '',
      social: sourcePost.authorSocial || {},
      bio: sourcePost.authorBio || '',
      posts: posts.filter((post) => post.authorId === sourcePost.authorId || post.author === sourcePost.author),
    };
  } catch (error) {
    return null;
  }
};

export const loadPublicPosts = async () => {
  try {
    const { data } = await fetchPosts();
    const list = Array.isArray(data) ? data : (Array.isArray(data?.posts) ? data.posts : []);
    const remotePosts = list.map(normalizePublicPost);
    const localPosts = getLegacyPosts();
    const remoteIds = new Set(remotePosts.map((post) => String(post.id)));
    return [...remotePosts, ...localPosts.filter((post) => !remoteIds.has(String(post.id)))];
  } catch (error) {
    return getLegacyPosts();
  }
};

export const loadPublicPost = async (id) => {
  try {
    const { data } = await fetchPost(id);
    return normalizePublicPost(data || {});
  } catch (error) {
    const matches = getLegacyPosts().filter((post) => String(post.id) === String(id));
    return matches[0] || null;
  }
};

export const loadPublicProfile = async (slug) => {
  if (!slug) return null;

  try {
    const { data } = await fetchProfileBySlug(slug);
    if (!data?.user) return getLegacyProfile(slug);
    const profile = data.user || {};
    const posts = Array.isArray(data.posts) ? data.posts.map(normalizePublicPost) : [];
    return {
      ...profile,
      profile_photo: profile.profile_photo || '',
      bio: profile.bio || '',
      social: profile.social || {},
      posts,
    };
  } catch (error) {
    return getLegacyProfile(slug);
  }
};
