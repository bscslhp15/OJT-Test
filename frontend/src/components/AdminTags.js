import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/auth-context';
import { updatePost as updatePostRequest } from '../services/api';
import { loadPublicPosts } from '../services/public-data';
import { createTagSlug, mergeTagsWithPosts, saveStoredTags } from '../services/tags';

const emptyForm = { name: '', slug: '', description: '' };

const getPostTags = (post) => (Array.isArray(post.tags) ? post.tags : String(post.tags || '').split(','))
  .map((tag) => String(tag).trim())
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

const AdminTags = () => {
  const { user } = useContext(AuthContext);
  const [tags, setTags] = useState([]);
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
      setTags(mergeTagsWithPosts(safePosts));
      setLoading(false);
    }).catch(() => {
      if (!isMounted) return;
      setTags(mergeTagsWithPosts([]));
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const visibleTags = useMemo(() => tags
    .filter((tag) => `${tag.name} ${tag.slug} ${tag.description}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((left, right) => left.name.localeCompare(right.name)), [tags, searchQuery]);
  const selectedVisible = visibleTags.length > 0 && visibleTags.every((tag) => selectedIds.includes(tag.id));
  const getCount = (tagName) => posts.filter((post) => getPostTags(post)
    .some((tag) => tag.toLowerCase() === tagName.toLowerCase())).length;

  const updatePostTags = async (renameMap, deletedNames = []) => {
    const deleted = new Set(deletedNames.map((name) => name.toLowerCase()));
    const authKey = user?.authKey || user?.auth_key;
    const nextPosts = [];
    let failedUpdates = 0;

    for (const post of posts) {
      const originalTags = getPostTags(post);
      const hasChanged = originalTags.some((tag) => renameMap.has(tag) || deleted.has(tag.toLowerCase()));
      if (!hasChanged) {
        nextPosts.push(post);
        continue;
      }

      const nextTags = [...new Set(originalTags
        .filter((tag) => !deleted.has(tag.toLowerCase()))
        .map((tag) => renameMap.get(tag) || tag))];
      const nextPost = { ...post, tags: nextTags };

      if (/^\d+$/.test(String(post.id))) {
        if (!authKey) {
          failedUpdates += 1;
          nextPosts.push(post);
          continue;
        }
        try {
          await updatePostRequest(post.id, { authKey, tags: nextTags });
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
      setError('Tag changes could not be saved to local storage.');
    }
    return failedUpdates;
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const beginEdit = (tag) => {
    setEditingId(tag.id);
    setForm({ name: tag.name, slug: tag.slug, description: tag.description || '' });
    setError('');
    setNotice('');
  };

  const beginQuickEdit = (tag) => {
    setQuickEditId(tag.id);
    setQuickEditForm({ name: tag.name, slug: tag.slug });
    setError('');
    setNotice('');
  };

  const saveTag = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const slug = form.slug.trim() || createTagSlug(name);
    if (!name || !slug) {
      setError('Enter a tag name and slug.');
      return;
    }
    const duplicate = tags.some((tag) => tag.id !== editingId
      && (tag.name.toLowerCase() === name.toLowerCase() || tag.slug.toLowerCase() === slug.toLowerCase()));
    if (duplicate) {
      setError('A tag with that name or slug already exists.');
      return;
    }

    const previous = tags.find((tag) => tag.id === editingId);
    const savedTag = { id: editingId || `tag-${Date.now()}`, name, slug, description: form.description.trim() };
    const nextTags = previous ? tags.map((tag) => tag.id === editingId ? savedTag : tag) : [...tags, savedTag];
    try {
      saveStoredTags(nextTags);
      setTags(nextTags);
      const failedUpdates = previous && previous.name !== name
        ? await updatePostTags(new Map([[previous.name, name]]))
        : 0;
      setNotice(previous ? 'Tag updated.' : 'Tag added.');
      setError(failedUpdates ? `${failedUpdates} post${failedUpdates === 1 ? '' : 's'} could not be updated. Their tags were left unchanged.` : '');
      resetForm();
    } catch (saveError) {
      setError('Could not save this tag. Please try again.');
    }
  };

  const saveQuickEdit = async (event) => {
    event.preventDefault();
    const previous = tags.find((tag) => tag.id === quickEditId);
    const name = quickEditForm.name.trim();
    const slug = quickEditForm.slug.trim() || createTagSlug(name);
    if (!previous || !name || !slug) {
      setError('Enter a tag name and slug.');
      return;
    }
    const duplicate = tags.some((tag) => tag.id !== quickEditId
      && (tag.name.toLowerCase() === name.toLowerCase() || tag.slug.toLowerCase() === slug.toLowerCase()));
    if (duplicate) {
      setError('A tag with that name or slug already exists.');
      return;
    }

    const updatedTag = { ...previous, name, slug };
    const nextTags = tags.map((tag) => tag.id === quickEditId ? updatedTag : tag);
    try {
      saveStoredTags(nextTags);
      setTags(nextTags);
      const failedUpdates = previous.name !== name
        ? await updatePostTags(new Map([[previous.name, name]]))
        : 0;
      setNotice('Tag updated.');
      setError(failedUpdates ? `${failedUpdates} post${failedUpdates === 1 ? '' : 's'} could not be updated. Their tags were left unchanged.` : '');
      setQuickEditId(null);
    } catch (saveError) {
      setError('Could not save this tag. Please try again.');
    }
  };

  const deleteTags = async (ids) => {
    const targets = tags.filter((tag) => ids.includes(tag.id));
    if (!targets.length) {
      setError('Select at least one tag first.');
      return;
    }
    const names = targets.map((tag) => tag.name);
    if (!window.confirm(`Delete ${targets.length === 1 ? `"${names[0]}"` : `${targets.length} selected tags`}?`)) return;

    const nextTags = tags.filter((tag) => !ids.includes(tag.id));
    try {
      saveStoredTags(nextTags);
      setTags(nextTags);
      const failedUpdates = await updatePostTags(new Map(), names);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      setNotice(failedUpdates ? 'Tag deleted. Some posts could not be updated.' : 'Tag deleted.');
      setError(failedUpdates ? `${failedUpdates} post${failedUpdates === 1 ? '' : 's'} could not be updated. Their tags were left unchanged.` : '');
      if (ids.includes(editingId)) resetForm();
      if (ids.includes(quickEditId)) setQuickEditId(null);
    } catch (deleteError) {
      setError('Could not delete the selected tags. Please try again.');
    }
  };

  const applyBulkAction = () => {
    if (bulkAction !== 'delete') {
      setError('Choose a bulk action first.');
      return;
    }
    deleteTags(selectedIds);
  };

  const renderBulkActions = (id) => (
    <BulkActions id={id} value={bulkAction} onChange={setBulkAction} onApply={applyBulkAction} />
  );

  return (
    <main className="min-h-full bg-[#F7FAF7] px-4 py-6 text-[#1E1E1E] md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-normal">Tags</h1>
        <form onSubmit={(event) => { event.preventDefault(); setSearchQuery(searchInput.trim()); }} className="flex gap-2">
          <label htmlFor="tag-search" className="sr-only">Search tags</label>
          <input id="tag-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-9 w-44 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
          <button type="submit" className="h-9 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Search Tags</button>
        </form>
      </div>

      {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-4 rounded-xl border-l-4 bg-white px-3 py-2 text-sm ${error ? 'border-red-600 text-red-700' : 'border-[#22C55E] text-[#176B34]'}`}>{error || notice}</div>}

      <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(270px,0.9fr)_minmax(0,1.7fr)]">
        <form onSubmit={saveTag} className="space-y-4">
          <h2 className="text-sm font-semibold">{editingId ? 'Edit Tag' : 'Add Tag'}</h2>
          <label className="block text-sm">
            <span className="mb-1 block">Name</span>
            <input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value, slug: current.slug === createTagSlug(current.name) || !current.slug ? createTagSlug(event.target.value) : current.slug }))} className="h-10 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
            <span className="mt-1 block text-xs leading-5 text-[#69736A]">The name is how it appears on your site.</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Slug</span>
            <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: createTagSlug(event.target.value) }))} className="h-10 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
            <span className="mt-1 block text-xs leading-5 text-[#69736A]">The slug is the URL-friendly version of the name, usually lowercase with words separated by hyphens.</span>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Description</span>
            <textarea rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-[#B8C0B8] bg-white p-2 focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
            <span className="mt-1 block text-xs leading-5 text-[#69736A]">The description is optional and may be shown by some themes.</span>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="h-10 rounded-xl bg-[#16803C] px-4 text-sm font-semibold text-white hover:bg-[#12652F]">{editingId ? 'Update Tag' : 'Add Tag'}</button>
            {editingId && <button type="button" onClick={resetForm} className="h-10 rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm hover:bg-[#EFF4EF]">Cancel</button>}
          </div>
        </form>

        <section aria-label="Tag list" className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            {renderBulkActions('tag-bulk-action-top')}
            <span className="text-xs text-[#69736A]">{visibleTags.length} {visibleTags.length === 1 ? 'item' : 'items'}</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-[#C8D0C8] bg-white">
            <table className="w-full min-w-[580px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#C8D0C8] text-[#384238]">
                  <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Select all visible tags" checked={selectedVisible} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, ...visibleTags.map((tag) => tag.id)])] : current.filter((id) => !visibleTags.some((tag) => tag.id === id)))} /></th>
                  <th className="px-3 py-3 font-medium">Name <span className="text-[#899389]">▲</span></th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="w-20 px-3 py-3 text-right font-medium">Count</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="px-3 py-8 text-center text-[#69736A]">Loading tags...</td></tr>
                  : visibleTags.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-[#69736A]">No tags found.</td></tr>
                    : visibleTags.map((tag, index) => quickEditId === tag.id ? (
                      <tr key={tag.id} className="border-b border-[#DCE5DC] bg-[#F7FAF7]">
                        <td colSpan={5} className="px-4 py-3">
                          <form onSubmit={saveQuickEdit} className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-x-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#526052] sm:col-span-2">Quick Edit</h3>
                            <label htmlFor={`quick-edit-name-${tag.id}`} className="text-sm text-[#526052]">Name</label>
                            <input id={`quick-edit-name-${tag.id}`} required value={quickEditForm.name} onChange={(event) => setQuickEditForm((current) => ({ ...current, name: event.target.value, slug: current.slug === createTagSlug(current.name) || !current.slug ? createTagSlug(event.target.value) : current.slug }))} className="h-9 min-w-0 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                            <label htmlFor={`quick-edit-slug-${tag.id}`} className="text-sm text-[#526052]">Slug</label>
                            <input id={`quick-edit-slug-${tag.id}`} value={quickEditForm.slug} onChange={(event) => setQuickEditForm((current) => ({ ...current, slug: createTagSlug(event.target.value) }))} className="h-9 min-w-0 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                            <span aria-hidden="true" />
                            <div className="flex gap-2">
                              <button type="submit" className="h-9 rounded-xl bg-[#16803C] px-4 text-sm font-semibold text-white hover:bg-[#12652F]">Update Tag</button>
                              <button type="button" onClick={() => setQuickEditId(null)} className="h-9 rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm hover:bg-[#EFF4EF]">Cancel</button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    ) : (
                      <tr key={tag.id} className={`group border-b border-[#DCE5DC] ${index % 2 ? 'bg-[#F7FAF7]' : 'bg-white'} hover:bg-[#F0F8F0]`}>
                        <td className="px-3 py-3 align-top"><input type="checkbox" aria-label={`Select ${tag.name}`} checked={selectedIds.includes(tag.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, tag.id] : current.filter((id) => id !== tag.id))} /></td>
                        <td className="px-3 py-3 align-top">
                          <Link to={`/blog/tag/${tag.slug}`} className="font-semibold text-[#2271B1] hover:text-[#16803C]">{tag.name}</Link>
                          <div className="mt-1 flex flex-wrap gap-1 text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <button type="button" onClick={() => beginEdit(tag)} className="text-[#16803C] hover:underline">Edit</button><span className="text-[#899389]">|</span>
                            <button type="button" onClick={() => beginQuickEdit(tag)} className="text-[#16803C] hover:underline">Quick Edit</button><span className="text-[#899389]">|</span>
                            <button type="button" onClick={() => deleteTags([tag.id])} className="text-red-600 hover:underline">Delete</button><span className="text-[#899389]">|</span>
                            <a href={`/blog/tag/${tag.slug}`} target="_blank" rel="noreferrer" className="text-[#16803C] hover:underline">View</a>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top text-[#526052]">{tag.description || '—'}</td>
                        <td className="px-3 py-3 align-top text-[#526052]">{tag.slug}</td>
                        <td className="px-3 py-3 text-right align-top"><Link to={`/blog/tag/${tag.slug}`} className="text-[#2271B1] hover:text-[#16803C] hover:underline">{getCount(tag.name)}</Link></td>
                      </tr>
                    ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#C8D0C8] text-[#384238]">
                  <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Select all visible tags" checked={selectedVisible} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, ...visibleTags.map((tag) => tag.id)])] : current.filter((id) => !visibleTags.some((tag) => tag.id === id)))} /></th>
                  <th className="px-3 py-3 font-medium">Name <span className="text-[#899389]">▲</span></th>
                  <th className="px-3 py-3 font-medium">Description</th>
                  <th className="px-3 py-3 font-medium">Slug</th>
                  <th className="w-20 px-3 py-3 text-right font-medium">Count</th>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            {renderBulkActions('tag-bulk-action-bottom')}
            <span className="text-xs text-[#69736A]">{visibleTags.length} {visibleTags.length === 1 ? 'item' : 'items'}</span>
          </div>
          <p className="mt-6 text-xs leading-5 text-[#526052]">Tags help readers find related posts. Deleting a tag removes it from posts but does not delete the posts.</p>
        </section>
      </div>
    </main>
  );
};

export default AdminTags;