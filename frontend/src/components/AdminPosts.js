import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { fetchComments, updatePost as updatePostRequest } from '../services/api';
import AuthContext from '../context/auth-context';
import { loadPublicPosts, loadPublicProfile } from '../services/public-data';
import { createAuthorSlug, getPostAuthorUrl } from '../services/account-url';
import { getEditPostUrl, getPostUrl } from '../services/post-url';

const getLocalCommentCount = (postId) => {
  try {
    const comments = JSON.parse(localStorage.getItem(`testsite-comments-${postId}`) || '[]');
    return Array.isArray(comments) ? comments.length : 0;
  } catch (error) {
    return 0;
  }
};

const getPostDate = (post) => {
  const rawDate = post.publishedAt || post.createdAt || post.created_at || post.date;
  const parsedDate = new Date(rawDate || '');
  if (Number.isNaN(parsedDate.getTime())) return post.date || '—';
  return parsedDate.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getPostMonthKey = (post) => {
  const parsedDate = new Date(post.publishedAt || post.createdAt || post.created_at || post.date || '');
  if (Number.isNaN(parsedDate.getTime())) return '';
  return `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
};

const getMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const getPostCategories = (category) => String(category || 'Uncategorized')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const isPostTrashed = (post) => post?.status === 'trash' || String(post?.status || '').startsWith('trash:');

const getRestoredStatus = (post) => {
  const status = String(post?.status || '');
  return status.startsWith('trash:') ? status.slice(6) || 'published' : 'published';
};

const loadCommentCounts = async (posts, authKey) => {
  const localCounts = Object.fromEntries(posts.map((post) => [String(post.id), getLocalCommentCount(post.id)]));
  try {
    const { data } = await fetchComments(undefined, authKey, true);
    if (!Array.isArray(data)) return localCounts;
    const counts = Object.fromEntries(posts.map((post) => [String(post.id), 0]));
    for (const comment of data) {
      const postId = String(comment.post_id ?? comment.postId ?? '');
      if (postId in counts) counts[postId] += 1;
    }
    return Object.fromEntries(posts.map((post) => {
      const postId = String(post.id);
      return [postId, Math.max(counts[postId] || 0, localCounts[postId] || 0)];
    }));
  } catch (error) {
    return localCounts;
  }
};

const AuthorPreview = ({ post }) => {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const anchorRef = useRef(null);
  const closeTimer = useRef(null);
  const authorName = post.author || 'Unknown author';
  const authorUrl = getPostAuthorUrl(post);
  const profileIdentifier = createAuthorSlug(authorName);
  const photo = profile?.profile_photo || post.authorAvatar || '';
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim()
    || profile?.name
    || authorName;
  const initials = fullName.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const showPreview = () => {
    window.clearTimeout(closeTimer.current);
    const bounds = anchorRef.current?.getBoundingClientRect();
    if (bounds) {
      const width = 288;
      const height = 190;
      const top = bounds.bottom + height + 4 <= window.innerHeight
        ? bounds.bottom + 4
        : Math.max(8, bounds.top - height - 4);
      setPosition({
        left: Math.max(8, Math.min(bounds.left, window.innerWidth - width - 8)),
        top
      });
    }
    setOpen(true);
    if (profile || loading || !profileIdentifier || profileIdentifier === 'unknown-author') return;
    setLoading(true);
    loadPublicProfile(profileIdentifier)
      .then(setProfile)
      .finally(() => setLoading(false));
  };

  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <>
      <Link
        ref={anchorRef}
        to={authorUrl}
        onMouseEnter={showPreview}
        onMouseLeave={scheduleClose}
        onFocus={showPreview}
        onBlur={scheduleClose}
        className="text-[#2271B1] hover:text-[#22C55E] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
      >
        {authorName}
      </Link>
      {open && createPortal(
        <div
          role="tooltip"
          onMouseEnter={() => window.clearTimeout(closeTimer.current)}
          onMouseLeave={scheduleClose}
          style={{ left: position.left, top: position.top }}
          className="fixed z-[100] w-72 rounded-2xl border border-[#D7DED7] bg-white p-4 text-left text-[#1E1E1E] shadow-xl"
        >
          <span className="flex items-center gap-3">
            {photo
              ? <img src={photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
              : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#22C55E] text-sm font-semibold text-[#102718]">{initials || 'A'}</span>}
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{fullName}</span>
              {profile?.username && <span className="mt-1 block truncate text-xs text-[#69736A]">@{profile.username}</span>}
            </span>
          </span>
          {loading
            ? <span className="mt-3 block text-xs text-[#69736A]">Loading profile…</span>
            : (profile?.bio || post.authorBio) && <span className="mt-3 block line-clamp-3 text-xs leading-5 text-[#526052]">{profile?.bio || post.authorBio}</span>}
          <Link to={authorUrl} className="mt-3 inline-flex text-xs font-semibold text-[#16803C] hover:underline">View profile</Link>
        </div>,
        document.body
      )}
    </>
  );
};

const AdminPosts = () => {
  const { user, updateProfile, deletePost } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [appliedFilters, setAppliedFilters] = useState({ category: 'all', month: 'all' });
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [status, setStatus] = useState(() => searchParams.get('status') === 'trash' ? 'trash' : 'all');
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [quickEditPostId, setQuickEditPostId] = useState(null);
  const [quickEditForm, setQuickEditForm] = useState({});
  const postsPerPage = 20;

  useEffect(() => {
    let isMounted = true;
    loadPublicPosts()
      .then(async (loadedPosts) => {
        const safePosts = Array.isArray(loadedPosts) ? loadedPosts : [];
        const authKey = user?.authKey || user?.auth_key;
        const counts = await loadCommentCounts(safePosts, authKey);
        if (!isMounted) return;
        setPosts(safePosts);
        setCommentCounts(counts);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const categories = useMemo(() => [...new Set(posts.flatMap((post) => getPostCategories(post.category)))].sort(), [posts]);
  const monthOptions = useMemo(() => {
    const monthKeys = [...new Set(posts.map(getPostMonthKey).filter(Boolean))].sort((left, right) => right.localeCompare(left));
    return monthKeys.map((key) => ({ key, label: getMonthLabel(key) }));
  }, [posts]);
  const publishedCount = posts.filter((post) => (post.status || 'published') === 'published').length;
  const trashCount = posts.filter(isPostTrashed).length;
  const visiblePosts = posts.filter((post) => {
    const postStatus = post.status || 'published';
    const matchesStatus = status === 'all'
      || (status === 'trash' ? isPostTrashed(post) : postStatus === status);
    const matchesCategory = appliedFilters.category === 'all' || getPostCategories(post.category).includes(appliedFilters.category);
    const matchesMonth = appliedFilters.month === 'all' || getPostMonthKey(post) === appliedFilters.month;
    const searchable = [post.title, post.author, post.category, ...(Array.isArray(post.tags) ? post.tags : [])].join(' ').toLowerCase();
    return matchesStatus && matchesCategory && matchesMonth && searchable.includes(query.trim().toLowerCase());
  });
  const pageCount = Math.max(1, Math.ceil(visiblePosts.length / postsPerPage));
  const displayedPage = Math.min(currentPage, pageCount);
  const pagePosts = visiblePosts.slice((displayedPage - 1) * postsPerPage, displayedPage * postsPerPage);
  const selectedPosts = visiblePosts.filter((post) => selectedPostIds.includes(String(post.id)));
  const allVisibleSelected = pagePosts.length > 0 && pagePosts.every((post) => selectedPostIds.includes(String(post.id)));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, pageCount));
  }, [pageCount]);

  const changePostStatus = async (post, nextStatus) => {
    const authKey = user?.authKey || user?.auth_key;
    if (!authKey) {
      setActionError('Your login session expired. Log out and sign in again.');
      return;
    }

    const storedStatus = post.status || 'published';
    const requestedStatus = nextStatus === 'trash'
      ? `trash:${isPostTrashed(post) ? getRestoredStatus(post) : storedStatus}`
      : getRestoredStatus(post);

    try {
      await updatePostRequest(post.id, { authKey, status: requestedStatus });
      setPosts((current) => current.map((item) => String(item.id) === String(post.id)
        ? { ...item, status: requestedStatus }
        : item));
      setActionError('');
    } catch (error) {
      setActionError(error?.response?.data?.message || 'Could not update this post. Please try again.');
    }
  };

  const applyBulkAction = async () => {
    if (!selectedPosts.length) {
      setActionError('Select at least one post first.');
      return;
    }

    if (bulkAction === 'trash') {
      for (const post of selectedPosts) await changePostStatus(post, 'trash');
      setSelectedPostIds([]);
      setBulkAction('');
      return;
    }

  };

  const deletePermanently = async (post) => {
    const authKey = user?.authKey || user?.auth_key;
    if (!authKey) {
      setActionError('Your login session expired. Log out and sign in again.');
      return;
    }
    if (!window.confirm(`Permanently delete "${post.title || 'Untitled'}"? This cannot be undone.`)) return;

    try {
      await deletePost(post.id);
      setPosts((current) => current.filter((item) => String(item.id) !== String(post.id)));
      setCommentCounts((current) => {
        const next = { ...current };
        delete next[String(post.id)];
        return next;
      });
      setActionError('');
    } catch (error) {
      setActionError(error?.response?.data?.message || 'Could not permanently delete this post. Please try again.');
    }
  };

  const beginQuickEdit = (post) => {
    const rawDate = post.publishedAt || post.createdAt || post.created_at || post.date;
    const parsedDate = new Date(rawDate || Date.now());
    const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const localDate = new Date(validDate.getTime() - validDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setActionError('');
    setQuickEditPostId(String(post.id));
    setQuickEditForm({
      title: post.title || '',
      slug: post.slug || '',
      date: localDate,
      categories: getPostCategories(post.category),
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : String(post.tags || ''),
      allowComments: post.allowComments !== false,
      status: post.status || 'published'
    });
  };

  const saveQuickEdit = async (post) => {
    const authKey = user?.authKey || user?.auth_key;
    if (!authKey) {
      setActionError('Your login session expired. Log out and sign in again.');
      return;
    }

    const parsedDate = new Date(quickEditForm.date || '');
    if (Number.isNaN(parsedDate.getTime())) {
      setActionError('Enter a valid post date.');
      return;
    }

    const title = String(quickEditForm.title || '').trim() || 'Untitled';
    const slug = String(quickEditForm.slug || '').trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || String(post.id);
    const selectedCategories = Array.isArray(quickEditForm.categories) ? quickEditForm.categories : [];
    const category = selectedCategories.length ? selectedCategories.join(', ') : 'Uncategorized';
    const tags = String(quickEditForm.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    const publishedAt = parsedDate.toISOString();
    const createdAt = publishedAt.slice(0, 19).replace('T', ' ');
    const nextPost = {
      ...post,
      title,
      slug,
      category,
      tags,
      status: quickEditForm.status || 'published',
      allowComments: quickEditForm.allowComments !== false,
      createdAt,
      created_at: createdAt,
      publishedAt,
      date: parsedDate.toLocaleDateString()
    };

    try {
      if (/^\d+$/.test(String(post.id))) {
        try {
          await updatePostRequest(post.id, {
            authKey,
            title,
            content: post.content || '',
            image: post.featuredImage || post.image || '',
            slug,
            category,
            tags,
            status: nextPost.status,
            allowComments: nextPost.allowComments,
            created_at: createdAt
          });
        } catch (error) {
          if (error?.response?.status !== 404) throw error;
        }
      }

      const updateList = (list) => Array.isArray(list)
        ? list.map((item) => String(item.id) === String(post.id) ? { ...item, ...nextPost, id: item.id } : item)
        : list;
      setPosts((current) => updateList(current));

      try {
        localStorage.setItem('testsite-posts', JSON.stringify(updateList(JSON.parse(localStorage.getItem('testsite-posts') || '[]'))));
        for (let index = 0; index < localStorage.length; index += 1) {
          const key = localStorage.key(index);
          if (!key || (!key.startsWith('testsite-posts-') && !key.startsWith('testsite-drafts-') && !key.startsWith('testsite-user-persist-'))) continue;
          const stored = JSON.parse(localStorage.getItem(key) || 'null');
          if (Array.isArray(stored)) localStorage.setItem(key, JSON.stringify(updateList(stored)));
          else if (Array.isArray(stored?.posts)) localStorage.setItem(key, JSON.stringify({ ...stored, posts: updateList(stored.posts) }));
        }
      } catch (error) {
        console.warn('Unable to update cached quick-edit data.', error);
      }

      const userPosts = updateList(user.posts || []);
      if (userPosts.some((item) => String(item.id) === String(post.id))) updateProfile({ posts: userPosts });
      setActionError('');
      setQuickEditPostId(null);
    } catch (error) {
      setActionError(error?.response?.data?.message || 'Could not update this post. Please try again.');
    }
  };

  return (
    <main className="min-h-full bg-[#F7FAF7] px-4 py-6 text-[#1E1E1E] md:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[23px] font-normal leading-tight">Posts</h1>
        <Link to="/create-post" className="inline-flex h-8 items-center rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Add Post</Link>
      </div>

      {actionError && <div role="alert" className="mt-4 rounded-xl border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</div>}

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#69736A]">
          <button type="button" onClick={() => { setStatus('all'); setCurrentPage(1); }} className={status === 'all' ? 'font-semibold text-[#1E1E1E]' : 'text-[#2271B1] hover:text-[#22C55E]'}>All ({posts.length})</button>
          <span aria-hidden="true">|</span>
          <button type="button" onClick={() => { setStatus('published'); setCurrentPage(1); }} className={status === 'published' ? 'font-semibold text-[#1E1E1E]' : 'text-[#2271B1] hover:text-[#22C55E]'}>Published ({publishedCount})</button>
          <span aria-hidden="true">|</span>
          <button type="button" onClick={() => { setStatus('trash'); setCurrentPage(1); }} className={status === 'trash' ? 'font-semibold text-[#1E1E1E]' : 'text-[#2271B1] hover:text-[#22C55E]'}>Trash ({trashCount})</button>
        </div>
        <form onSubmit={(event) => event.preventDefault()} className="flex w-full gap-2 lg:w-auto">
          <label className="sr-only" htmlFor="admin-post-search">Search posts</label>
          <input
            id="admin-post-search"
            value={query}
            onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }}
            placeholder="Search posts…"
            className="h-9 min-w-0 flex-1 rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E] lg:w-64"
          />
          <button type="submit" className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">
            <MagnifyingGlassIcon className="h-4 w-4" />
            Search Posts
          </button>
        </form>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="admin-post-bulk-action">Bulk actions</label>
          <select
            id="admin-post-bulk-action"
            value={bulkAction}
            onChange={(event) => setBulkAction(event.target.value)}
            className="h-9 min-w-32 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
          >
            <option value="">Bulk actions</option>
            <option value="edit">Bulk edit</option>
            {status !== 'trash' && <option value="trash">Move to Trash</option>}
          </select>
          <button
            type="button"
            onClick={applyBulkAction}
            className="inline-flex h-9 items-center rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]"
          >
            Apply
          </button>
          <label className="sr-only" htmlFor="admin-post-month">Filter by month</label>
          <select
            id="admin-post-month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="h-9 min-w-40 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
          >
            <option value="all">All dates</option>
            {monthOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
          </select>
          <label className="sr-only" htmlFor="admin-post-category">Filter by category</label>
          <select
            id="admin-post-category"
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="h-9 min-w-40 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
          >
            <option value="all">All Categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button
            type="button"
            onClick={() => { setAppliedFilters({ category: selectedCategory, month: selectedMonth }); setCurrentPage(1); }}
            className="inline-flex h-9 items-center rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]"
          >
            Filter
          </button>
        </div>
        <div className="text-right text-xs text-[#69736A]">{visiblePosts.length} {visiblePosts.length === 1 ? 'item' : 'items'}</div>
      </div>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-[#C8D0C8] bg-white">
        <table className="w-full min-w-[940px] border-collapse text-left text-sm">
          <thead className="bg-white text-[#384238]">
            <tr className="border-b border-[#C8D0C8]">
              <th scope="col" className="w-[32%] px-3 py-3 font-medium">
                <span className="flex items-center gap-2">
                  <input type="checkbox" aria-label="Select all visible posts" checked={allVisibleSelected} onChange={(event) => setSelectedPostIds((current) => event.target.checked
                    ? [...new Set([...current, ...pagePosts.map((post) => String(post.id))])]
                    : current.filter((id) => !pagePosts.some((post) => String(post.id) === id)))} className="green-checkbox" />
                  Title
                </span>
              </th>
              <th scope="col" className="w-[14%] px-3 py-3 font-medium">Author</th>
              <th scope="col" className="w-[16%] px-3 py-3 font-medium">Categories</th>
              <th scope="col" className="w-[16%] px-3 py-3 font-medium">Tags</th>
              <th scope="col" className="w-[8%] px-3 py-3 text-center font-medium" aria-label="Comments"><ChatBubbleLeftRightIcon className="mx-auto h-4 w-4" /></th>
              <th scope="col" className="w-[14%] px-3 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#69736A]">Loading posts…</td></tr>
            ) : visiblePosts.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#69736A]">No posts found.</td></tr>
            ) : pagePosts.map((post, index) => {
              const tags = Array.isArray(post.tags) ? post.tags : [];
              const comments = commentCounts[String(post.id)] ?? getLocalCommentCount(post.id);
              const trashed = isPostTrashed(post);
              if (quickEditPostId === String(post.id)) {
                return (
                  <tr key={post.id} className="border-b border-[#DCE5DC] bg-[#F7FAF7]">
                    <td colSpan={6} className="p-3 md:p-4">
                      <div className="rounded-2xl border border-[#D7DED7] bg-white p-4 md:p-5">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="block text-xs font-semibold text-[#526052]">
                          Title
                          <input value={quickEditForm.title || ''} onChange={(event) => setQuickEditForm((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 h-9 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm font-normal text-[#1E1E1E] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                        </label>
                        <label className="block text-xs font-semibold text-[#526052]">
                          Slug
                          <input value={quickEditForm.slug || ''} onChange={(event) => setQuickEditForm((current) => ({ ...current, slug: event.target.value }))} className="mt-1.5 h-9 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm font-normal text-[#1E1E1E] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                        </label>
                        <label className="block text-xs font-semibold text-[#526052]">
                          Date
                          <input type="datetime-local" value={quickEditForm.date || ''} onChange={(event) => setQuickEditForm((current) => ({ ...current, date: event.target.value }))} className="mt-1.5 h-9 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm font-normal text-[#1E1E1E] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                        </label>
                        <fieldset className="min-w-0">
                          <legend className="text-xs font-semibold text-[#526052]">Categories</legend>
                          <div className="mt-1.5 max-h-32 space-y-1.5 overflow-y-auto rounded-xl border border-[#D7DED7] bg-white p-2.5">
                            {categories.map((item) => {
                              const selectedCategories = Array.isArray(quickEditForm.categories) ? quickEditForm.categories : [];
                              const checked = selectedCategories.includes(item);
                              return (
                                <label key={item} className="flex cursor-pointer items-center gap-2 text-sm font-normal text-[#526052]">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => setQuickEditForm((current) => {
                                      const currentCategories = Array.isArray(current.categories) ? current.categories : [];
                                      const nextCategories = checked
                                        ? currentCategories.filter((category) => category !== item)
                                        : [...currentCategories, item];
                                      return { ...current, categories: nextCategories.length ? nextCategories : ['Uncategorized'] };
                                    })}
                                    className="green-checkbox"
                                  />
                                  <span>{item}</span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                        <label className="block text-xs font-semibold text-[#526052]">
                          Tags
                          <input value={quickEditForm.tags || ''} onChange={(event) => setQuickEditForm((current) => ({ ...current, tags: event.target.value }))} placeholder="tag1, tag2" className="mt-1.5 h-9 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm font-normal text-[#1E1E1E] placeholder:text-[#899389] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                        </label>
                        <label className="block text-xs font-semibold text-[#526052]">
                          Status
                          <select value={quickEditForm.status || 'published'} onChange={(event) => setQuickEditForm((current) => ({ ...current, status: event.target.value }))} className="mt-1.5 h-9 w-full rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm font-normal text-[#1E1E1E] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]">
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            {quickEditForm.status === 'scheduled' && <option value="scheduled">Scheduled</option>}
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm text-[#526052] sm:col-span-2 lg:col-span-3">
                          <input type="checkbox" checked={quickEditForm.allowComments !== false} onChange={(event) => setQuickEditForm((current) => ({ ...current, allowComments: event.target.checked }))} className="green-checkbox" />
                          Allow comments
                        </label>
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button type="button" onClick={() => setQuickEditPostId(null)} className="h-9 rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm text-[#384238] hover:bg-[#EFF4EF]">Cancel</button>
                        <button type="button" onClick={() => saveQuickEdit(post)} className="h-9 rounded-xl bg-[#16803C] px-4 text-sm font-semibold text-white hover:bg-[#12652F]">Update</button>
                      </div>
                      </div>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={post.id} className={`${index % 2 ? 'bg-[#F7FAF7]' : 'bg-white'} border-b border-[#DCE5DC] align-top hover:bg-[#F0F8F0]`}>
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" aria-label={`Select ${post.title || 'Untitled'}`} checked={selectedPostIds.includes(String(post.id))} onChange={(event) => setSelectedPostIds((current) => event.target.checked
                        ? [...new Set([...current, String(post.id)])]
                        : current.filter((id) => id !== String(post.id)))} className="green-checkbox mt-0.5" />
                      <div className="group/post-actions">
                      <Link to={getPostUrl(post)} className="font-medium text-[#2271B1] hover:text-[#16803C] hover:underline">{post.title || 'Untitled'}</Link>
                      <div className="mt-1 flex items-center gap-1 text-xs text-[#16803C] opacity-100 transition-opacity md:pointer-events-none md:opacity-0 md:group-hover/post-actions:pointer-events-auto md:group-hover/post-actions:opacity-100 md:group-focus-within/post-actions:pointer-events-auto md:group-focus-within/post-actions:opacity-100">
                        {trashed ? (
                          <>
                            <button type="button" onClick={() => changePostStatus(post, 'restore')} className="hover:underline">Restore</button>
                            <span aria-hidden="true" className="text-[#8A948A]">|</span>
                            <button type="button" onClick={() => deletePermanently(post)} className="hover:underline">Delete Permanently</button>
                          </>
                        ) : (
                          <>
                            <Link to={getEditPostUrl(post)} className="hover:underline">Edit</Link>
                            <span aria-hidden="true" className="text-[#8A948A]">|</span>
                            <button type="button" onClick={() => beginQuickEdit(post)} className="hover:underline">Quick Edit</button>
                            <span aria-hidden="true" className="text-[#8A948A]">|</span>
                            <button type="button" onClick={() => changePostStatus(post, 'trash')} className="hover:underline">Trash</button>
                            <span aria-hidden="true" className="text-[#8A948A]">|</span>
                            <Link to={getPostUrl(post)} className="hover:underline">View</Link>
                          </>
                        )}
                      </div>
                    </div>
                    </div>
                  </td>
                  <td className="px-3 py-3"><AuthorPreview post={post} /></td>
                  <td className="px-3 py-3 text-[#526052]">
                    {getPostCategories(post.category).map((item, categoryIndex) => (
                      <span key={`${item}-${categoryIndex}`}>
                        {categoryIndex > 0 && <span className="text-[#8A948A]">, </span>}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(item);
                            setAppliedFilters((current) => ({ ...current, category: item }));
                          }}
                          aria-label={`Filter posts by ${item}`}
                          className="text-left hover:text-[#16803C] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E]"
                        >
                          {item}
                        </button>
                      </span>
                    ))}
                  </td>
                  <td className="px-3 py-3 text-[#526052]">{tags.length ? tags.join(', ') : '—'}</td>
                  <td className="px-3 py-3 text-center">
                    <Link to={`/testsite/admin/comments?post=${encodeURIComponent(post.id)}`} aria-label={`${comments} comments`} className="inline-flex min-w-7 justify-center rounded-sm bg-[#69736A] px-1.5 py-0.5 text-xs font-semibold text-white transition-colors hover:bg-[#16803C]">{comments}</Link>
                  </td>
                  <td className="px-3 py-3 text-xs leading-5 text-[#526052]">
                    <span className="block capitalize">{trashed ? 'Trash' : post.status || 'published'}</span>
                    <time dateTime={post.publishedAt || post.createdAt || post.created_at}>{getPostDate(post)}</time>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-white text-[#384238]">
            <tr className="border-t border-[#C8D0C8]">
              <th scope="col" className="px-3 py-3 text-left font-medium">Title</th>
              <th scope="col" className="px-3 py-3 text-left font-medium">Author</th>
              <th scope="col" className="px-3 py-3 text-left font-medium">Categories</th>
              <th scope="col" className="px-3 py-3 text-left font-medium">Tags</th>
              <th scope="col" className="px-3 py-3 text-center font-medium" aria-label="Comments"><ChatBubbleLeftRightIcon className="mx-auto h-4 w-4" /></th>
              <th scope="col" className="px-3 py-3 text-left font-medium">Date</th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="relative mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="admin-post-bulk-action-bottom">Bulk actions</label>
          <select
            id="admin-post-bulk-action-bottom"
            value={bulkAction}
            onChange={(event) => setBulkAction(event.target.value)}
            className="h-9 min-w-32 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]"
          >
            <option value="">Bulk actions</option>
            <option value="edit">Bulk edit</option>
            {status !== 'trash' && <option value="trash">Move to Trash</option>}
          </select>
          <button
            type="button"
            onClick={applyBulkAction}
            className="inline-flex h-9 items-center rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]"
          >
            Apply
          </button>
        </div>
        {visiblePosts.length > postsPerPage && (
          <nav aria-label="Posts pagination" className="flex w-full items-center justify-center gap-2 sm:absolute sm:left-1/2 sm:w-auto sm:-translate-x-1/2">
            <button
              type="button"
              onClick={() => setCurrentPage(displayedPage - 1)}
              disabled={displayedPage === 1}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#5B7DBB] px-2.5 text-xs font-semibold text-white hover:bg-[#496BA8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Prev 20
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(displayedPage + 1)}
              disabled={displayedPage === pageCount}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-[#5B7DBB] px-2.5 text-xs font-semibold text-white hover:bg-[#496BA8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next 20
              <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </main>
  );
};

export default AdminPosts;
