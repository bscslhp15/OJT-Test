import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/auth-context';
import { loadPublicPosts } from '../services/public-data';
import { updatePost as updatePostRequest } from '../services/api';
import {
  createCategorySlug,
  mergeCategoriesWithPosts,
  saveStoredCategories
} from '../services/categories';

const emptyForm = { name: '', slug: '', parent: '', description: '' };

const splitCategoryNames = (value) => String(value || 'Uncategorized')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);

const BulkActions = ({ id, value, onChange, onApply }) => (
  <div className="flex items-center gap-2">
    <label className="sr-only" htmlFor={id}>Bulk actions</label>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 min-w-32 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm text-[#1E1E1E] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]">
      <option value="">Bulk actions</option>
      <option value="delete">Delete</option>
    </select>
    <button type="button" onClick={onApply} className="h-9 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Apply</button>
  </div>
);

const AdminCategories = () => {
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [quickEditId, setQuickEditId] = useState(null);
  const [quickEditForm, setQuickEditForm] = useState({ name: '', slug: '' });
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    loadPublicPosts().then((loadedPosts) => {
      if (!isMounted) return;
      const safePosts = Array.isArray(loadedPosts) ? loadedPosts : [];
      setPosts(safePosts);
      setCategories(mergeCategoriesWithPosts(safePosts));
      setLoading(false);
    }).catch(() => {
      if (!isMounted) return;
      setCategories(mergeCategoriesWithPosts([]));
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const visibleCategories = useMemo(() => categories
    .filter((category) => `${category.name} ${category.slug} ${category.description}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name)), [categories, searchQuery]);
  const selectedVisible = visibleCategories.length > 0 && visibleCategories.every((category) => selectedIds.includes(category.id));

  const getCount = (categoryName) => posts.filter((post) => splitCategoryNames(post.category)
    .some((name) => name.toLowerCase() === categoryName.toLowerCase())).length;

  const updatePostCategories = async (renameMap, deletedNames = []) => {
    const deleted = new Set(deletedNames.map((name) => name.toLowerCase()));
    const authKey = user?.authKey || user?.auth_key;
    const nextPosts = [];
    let failedUpdates = 0;

    for (const post of posts) {
      const originalNames = splitCategoryNames(post.category);
      const hasChanged = originalNames.some((name) => renameMap.has(name) || deleted.has(name.toLowerCase()));
      if (!hasChanged) {
        nextPosts.push(post);
        continue;
      }

      const nextNames = [...new Set(originalNames
        .filter((name) => !deleted.has(name.toLowerCase()))
        .map((name) => renameMap.get(name) || name))];
      if (!nextNames.length) nextNames.push('Uncategorized');
      const nextPost = { ...post, category: nextNames.join(', ') };

      if (/^\d+$/.test(String(post.id))) {
        if (!authKey) {
          failedUpdates += 1;
          nextPosts.push(post);
          continue;
        }
        try {
          await updatePostRequest(post.id, { authKey, category: nextPost.category });
        } catch (updateError) {
          failedUpdates += 1;
          nextPosts.push(post);
          continue;
        }
      }
      nextPosts.push(nextPost);
    }

    setPosts(nextPosts);
    try {
      localStorage.setItem('testsite-posts', JSON.stringify(nextPosts));
    } catch (storageError) {
      setError('Category changes could not be saved to local storage.');
    }

    if (failedUpdates) {
      setError(`${failedUpdates} post${failedUpdates === 1 ? '' : 's'} could not be updated. Their categories were left unchanged.`);
    }
    return failedUpdates;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const beginEdit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name, slug: category.slug, parent: category.parent || '', description: category.description || '' });
    setError('');
    setNotice('');
  };

  const beginQuickEdit = (category) => {
    setQuickEditId(category.id);
    setQuickEditForm({ name: category.name, slug: category.slug });
    setError('');
    setNotice('');
  };

  const saveQuickEdit = async (event) => {
    event.preventDefault();
    const previous = categories.find((category) => category.id === quickEditId);
    const name = quickEditForm.name.trim();
    const slug = quickEditForm.slug.trim() || createCategorySlug(name);
    if (!previous || !name || !slug) {
      setError('Enter a category name and slug.');
      return;
    }
    const duplicate = categories.some((category) => category.id !== quickEditId
      && (category.name.toLowerCase() === name.toLowerCase() || category.slug.toLowerCase() === slug.toLowerCase()));
    if (duplicate) {
      setError('A category with that name or slug already exists.');
      return;
    }
    if (quickEditId === 'uncategorized' && name !== 'Uncategorized') {
      setError('The default category cannot be renamed.');
      return;
    }

    const updatedCategory = { ...previous, name, slug };
    const nextCategories = categories.map((category) => category.id === quickEditId ? updatedCategory : category);
    try {
      saveStoredCategories(nextCategories);
      setCategories(nextCategories);
      const failedUpdates = previous.name !== name
        ? await updatePostCategories(new Map([[previous.name, name]]))
        : 0;
      setNotice('Category updated.');
      setError(failedUpdates ? `${failedUpdates} post${failedUpdates === 1 ? '' : 's'} could not be updated. Their categories were left unchanged.` : '');
      setQuickEditId(null);
    } catch (saveError) {
      setError('Could not save this category. Please try again.');
    }
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const slug = form.slug.trim() || createCategorySlug(name);
    if (!name || !slug) {
      setError('Enter a category name and slug.');
      return;
    }
    const duplicate = categories.some((category) => category.id !== editingId
      && (category.name.toLowerCase() === name.toLowerCase() || category.slug.toLowerCase() === slug.toLowerCase()));
    if (duplicate) {
      setError('A category with that name or slug already exists.');
      return;
    }
    if (editingId === 'uncategorized' && name !== 'Uncategorized') {
      setError('The default category cannot be renamed.');
      return;
    }

    const previous = categories.find((category) => category.id === editingId);
    const savedCategory = {
      id: editingId || `category-${Date.now()}`,
      name,
      slug,
      parent: form.parent,
      description: form.description.trim()
    };
    const nextCategories = previous
      ? categories.map((category) => category.id === editingId ? savedCategory : category)
      : [...categories, savedCategory];

    try {
      saveStoredCategories(nextCategories);
      setCategories(nextCategories);
      const failedUpdates = previous && previous.name !== name
        ? await updatePostCategories(new Map([[previous.name, name]]))
        : 0;
      setNotice(previous ? 'Category updated.' : 'Category added.');
      setError(failedUpdates ? `${failedUpdates} post${failedUpdates === 1 ? '' : 's'} could not be updated. Their categories were left unchanged.` : '');
      resetForm();
    } catch (saveError) {
      setError('Could not save this category. Please try again.');
    }
  };

  const deleteCategories = async (ids) => {
    const targets = categories.filter((category) => ids.includes(category.id) && category.id !== 'uncategorized');
    if (!targets.length) {
      setError('The default category cannot be deleted.');
      return;
    }
    const names = targets.map((category) => category.name);
    if (!window.confirm(`Delete ${targets.length === 1 ? `"${names[0]}"` : `${targets.length} selected categories`}? Posts in these categories will be moved to Uncategorized.`)) return;

    const nextCategories = categories.filter((category) => !ids.includes(category.id) || category.id === 'uncategorized');
    try {
      saveStoredCategories(nextCategories);
      setCategories(nextCategories);
      const failedUpdates = await updatePostCategories(new Map(), names);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      setNotice(failedUpdates
        ? 'Category deleted. Some posts could not be moved to Uncategorized.'
        : 'Category deleted. Posts were moved to Uncategorized.');
      setError(failedUpdates ? `${failedUpdates} post${failedUpdates === 1 ? '' : 's'} could not be updated. Their categories were left unchanged.` : '');
      if (ids.includes(editingId)) resetForm();
    } catch (deleteError) {
      setError('Could not delete the selected categories. Please try again.');
    }
  };

  const applyBulkAction = () => {
    if (bulkAction !== 'delete') {
      setError('Choose a bulk action first.');
      return;
    }
    deleteCategories(selectedIds);
  };

  const renderBulkActions = (id) => (
    <BulkActions id={id} value={bulkAction} onChange={setBulkAction} onApply={applyBulkAction} />
  );

  return (
    <main className="min-h-full bg-[#F7FAF7] px-4 py-6 text-[#1E1E1E] md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-normal">Categories</h1>
        <form onSubmit={(event) => { event.preventDefault(); setSearchQuery(searchInput.trim()); }} className="flex gap-2">
          <label htmlFor="category-search" className="sr-only">Search categories</label>
          <input id="category-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-9 w-44 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
          <button type="submit" className="h-9 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Search Categories</button>
        </form>
      </div>

      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-4 rounded-xl border-l-4 bg-white px-3 py-2 text-sm ${error ? 'border-red-600 text-red-700' : 'border-[#22C55E] text-[#176B34]'}`}>{error || notice}</div>}

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(270px,0.9fr)_minmax(0,1.7fr)]">
        <form onSubmit={saveCategory} className="space-y-4">
          <h2 className="text-sm font-semibold">{editingId ? 'Edit Category' : 'Add Category'}</h2>
          <label className="block text-sm">
            <span className="mb-1 block">Name</span>
            <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug === createCategorySlug(current.name) || !current.slug ? createCategorySlug(event.target.value) : current.slug }))} className="h-10 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
            <span className="mt-1 block text-xs leading-5 text-[#69736A]">The name is how it appears on your site.</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Slug</span>
            <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: createCategorySlug(event.target.value) }))} className="h-10 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
            <span className="mt-1 block text-xs leading-5 text-[#69736A]">The “slug” is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens.</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Description</span>
            <textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-[#B8C0B8] bg-white p-2 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
            <span className="mt-1 block text-xs leading-5 text-[#69736A]">The description is not prominent by default; however, some themes may show it.</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="h-10 rounded-xl bg-[#16803C] px-4 text-sm font-semibold text-white hover:bg-[#12652F]">{editingId ? 'Update Category' : 'Add Category'}</button>
            {editingId && <button type="button" onClick={resetForm} className="h-10 rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm hover:bg-[#EFF4EF]">Cancel</button>}
          </div>
        </form>

        <section aria-label="Category list" className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            {renderBulkActions('category-bulk-action-top')}
            <span className="text-xs text-[#69736A]">{visibleCategories.length} {visibleCategories.length === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#C8D0C8] bg-white">
            <table className="w-full min-w-[610px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#C8D0C8] text-[#384238]">
                  <th className="w-10 px-3 py-2"><input type="checkbox" aria-label="Select all visible categories" checked={selectedVisible} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, ...visibleCategories.map((category) => category.id)])] : current.filter((id) => !visibleCategories.some((category) => category.id === id)))} /></th>
                  <th className="px-3 py-3 font-medium">Name <span className="text-[#899389]">▲</span></th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="w-20 px-3 py-3 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-3 py-8 text-center text-[#69736A]">Loading categories...</td></tr>
                  : visibleCategories.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-[#69736A]">No categories found.</td></tr>
                    : visibleCategories.map((category, index) => quickEditId === category.id ? (
                      <tr key={category.id} className="border-b border-[#DCE5DC] bg-[#F7FAF7]">
                        <td colSpan={5} className="px-4 py-3">
                          <form onSubmit={saveQuickEdit} className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-x-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#526052] sm:col-span-2">Quick Edit</h3>
                            <label htmlFor={`quick-edit-name-${category.id}`} className="text-sm text-[#526052]">Name</label>
                            <input id={`quick-edit-name-${category.id}`} required value={quickEditForm.name} onChange={(event) => setQuickEditForm((current) => ({ ...current, name: event.target.value, slug: current.slug === createCategorySlug(current.name) || !current.slug ? createCategorySlug(event.target.value) : current.slug }))} className="h-9 min-w-0 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                            <label htmlFor={`quick-edit-slug-${category.id}`} className="text-sm text-[#526052]">Slug</label>
                            <input id={`quick-edit-slug-${category.id}`} value={quickEditForm.slug} onChange={(event) => setQuickEditForm((current) => ({ ...current, slug: createCategorySlug(event.target.value) }))} className="h-9 min-w-0 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                            <span aria-hidden="true" />
                            <div className="flex gap-2">
                              <button type="submit" className="h-9 rounded-xl bg-[#16803C] px-4 text-sm font-semibold text-white hover:bg-[#12652F]">Update Category</button>
                              <button type="button" onClick={() => setQuickEditId(null)} className="h-9 rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm hover:bg-[#EFF4EF]">Cancel</button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={category.id} className={`group border-b border-[#DCE5DC] ${index % 2 ? 'bg-[#F7FAF7]' : 'bg-white'} hover:bg-[#F0F8F0]`}>
                        <td className="px-3 py-3 align-top"><input type="checkbox" aria-label={`Select ${category.name}`} checked={selectedIds.includes(category.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, category.id] : current.filter((id) => id !== category.id))} /></td>
                        <td className="px-3 py-3 align-top">
                          <Link to={`/blog/category/${category.slug}`} className="font-semibold text-[#2271B1] hover:text-[#16803C]">{category.parent ? <span className="text-[#69736A]">— </span> : null}{category.name}</Link>
                          <div className="mt-1 flex flex-wrap gap-1 text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <button type="button" onClick={() => beginEdit(category)} className="text-[#16803C] hover:underline">Edit</button><span className="text-[#899389]">|</span>
                            <button type="button" onClick={() => beginQuickEdit(category)} className="text-[#16803C] hover:underline">Quick Edit</button><span className="text-[#899389]">|</span>
                            {category.id === 'uncategorized' ? <span className="text-[#69736A]">Delete</span> : <button type="button" onClick={() => deleteCategories([category.id])} className="text-red-600 hover:underline">Delete</button>}<span className="text-[#899389]">|</span>
                            <a href={`/blog/category/${category.slug}`} target="_blank" rel="noreferrer" className="text-[#16803C] hover:underline">View</a>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-[#526052]">{category.description || '—'}</td>
                        <td className="px-3 py-3 align-top text-[#526052]">{category.slug}</td>
                        <td className="px-3 py-3 text-right align-top"><Link to={`/blog/category/${category.slug}`} className="text-[#2271B1] hover:text-[#16803C] hover:underline">{getCount(category.name)}</Link></td>
                      </tr>
                    ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#C8D0C8] text-[#384238]">
                  <th className="px-3 py-2"><input type="checkbox" aria-label="Select all visible categories" checked={selectedVisible} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, ...visibleCategories.map((category) => category.id)])] : current.filter((id) => !visibleCategories.some((category) => category.id === id)))} /></th>
                  <th className="px-3 py-3 font-medium">Name <span className="text-[#899389]">▲</span></th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="px-3 py-3 text-right font-medium">Count</th>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            {renderBulkActions('category-bulk-action-bottom')}
            <span className="text-xs text-[#69736A]">{visibleCategories.length} {visibleCategories.length === 1 ? 'item' : 'items'}</span>
          </div>
          <p className="mt-6 text-xs leading-5 text-[#526052]">Deleting a category does not delete its posts. Posts assigned to a deleted category are moved to Uncategorized.</p>
        </section>
      </div>
    </main>
  );
};

export default AdminCategories;