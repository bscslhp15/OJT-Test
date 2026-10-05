const CATEGORY_STORAGE_KEY = 'testsite-categories';

export const createCategorySlug = (name) => String(name || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const getStoredCategories = () => {
  try {
    const categories = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || '[]');
    return Array.isArray(categories) ? categories : [];
  } catch (error) {
    return [];
  }
};

export const saveStoredCategories = (categories) => {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
};

export const upsertStoredCategory = (category) => {
  const categories = getStoredCategories();
  const existingIndex = categories.findIndex((item) => item.id === category.id
    || String(item.name || '').toLowerCase() === String(category.name || '').toLowerCase());
  if (existingIndex === -1) categories.push(category);
  else categories[existingIndex] = { ...categories[existingIndex], ...category };
  saveStoredCategories(categories);
};

export const mergeCategoriesWithPosts = (posts = []) => {
  const categories = getStoredCategories();
  const names = new Set(categories.map((category) => String(category.name || '').toLowerCase()));
  if (!names.has('uncategorized')) {
    categories.push({ id: 'uncategorized', name: 'Uncategorized', slug: 'uncategorized', parent: '', description: '' });
    names.add('uncategorized');
  }

  posts.forEach((post) => {
    String(post.category || 'Uncategorized').split(',').map((name) => name.trim()).filter(Boolean).forEach((name) => {
      if (names.has(name.toLowerCase())) return;
      categories.push({
        id: `legacy-${createCategorySlug(name) || Date.now()}`,
        name,
        slug: createCategorySlug(name),
        parent: '',
        description: ''
      });
      names.add(name.toLowerCase());
    });
  });

  saveStoredCategories(categories);
  return categories;
};