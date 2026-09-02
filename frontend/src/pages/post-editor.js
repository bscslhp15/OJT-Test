import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/page-header';
import AuthContext from '../context/auth-context';

const categories = ['General', 'Design', 'Development', 'Branding', 'Marketing'];

const createBlock = (type = 'paragraph', data = {}) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type,
  data: { text: '', ...data }
});

const parseContentBlocks = (content) => {
  if (!content) return [createBlock()];

  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.blocks)) {
      return parsed.blocks.map((block) => ({ ...block, id: block.id || createBlock().id }));
    }
  } catch (error) {
    // Existing posts may still contain HTML content.
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = content;
  const blocks = [...wrapper.children].map((element) => {
    if (/^H[1-6]$/.test(element.tagName)) return createBlock('header', { text: element.textContent });
    if (element.tagName === 'BLOCKQUOTE') return createBlock('quote', { text: element.textContent });
    if (element.tagName === 'IMG') return createBlock('image', { url: element.getAttribute('src') || '', caption: element.getAttribute('alt') || '' });
    return createBlock('paragraph', { text: element.textContent });
  });

  return blocks.length > 0 ? blocks : [createBlock()];
};

const PostEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateProfile } = useContext(AuthContext);
  const contentEditorRef = useRef(null);
  const isEdit = Boolean(id);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: 'General',
    tags: '',
    image: null,
    content: ''
  });
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [blocks, setBlocks] = useState([createBlock()]);
  const [openBlockMenu, setOpenBlockMenu] = useState(null);

  useEffect(() => {
    if (!user) return;

    const posts = Array.isArray(user.posts) ? user.posts : [];

    if (isEdit) {
      const existingPost = posts.find((post) => String(post.id) === String(id));

      if (existingPost) {
        setForm({
          title: existingPost.title || '',
          slug: existingPost.slug || '',
          category: existingPost.category || 'General',
          tags: Array.isArray(existingPost.tags) ? existingPost.tags.join(', ') : existingPost.tags || '',
          image: existingPost.featuredImage || existingPost.image || null,
          content: existingPost.content || ''
        });
        setBlocks(parseContentBlocks(existingPost.content || ''));
        return;
      }
    }

    setForm({
      title: '',
      slug: '',
      category: 'General',
      tags: '',
      image: null,
      content: ''
    });
    setBlocks([createBlock()]);
  }, [id, isEdit, user]);

  useEffect(() => {
    if (user && !user.confirmed) {
      navigate(`/confirm?email=${encodeURIComponent(user.email || '')}`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const handleDocumentClick = (event) => {
      const anchor = event.target.closest('a');

      if (!isDirty || !anchor) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (targetUrl.origin !== currentUrl.origin) {
        event.preventDefault();
        handleLeave('/account');
        return;
      }

      if (targetUrl.pathname !== currentUrl.pathname) {
        event.preventDefault();
        handleLeave('/account');
      }
    };

    const handlePopState = () => {
      if (isDirty) {
        setPendingNavigation('/account');
        setPendingAction('save');
        setShowConfirm(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleDocumentClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isDirty]);

  const handleChange = (event) => {
    const { name, value, files, type } = event.target;

    if (type === 'file' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = () => {
        setForm((prev) => ({
          ...prev,
          image: reader.result
        }));
        setIsDirty(true);
      };

      reader.readAsDataURL(file);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const updateBlocks = (nextBlocks) => {
    setBlocks(nextBlocks);
    setForm((prev) => ({ ...prev, content: JSON.stringify({ time: Date.now(), blocks: nextBlocks }) }));
    setIsDirty(true);
  };

  const addBlock = (type) => updateBlocks([...blocks, createBlock(type)]);

  const updateBlock = (id, data) => updateBlocks(blocks.map((block) => (
    block.id === id ? { ...block, data: { ...block.data, ...data } } : block
  )));

  const removeBlock = (id) => {
    const nextBlocks = blocks.filter((block) => block.id !== id);
    updateBlocks(nextBlocks.length > 0 ? nextBlocks : [createBlock()]);
  };

  const handleBlockImage = (event, id) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateBlock(id, { url: reader.result, caption: file.name });
    reader.readAsDataURL(file);
  };

  const savePost = (redirectTarget = '/account') => {
    try {
      const currentPosts = Array.isArray(user?.posts) ? user.posts : [];
      const allPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
      const normalizedTags = form.tags
        ? form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const imageValue = form.image || '';
      const authorName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || 'Author';
      const authorId = user?.email || user?.username || `guest-${Date.now()}`;
      const postData = {
        title: form.title || 'Untitled',
        slug: form.slug || `post-${Date.now()}`,
        category: form.category,
        tags: normalizedTags,
        image: imageValue,
        featuredImage: imageValue,
        content: form.content,
        date: new Date().toLocaleDateString(),
        author: authorName,
        authorId: authorId,
        authorAvatar: user?.profile_photo || (user?.email ? localStorage.getItem(`testsite-profile-${user.email.toLowerCase()}`) : ''),
        authorBio: user?.bio || '',
        authorSocial: user?.social || {}
      };

      if (isEdit && id) {
        const updatedGlobalPosts = allPosts.map((post) =>
          String(post.id) === String(id)
            ? { ...post, ...postData, id: post.id }
            : post
        );

        const updatedUserPosts = currentPosts.map((post) =>
          String(post.id) === String(id)
            ? { ...post, ...postData, id: post.id }
            : post
        );

        const savedPosts = updatedGlobalPosts.length > 0 ? updatedGlobalPosts : [{ id: Number(id), ...postData }];

        localStorage.setItem('testsite-posts', JSON.stringify(savedPosts));

        if (updateProfile) {
          updateProfile({ posts: updatedUserPosts.length > 0 ? updatedUserPosts : [{ id: Number(id), ...postData }] });
        }

        navigate(redirectTarget);
        return;
      }

      const newPost = {
        id: Date.now(),
        ...postData
      };

      const savedPosts = [newPost, ...allPosts];
      const savedUserPosts = [newPost, ...currentPosts];
      localStorage.setItem('testsite-posts', JSON.stringify(savedPosts));

      if (updateProfile) {
        updateProfile({ posts: savedUserPosts });
      }

      navigate(redirectTarget);
    } catch (err) {
      console.error('Failed to save post locally', err);
      alert('Unable to save post. Check console for details.');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (isDirty) {
      setPendingAction(isEdit ? 'save' : 'publish');
      setPendingNavigation('/account');
      setShowConfirm(true);
      return;
    }

    setIsDirty(false);
    setShowConfirm(false);
    setPendingAction(null);
    savePost('/account');
  };

  const handleLeave = (target = '/account') => {
    if (isDirty) {
      setPendingNavigation(target);
      setPendingAction(isEdit ? 'save' : 'publish');
      setShowConfirm(true);
    } else {
      navigate(target);
    }
  };

  const confirmLeave = (action) => {
    if (action === 'discard') {
      setIsDirty(false);
      setShowConfirm(false);
      setPendingNavigation(null);
      setPendingAction(null);
      navigate('/account');
      return;
    }

    setIsDirty(false);
    setShowConfirm(false);
    setPendingNavigation(null);
    setPendingAction(null);
    savePost('/account');
  };

  const confirmPrimaryLabel = isEdit ? 'Save' : 'Publish';
  const confirmMessage = isEdit
    ? 'You have unsaved changes. Save or discard before leaving.'
    : 'You have unsaved changes. Publish or discard before leaving.';
  const checklistItems = [
    { label: 'Add a clear title', complete: Boolean(form.title.trim()) },
    { label: 'Choose a category', complete: form.category !== 'General' },
    { label: 'Add content', complete: blocks.some((block) => block.data?.text?.trim()) },
    { label: 'Add at least one tag', complete: Boolean(form.tags.trim()) },
    { label: 'Pick a featured image', complete: Boolean(form.image) }
  ];
  const checklistProgress = Math.round((checklistItems.filter((item) => item.complete).length / checklistItems.length) * 100);

  if (!user || !user.confirmed) {
    if (user && !user.confirmed) return null;
    return (
      <>
        <PageHeader title="Create Post" subtitle="Please log in to manage blog posts." />
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Confirmation required</h2>
            <p className="mt-4 text-slate-600">Please confirm your account before creating or editing blog posts.</p>
            {!user && <button type="button" onClick={() => navigate('/login')} className="mt-6 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Go to Login</button>}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Edit Post' : 'Create Post'} subtitle={isEdit ? 'Update your blog content.' : 'Write a new blog post.'} />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-12">
          {/* Left column: title + editor */}
          <div className="lg:col-span-8">
            <div className="mb-6 rounded-3xl border border-[#dfe5dc] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(34,197,94,0.06)]">
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Give your story a title..."
                className="w-full rounded-2xl border-0 bg-transparent px-0 text-3xl leading-tight text-slate-900 placeholder-slate-400 outline-none focus:ring-0 sm:text-4xl"
              />
            </div>

            <div className="mb-6">
              <div className="space-y-4">
                {blocks.map((block, index) => (
                  <div key={block.id} className="group relative ml-10 rounded-3xl border border-[#dfe5dc] bg-white p-5 shadow-[0_12px_30px_rgba(34,197,94,0.04)] hover:border-[#cbdcc7]">
                    <div className="absolute -left-10 top-1/2 flex -translate-y-1/2 items-center gap-2" onMouseEnter={() => setOpenBlockMenu(block.id)} onMouseLeave={() => setOpenBlockMenu(null)}>
                      <button
                        type="button"
                        onClick={() => setOpenBlockMenu(openBlockMenu === block.id ? null : block.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-[#dfe5dc] bg-white text-xl leading-none text-slate-500 shadow-sm transition hover:border-[#22C55E] hover:text-[#22C55E]"
                        aria-label={`Add block before block ${index + 1}`}
                        aria-expanded={openBlockMenu === block.id}
                      >
                        +
                      </button>
                      {openBlockMenu === block.id && (
                        <div className="z-10 flex h-11 items-center gap-1 rounded-full border border-[#dfe5dc] bg-white px-2 shadow-lg" role="menu">
                          {[
                            ['paragraph', 'fa-font', 'Text'],
                            ['header', 'fa-heading', 'Subtitle'],
                            ['quote', 'fa-quote-left', 'Quote'],
                            ['list', 'fa-list', 'List'],
                            ['image', 'fa-image', 'Image']
                          ].map(([type, icon, label]) => (
                            <button
                              key={type}
                              type="button"
                              title={`Add ${label}`}
                              aria-label={`Add ${label}`}
                              onClick={() => { addBlock(type); setOpenBlockMenu(null); }}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-slate-600 transition hover:bg-[#eaf7eb] hover:text-[#22C55E]"
                              role="menuitem"
                            >
                              <i className={`fas ${icon}`} aria-hidden="true"></i>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-[#159b57]">
                      <span>{block.type === 'paragraph' ? 'Title Text' : block.type}</span>
                    </div>
                    <div className="absolute right-4 top-4 hidden gap-1 rounded bg-white shadow-sm group-hover:flex">
                      <button type="button" onClick={() => removeBlock(block.id)} className="px-2 py-1 text-xs text-slate-400 hover:text-red-600" aria-label={`Remove block ${index + 1}`}>×</button>
                    </div>
                    {block.type === 'image' ? (
                      <div>
                        {block.data.url ? <img src={block.data.url} alt={block.data.caption || 'Post block'} className="max-h-96 w-full object-cover" /> : <div className="flex h-40 items-center justify-center border-2 border-dashed border-slate-200 text-sm text-slate-400">Choose an image below</div>}
                        <input type="file" accept="image/*" onChange={(event) => handleBlockImage(event, block.id)} className="mt-3 w-full text-sm text-slate-500" />
                        <input value={block.data.caption || ''} onChange={(event) => updateBlock(block.id, { caption: event.target.value })} placeholder="Image caption (optional)" className="mt-2 w-full border-0 px-0 text-sm text-slate-500 outline-none focus:ring-0" />
                      </div>
                    ) : (
                      <textarea value={block.data.text || ''} onChange={(event) => updateBlock(block.id, { text: event.target.value })} placeholder={block.type === 'header' ? 'Write a subtitle...' : block.type === 'quote' ? 'Write a quotation...' : block.type === 'list' ? 'One list item per line...' : 'Write your story...'} rows={block.type === 'header' ? 2 : block.type === 'paragraph' ? 5 : 3} className={`w-full resize-y border-0 bg-transparent px-0 text-slate-900 outline-none focus:ring-0 ${block.type === 'header' ? 'text-2xl font-semibold' : block.type === 'quote' ? 'border-l-4 border-emerald-400 pl-4 text-lg italic' : 'text-lg leading-relaxed'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: sidebar */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={handleSubmit} className="rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">{isEdit ? 'Update' : 'Publish story'}</button>
              </div>

              <div className="rounded-3xl border border-[#dfe5dc] bg-white p-6 shadow-[0_12px_30px_rgba(34,197,94,0.08)]">
                <h3 className="font-serif text-xl font-bold text-slate-900">Story details</h3>
                <div className="mt-6">
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-600">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="mt-2 w-full rounded-2xl border border-[#dfe5dc] bg-white px-5 py-3 text-sm text-slate-800 outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20">
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-5">
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-600">Tags</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []).map((tag) => (
                      <span key={tag} className="rounded-lg bg-emerald-50 px-3 py-1 text-sm text-emerald-700">{tag}</span>
                    ))}
                  </div>
                  <input name="tags" value={form.tags} onChange={handleChange} placeholder="Add a tag and press Enter" className="mt-2 w-full rounded-2xl border border-[#dfe5dc] px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20" />
                </div>

                <div className="mt-5">
                  <label className="block text-xs font-medium uppercase tracking-[0.16em] text-slate-600">Featured image</label>
                  <label className="mt-2 flex h-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#d5dfd2] bg-[#f7faf5] text-center transition hover:border-[#22C55E]">
                    {form.image ? (
                      <img src={form.image} alt="Featured preview" className="h-full w-full object-cover" />
                    ) : (
                      <>
                        <i className="fas fa-upload text-lg text-[#22C55E]" aria-hidden="true"></i>
                        <span className="mt-2 text-sm text-slate-500">Click to upload a cover</span>
                      </>
                    )}
                    <input name="image" type="file" accept="image/*" onChange={handleChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-[#dfe5dc] bg-white p-6 shadow-[0_12px_30px_rgba(34,197,94,0.08)]">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-slate-900">Checklist</h3>
                  <span className="text-sm font-semibold text-[#008f4c]">{checklistProgress}%</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e5f0e2]">
                  <div className="h-full rounded-full bg-[#22C55E] transition-all duration-300" style={{ width: `${checklistProgress}%` }} />
                </div>
                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  {checklistItems.map((item) => (
                    <li key={item.label} className="flex items-center gap-3">
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${item.complete ? 'border-[#22C55E] bg-[#22C55E] text-white' : 'border-[#dfe5dc] bg-white'}`}>
                        {item.complete && <i className="fas fa-check text-[10px]" aria-hidden="true"></i>}
                      </span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </form>
      </section>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Unsaved Changes</h3>
            <p className="mt-4 text-slate-600">{confirmMessage}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button onClick={() => confirmLeave('discard')} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Discard
              </button>
              <button onClick={() => confirmLeave('save')} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                {confirmPrimaryLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostEditor;
