import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import PageHeader from '../components/page-header';
import AuthContext, { getDeletedPostIds } from '../context/auth-context';
import { createPostSlug, getEditPostUrl, getPostUrl } from '../services/post-url';
import { getPostAuthorUrl } from '../services/account-url';
import { isPostVisible } from '../services/post-status';
import { loadPublicPosts } from '../services/public-data';
import { fetchComments, updatePost as updatePostRequest } from '../services/api';

const firstRichTextToPlainText = (html) => {
  const container = document.createElement('div');
  container.innerHTML = html || '';
  for (const node of container.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      return node.textContent.replace(/\s+/g, ' ').trim();
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node.matches('p, h1, h2, h3, h4, h5, h6, blockquote, li')
        ? node
        : node.querySelector('p, h1, h2, h3, h4, h5, h6, blockquote, li');
      const text = element?.textContent || (node.tagName !== 'BR' ? node.textContent : '');
      if (text?.trim()) return text.replace(/\s+/g, ' ').trim();
    }
  }
  return (container.textContent || '').replace(/\s+/g, ' ').trim();
};

const firstTwoSentences = (text) => {
  const sentences = String(text || '').match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [];
  return sentences.slice(0, 2).join(' ').trim();
};

const getReadMoreExcerpt = (html) => {
  const markerMatch = String(html || '').match(/data-read-more\s*=\s*(['"])true\1/i);
  if (!markerMatch) return null;
  const markerIndex = markerMatch.index;
  const beforeMarker = String(html).slice(0, markerIndex);
  const container = document.createElement('div');
  container.innerHTML = beforeMarker;
  return (container.textContent || '').replace(/\s+/g, ' ').trim();
};

const getRenderableText = (value) => {
  const text = String(value || '');
  try {
    const nested = JSON.parse(text);
    if (nested && Array.isArray(nested.blocks)) {
      return nested.blocks.map((block) => getRenderableText(block.data?.text || block.data?.caption || '')).join('<p></p>');
    }
  } catch (error) {
    // The block contains regular HTML.
  }
  return text;
};

const getPostExcerpt = (post) => {
  if (typeof post.content !== 'string') return 'No description available';

  try {
    const parsed = JSON.parse(post.content);
    if (parsed && Array.isArray(parsed.blocks)) {
      const contentBeforeReadMore = getReadMoreExcerpt(parsed.blocks.map((block) => getRenderableText(block.data?.text || block.data?.caption || '')).join('<p></p>'));
      if (contentBeforeReadMore !== null) return contentBeforeReadMore || 'No description available';
      const firstBlock = parsed.blocks.find((block) => block.type === 'paragraph' && block.data?.text)
        || parsed.blocks.find((block) => block.data?.text || block.data?.caption);
      const text = firstBlock
        ? firstRichTextToPlainText(getRenderableText(firstBlock.data?.text || firstBlock.data?.caption || ''))
        : '';
      return text ? firstTwoSentences(text) : 'No description available';
    }
  } catch (error) {
    // Continue with the legacy HTML excerpt below.
  }

  const contentBeforeReadMore = getReadMoreExcerpt(post.content);
  if (contentBeforeReadMore !== null) return contentBeforeReadMore || 'No description available';
  if (post.description || post.excerpt) return firstTwoSentences(post.description || post.excerpt);
  const text = firstRichTextToPlainText(post.content);
  return text ? firstTwoSentences(text) : 'No description available';
};

const legacyCategories = new Set(['General', 'Design', 'Development', 'Branding', 'Marketing']);
const normalizeCategory = (category) => {
  const value = String(category || '').trim();
  return legacyCategories.has(value) ? 'Uncategorized' : value;
};
const getPostCategories = (category) => String(category || 'Uncategorized')
  .split(',')
  .map((value) => normalizeCategory(value))
  .map((value) => value.trim())
  .filter(Boolean);

const getPostSortTimestamp = (post) => {
  const rawValue = post?.publishedAt || post?.createdAt || post?.date || '';
  const parsed = new Date(rawValue).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const Blog = () => {
  const { user, updateProfile, deletePost } = useContext(AuthContext);
  const { categorySlug, tagSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [trashConfirmPostId, setTrashConfirmPostId] = useState(null);
  const [quickEditPostId, setQuickEditPostId] = useState(null);
  const [quickEditForm, setQuickEditForm] = useState({});
  const selectedCategories = categorySlug ? [categorySlug] : [];
  const selectedTags = tagSlug ? [tagSlug] : (searchParams.get('tag') ? [searchParams.get('tag')] : []);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [publicPosts, setPublicPosts] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const postsPerPage = 10;

  useEffect(() => {
    let isMounted = true;
    loadPublicPosts().then((posts) => {
      if (isMounted) setPublicPosts(posts);
    });
    return () => { isMounted = false; };
  }, [user?.email]);

  const deletedPostIds = getDeletedPostIds();
  const fallbackPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
  const globalPosts = (publicPosts.length > 0 ? publicPosts : fallbackPosts)
    .filter((post) => !deletedPostIds.has(String(post.id)) && isPostVisible(post));
  const userPosts = (Array.isArray(user?.posts) ? user.posts : [])
    .filter((post) => !deletedPostIds.has(String(post.id)) && isPostVisible(post));
  
  const enrichPost = (post) => {
    const normalizedAuthorId = String(post.authorId ?? post.author_id ?? '').trim();
    if (post.author && post.author.trim()) return post;
    if (normalizedAuthorId) {
      if (normalizedAuthorId.includes('@')) {
        return { ...post, author: normalizedAuthorId.split('@')[0] };
      }
      return { ...post, author: normalizedAuthorId };
    }
    return { ...post, author: 'Author' };
  };
  
  const globalPostsEnriched = globalPosts.map((post) => ({ ...enrichPost(post), category: normalizeCategory(post.category) }));
  const userPostsEnriched = userPosts.map((post) => ({ ...enrichPost(post), category: normalizeCategory(post.category) }));
  const mergedPosts = [...globalPostsEnriched, ...userPostsEnriched.filter((post) => !globalPostsEnriched.some((item) => String(item.id) === String(post.id)))].sort((left, right) => getPostSortTimestamp(right) - getPostSortTimestamp(left));
  const categoryData = mergedPosts.reduce((categoriesByName, post) => {
    getPostCategories(post.category).forEach((category) => {
      categoriesByName[category] = (categoriesByName[category] || 0) + 1;
    });
    return categoriesByName;
  }, {});
  const categories = Object.entries(categoryData);
  const tagData = mergedPosts.reduce((tagsByName, post) => {
    const postTags = Array.isArray(post.tags) ? post.tags : [];
    postTags.forEach((tag) => {
      if (tag) tagsByName[tag] = (tagsByName[tag] || 0) + 1;
    });
    return tagsByName;
  }, {});
  const tags = Object.entries(tagData);
  const displayPosts = mergedPosts.filter((post) => {
    const postCategories = getPostCategories(post.category);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.some((category) => postCategories.some((value) => createPostSlug(value) === category));
    const postTags = Array.isArray(post.tags) ? post.tags : [];
    const matchesTag = selectedTags.length === 0 || selectedTags.some((tag) => postTags.some((value) => createPostSlug(value) === tag || value === tag));
    const searchableText = `${post.title || ''} ${post.author || ''} ${getPostExcerpt(post)}`.toLowerCase();
    const matchesSearch = !searchTerm.trim() || searchableText.includes(searchTerm.trim().toLowerCase());
    return matchesCategory && matchesTag && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(displayPosts.length / postsPerPage));
  const paginatedPosts = displayPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);
  const recentPosts = displayPosts.slice(0, 3);

  useEffect(() => {
    let isMounted = true;
    const loadCommentCounts = async () => {
      const entries = await Promise.all(mergedPosts.map(async (post) => {
        try {
          const { data } = await fetchComments(post.id);
          return [String(post.id), Array.isArray(data) ? data.length : 0];
        } catch (error) {
          return null;
        }
      }));
      if (isMounted) setCommentCounts(Object.fromEntries(entries.filter(Boolean)));
    };
    if (mergedPosts.length > 0) loadCommentCounts();
    return () => { isMounted = false; };
  }, [mergedPosts.map((post) => String(post.id)).join(',')]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const getCommentCount = (postId) => {
    if (Object.prototype.hasOwnProperty.call(commentCounts, String(postId))) {
      return commentCounts[String(postId)];
    }
    try {
      const savedComments = JSON.parse(localStorage.getItem(`testsite-comments-${postId}`) || '[]');
      return Array.isArray(savedComments) ? savedComments.length : 0;
    } catch (error) {
      return 0;
    }
  };

  const canManagePost = (post) => {
    if (!user) return false;
    const normalizeIdentity = (value) => String(value || '').trim().toLowerCase();
    const currentEmail = normalizeIdentity(user.email);
    const currentUsername = normalizeIdentity(user.username);
    const currentUserId = String(user.id || '').trim();
    const postAuthorId = normalizeIdentity(post.authorId);
    const postUserId = String(post.authorUserId ?? post.author_id ?? '').trim();

    return (
      (postUserId && currentUserId && postUserId === currentUserId) ||
      (postAuthorId && (postAuthorId === currentEmail || postAuthorId === currentUsername))
    );
  };

  const handleConfirmTrashDelete = () => {
    if (!trashConfirmPostId) return;
    deletePost(trashConfirmPostId);
    setTrashConfirmPostId(null);
  };

  const beginQuickEdit = (post) => {
    const parsedDate = post?.publishedAt ? new Date(post.publishedAt) : new Date(post?.date || Date.now());
    const validDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    setQuickEditPostId(post.id);
    setQuickEditForm({
      title: post.title || '',
      slug: post.slug || createPostSlug(post.title || ''),
      date: validDate.toISOString().slice(0, 16),
      category: normalizeCategory(post.category || 'Uncategorized'),
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
      allowComments: post.allowComments !== false,
      status: post.status || 'published'
    });
  };

  const saveQuickEdit = async (post) => {
    if (!user) return;

    const nextDate = quickEditForm.date ? new Date(quickEditForm.date) : new Date(post?.publishedAt || post?.date || Date.now());
    const normalizedTitle = String(quickEditForm.title || post.title || 'Untitled').trim() || 'Untitled';
    const normalizedSlug = String(quickEditForm.slug || '').trim() || createPostSlug(normalizedTitle) || String(post.id || 'post');
    const normalizedCategory = normalizeCategory(quickEditForm.category || post.category || 'Uncategorized');
    const nextPost = {
      ...post,
      id: post.id,
      title: normalizedTitle,
      slug: normalizedSlug,
      category: normalizedCategory,
      status: quickEditForm.status || post.status || 'published',
      tags: String(quickEditForm.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      allowComments: quickEditForm.allowComments !== false,
      date: nextDate.toLocaleDateString(),
      publishedAt: nextDate.toISOString(),
      updatedAt: new Date().toISOString()
    };

    const authKey = user.authKey || user.auth_key;
    if (authKey && /^\d+$/.test(String(post.id))) {
      try {
        await updatePostRequest(post.id, {
          authKey,
          title: normalizedTitle,
          content: post.content || '',
          image: post.featuredImage || post.image || '',
          slug: normalizedSlug,
          category: normalizedCategory,
          tags: nextPost.tags,
          status: nextPost.status,
          allowComments: nextPost.allowComments
        });
      } catch (error) {
        console.warn('Backend quick edit failed; keeping the local update.', error);
      }
    }

    const updatePostsList = (posts) => {
      const safePosts = Array.isArray(posts) ? posts : [];
      const foundMatch = safePosts.some((item) => String(item.id) === String(post.id));
      return foundMatch
        ? safePosts.map((item) => (String(item.id) === String(post.id) ? { ...item, ...nextPost, id: item.id } : item))
        : [nextPost, ...safePosts];
    };

    const globalPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
    const userKey = `testsite-posts-${String(user.email || user.username || 'anonymous').toLowerCase()}`;
    const savedUserPosts = JSON.parse(localStorage.getItem(userKey) || '[]');
    const draftKey = `testsite-drafts-${String(user.email || user.username || 'anonymous').toLowerCase()}`;
    const drafts = JSON.parse(localStorage.getItem(draftKey) || '[]');
    const nextGlobalPosts = updatePostsList(globalPosts);
    const nextUserPosts = updatePostsList(user.posts || []);
    const nextDrafts = updatePostsList(drafts);

    localStorage.setItem('testsite-posts', JSON.stringify(nextGlobalPosts));
    localStorage.setItem(userKey, JSON.stringify(nextUserPosts));
    localStorage.setItem(draftKey, JSON.stringify(nextDrafts));

    updateProfile({ posts: nextUserPosts });
    setQuickEditPostId(null);
  };

  return (
    <>
      <PageHeader title="Blog" subtitle="Browse the latest posts and explore author content." />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            {(categorySlug || tagSlug) && (
              <header className="rounded-3xl bg-white px-8 py-7 shadow-sm" style={{ borderRadius: '1.5rem' }}>
                <div className="text-sm uppercase tracking-[0.3em] text-slate-500">{categorySlug ? 'Category' : 'Tag'}</div>
                <h1 className="mt-2 text-4xl font-semibold text-slate-900">
                  {categorySlug
                    ? categories.find(([category]) => createPostSlug(category) === categorySlug)?.[0] || categorySlug
                    : tags.find(([tag]) => createPostSlug(tag) === tagSlug)?.[0] || tagSlug}
                </h1>
              </header>
            )}
            {displayPosts.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow-lg">No posts found for the selected filters.</div>
            )}
            {paginatedPosts.map((post) => (
              <article key={post.id} className="group relative overflow-hidden rounded-3xl bg-white shadow-lg">
                {(post.featuredImage || post.image) && (
                  <Link to={getPostUrl(post)} className="block">
                    <img src={post.featuredImage || post.image} alt={post.title} className="h-80 w-full object-cover transition duration-200 hover:brightness-95" />
                  </Link>
                )}
                <div className="p-8">
                  <h2 className="text-2xl font-semibold text-slate-900"><Link to={getPostUrl(post)} className="transition hover:text-emerald-600">{post.title}</Link></h2>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span><i className="fas fa-user mr-1"></i><Link to={getPostAuthorUrl(post, user)} className="hover:text-emerald-600">{post.author || 'Author'}</Link></span>
                    <span><i className="far fa-calendar mr-1"></i>{post.date}</span>
                    <Link to={`${getPostUrl(post)}#comments`} className="hover:text-emerald-600"><i className="far fa-comments mr-1"></i>{getCommentCount(post.id)} Comments</Link>
                  </div>
                  <p className="mt-4 line-clamp-2 text-slate-600">{getPostExcerpt(post)}</p>
                  <div className={`mt-3 flex items-center gap-1 text-xs select-none transition duration-200 ${canManagePost(post) ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                    {canManagePost(post) ? (
                      <>
                        <Link to={getEditPostUrl(post)} className="cursor-pointer text-[#22C55E] hover:underline">Edit</Link>
                        <span className="pointer-events-none text-slate-400">|</span>
                        <button type="button" onClick={() => beginQuickEdit(post)} className="cursor-pointer text-[#22C55E] hover:underline">Quick Edit</button>
                        <span className="pointer-events-none text-slate-400">|</span>
                        <button type="button" onClick={() => setTrashConfirmPostId(post.id)} className="cursor-pointer text-[#22C55E] hover:underline">Trash</button>
                        <span className="pointer-events-none text-slate-400">|</span>
                      </>
                    ) : null}
                    <Link to={getPostUrl(post)} className="cursor-pointer text-[#22C55E] hover:underline">View</Link>
                  </div>

                  {quickEditPostId === post.id && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Title
                            <input
                              type="text"
                              value={quickEditForm.title || ''}
                              onChange={(event) => setQuickEditForm((current) => ({ ...current, title: event.target.value }))}
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#22C55E]"
                            />
                          </label>
                          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Slug
                            <input
                              type="text"
                              value={quickEditForm.slug || ''}
                              onChange={(event) => setQuickEditForm((current) => ({ ...current, slug: event.target.value }))}
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#22C55E]"
                            />
                          </label>
                          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Date
                            <input
                              type="datetime-local"
                              value={quickEditForm.date || ''}
                              onChange={(event) => setQuickEditForm((current) => ({ ...current, date: event.target.value }))}
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#22C55E]"
                            />
                          </label>
                        </div>

                        <div className="space-y-3">
                          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Categories</span>
                          <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
                            {categories.map(([category]) => (
                              <label key={category} className="flex items-center gap-2 text-sm text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={quickEditForm.category === category}
                                  onChange={() => setQuickEditForm((current) => ({ ...current, category }))}
                                  className="green-checkbox"
                                />
                                <span>{category}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Tags
                            <input
                              type="text"
                              value={quickEditForm.tags || ''}
                              onChange={(event) => setQuickEditForm((current) => ({ ...current, tags: event.target.value }))}
                              placeholder="tag1, tag2"
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#22C55E]"
                            />
                          </label>
                          <label className="flex items-center gap-2 text-sm text-slate-600">
                            <input
                              type="checkbox"
                              checked={quickEditForm.allowComments !== false}
                              onChange={(event) => setQuickEditForm((current) => ({ ...current, allowComments: event.target.checked }))}
                              className="green-checkbox"
                            />
                            Allow Comments
                          </label>
                          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                            Status
                            <select
                              value={quickEditForm.status || 'published'}
                              onChange={(event) => setQuickEditForm((current) => ({ ...current, status: event.target.value }))}
                              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#22C55E]"
                            >
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end gap-3">
                        <button type="button" onClick={() => setQuickEditPostId(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                          Cancel
                        </button>
                        <button type="button" onClick={() => saveQuickEdit(post)} className="rounded-xl bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1fae58]">
                          Update
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setCurrentPage(number)}
                    className={`h-11 w-11 rounded-full text-sm font-semibold transition ${
                      number === currentPage
                        ? 'bg-[#22C55E] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="border-b border-slate-100 pb-6">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input id="search" type="search" value={searchTerm} onChange={handleSearchChange} placeholder="Search by title or author" className="w-full bg-transparent text-sm text-slate-900 outline-none" />
                <i className="fa-solid fa-magnifying-glass flex-shrink-0 text-slate-400" aria-hidden="true" />
              </div>
            </div>

            <div className="border-b border-slate-100 py-6">
              <h3 className="text-sm font-semibold text-slate-900">Categories</h3>
              <ul className="mt-5 space-y-3 text-slate-600">
                {categories.map(([category, count]) => (
                  <li key={category}>
                    <Link
                      to={`/blog/category/${createPostSlug(category)}`}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selectedCategories.includes(createPostSlug(category)) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
                    >
                      <span>{category}</span>
                      <span className={`text-xs font-semibold ${selectedCategories.includes(createPostSlug(category)) ? 'text-emerald-600' : 'text-slate-400'}`}>{count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {recentPosts.length > 0 && (
              <div className="border-b border-slate-100 py-6">
                <h3 className="text-sm font-semibold text-slate-900">Recent Posts</h3>
                <div className="mt-5 space-y-4">
                  {recentPosts.map((post) => (
                    <Link key={post.id} to={getPostUrl(post)} className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-slate-50">
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {(post.featuredImage || post.image) ? (
                          <img src={post.featuredImage || post.image} alt={post.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-400">
                            <i className="fas fa-image text-lg"></i>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-semibold text-slate-900 line-clamp-2">{post.title}</h4>
                        <p className="mt-2 text-sm text-slate-500">{post.date || 'No date'}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6">
              <h3 className="text-sm font-semibold text-slate-900">Tags</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {tags.map(([tag, count]) => (
                  <Link
                    key={tag}
                    to={`/blog/tag/${createPostSlug(tag)}`}
                    className={`rounded-full border px-4 py-2 text-sm transition ${selectedTags.includes(createPostSlug(tag)) || selectedTags.includes(tag) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-[#22C55E] hover:text-[#22C55E]'}`}
                  >
                    {tag} <span className="ml-1 text-xs">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
            </div>
          </aside>
        </div>
      </section>

      {trashConfirmPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Move post to trash?</h3>
            <p className="mt-4 text-slate-600">This post will be deleted and removed from your blog.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setTrashConfirmPostId(null)} className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmTrashDelete} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700">
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Blog;
