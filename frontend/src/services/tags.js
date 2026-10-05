const TAG_STORAGE_KEY = 'testsite-tags';

export const createTagSlug = (name) => String(name || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const getStoredTags = () => {
  try {
    const tags = JSON.parse(localStorage.getItem(TAG_STORAGE_KEY) || '[]');
    return Array.isArray(tags) ? tags : [];
  } catch (error) {
    return [];
  }
};

export const saveStoredTags = (tags) => {
  localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(tags));
};

export const upsertStoredTag = (tag) => {
  const tags = getStoredTags();
  const existingIndex = tags.findIndex((item) => item.id === tag.id
    || String(item.name || '').toLowerCase() === String(tag.name || '').toLowerCase());
  if (existingIndex === -1) tags.push(tag);
  else tags[existingIndex] = { ...tags[existingIndex], ...tag };
  saveStoredTags(tags);
};

export const mergeTagsWithPosts = (posts = []) => {
  const tags = getStoredTags();
  const names = new Set(tags.map((tag) => String(tag.name || '').toLowerCase()));
  posts.forEach((post) => {
    const postTags = Array.isArray(post.tags)
      ? post.tags
      : String(post.tags || '').split(',');
    postTags.map((tag) => String(tag).trim()).filter(Boolean).forEach((name) => {
      if (names.has(name.toLowerCase())) return;
      tags.push({
        id: `legacy-${createTagSlug(name) || Date.now()}`,
        name,
        slug: createTagSlug(name),
        description: ''
      });
      names.add(name.toLowerCase());
    });
  });

  saveStoredTags(tags);
  return tags;
};