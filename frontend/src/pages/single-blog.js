import { useParams, Link, useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import PageHeader from '../components/page-header';
import AuthContext from '../context/auth-context';

const defaultProfile = '/images/default-profile.jpg';

const renderPostContent = (content) => {
  try {
    const parsed = JSON.parse(content || '');
    if (parsed && Array.isArray(parsed.blocks)) {
      return parsed.blocks.map((block, index) => {
        const key = block.id || `${block.type}-${index}`;
        const text = block.data?.text || '';
        if (block.type === 'header') return <h2 key={key} className="mt-8 text-2xl font-semibold text-slate-900 first:mt-0">{text}</h2>;
        if (block.type === 'quote') return <blockquote key={key} className="my-6 border-l-4 border-emerald-500 pl-5 text-lg italic text-slate-600">{text}</blockquote>;
        if (block.type === 'list') return <ul key={key} className="my-5 list-disc space-y-2 pl-6">{text.split('\n').filter(Boolean).map((item, itemIndex) => <li key={`${key}-${itemIndex}`}>{item}</li>)}</ul>;
        if (block.type === 'image' && block.data?.url) return <figure key={key} className="my-8"><img src={block.data.url} alt={block.data.caption || 'Post image'} className="w-full object-cover" /></figure>;
        return <p key={key} className="my-5 whitespace-pre-line">{text}</p>;
      });
    }
  } catch (error) {
    // Render legacy HTML posts below.
  }

  return <div dangerouslySetInnerHTML={{ __html: content || '' }} />;
};

const SingleBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, deletePost } = useContext(AuthContext);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [comments, setComments] = useState(() => JSON.parse(localStorage.getItem(`testsite-comments-${id}`) || '[]'));
  const [commentName, setCommentName] = useState('');
  const [commentEmail, setCommentEmail] = useState('');
  const [commentWebsite, setCommentWebsite] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    setCommentName(user?.confirmed ? (user.username || '') : '');
  }, [user]);

  const globalPosts = JSON.parse(localStorage.getItem('testsite-posts') || '[]');
  const userPosts = Array.isArray(user?.posts) ? user.posts : [];
  
  const enrichPost = (post) => {
    if (post.author && post.author.trim()) return post;
    if (post.authorId && post.authorId.trim()) {
      const authorId = post.authorId;
      if (authorId.includes('@')) {
        return { ...post, author: authorId.split('@')[0] };
      }
      return { ...post, author: authorId };
    }
    return { ...post, author: 'Author' };
  };
  
  const globalPostsEnriched = globalPosts.map(enrichPost);
  const userPostsEnriched = userPosts.map(enrichPost);
  const allPosts = [...globalPostsEnriched, ...userPostsEnriched.filter((post) => !globalPostsEnriched.some((item) => String(item.id) === String(post.id)))];
  const post = allPosts.find((p) => String(p.id) === String(id));

  const handleDeletePost = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePost = () => {
    deletePost(post.id);
    setIsDeleteModalOpen(false);
    navigate('/blog');
  };

  if (!post) {
    return (
      <>
        <PageHeader title="Blog Post" subtitle="Post not found." />
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-white p-10 shadow-xl text-center">
            <h2 className="text-2xl font-semibold text-slate-900">Post Not Found</h2>
            <p className="mt-4 text-slate-600">The blog post you're looking for doesn't exist.</p>
            <Link to="/blog" className="mt-6 inline-flex rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
              Back to Blog
            </Link>
          </div>
        </section>
      </>
    );
  }

  const categoryData = allPosts.reduce((categoriesByName, item) => {
    const category = item.category || 'General';
    categoriesByName[category] = (categoriesByName[category] || 0) + 1;
    return categoriesByName;
  }, {});
  const categories = Object.entries(categoryData);
  const filteredPosts = selectedCategories.length === 0
    ? allPosts
    : allPosts.filter((item) => selectedCategories.includes(item.category || 'General'));
  const recentPosts = filteredPosts.slice(0, 3);
  const allTags = post.tags || [];

  const toggleCategory = (category) => {
    setSelectedCategories((activeCategories) => activeCategories.includes(category)
      ? activeCategories.filter((activeCategory) => activeCategory !== category)
      : [...activeCategories, category]);
  };

  const normalizeText = (value) => String(value || '').trim().toLowerCase();
  const currentUserFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  const currentUserCandidates = [
    user?.email,
    user?.username,
    currentUserFullName,
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    `${user?.lastName || ''} ${user?.firstName || ''}`.trim()
  ]
    .map(normalizeText)
    .filter(Boolean);

  const postAuthorCandidates = [
    post.authorId,
    post.author,
    user?.email,
    user?.username,
    currentUserFullName,
    user?.firstName,
    user?.lastName
  ]
    .map(normalizeText)
    .filter(Boolean);

  const isAuthor = !!user && (
    (post.authorUserId && String(post.authorUserId) === String(user.id)) ||
    (post.authorId && normalizeText(post.authorId) === normalizeText(user.email))
  );
  const isCurrentUserPost = isAuthor || (!!user && normalizeText(post.author) === normalizeText(user.username));
  const storedAuthorPhoto = post.authorId && post.authorId.includes('@')
    ? localStorage.getItem(`testsite-profile-${post.authorId.toLowerCase()}`)
    : null;
  const storedAuthorUser = post.authorId && post.authorId.includes('@')
    ? JSON.parse(localStorage.getItem(`testsite-user-persist-${post.authorId.toLowerCase()}`) || 'null')
    : null;
  const authorProfilePhoto = isCurrentUserPost
    ? (user?.profile_photo || (user?.email ? localStorage.getItem(`testsite-profile-${user.email.toLowerCase()}`) : null))
    : (post.authorAvatar || storedAuthorPhoto || defaultProfile);
  const authorSocial = {
    ...(storedAuthorUser?.social || {}),
    ...(post.authorSocial || {}),
    ...(isCurrentUserPost ? (user?.social || {}) : {})
  };
  const authorBio = post.authorBio || storedAuthorUser?.bio || (isCurrentUserPost ? user?.bio : '') || '';
  const socialLinks = [
    { name: 'Facebook', icon: 'fa-facebook', value: authorSocial.facebook },
    { name: 'Instagram', icon: 'fa-instagram', value: authorSocial.instagram },
    { name: 'Twitter', icon: 'fa-twitter', value: authorSocial.twitter },
    { name: 'LinkedIn', icon: 'fa-linkedin', value: authorSocial.linkedin }
  ].filter((link) => link.value);

  const createComment = (text, email = '', website = '', parentId = null) => {
    if (!text.trim()) return null;

    const guestNumber = String(Math.floor(10000000 + Math.random() * 90000000));
    const authorName = user?.confirmed ? (user.username || user.email?.split('@')[0] || 'User') : `Guests ${guestNumber}`;
    return {
      id: Date.now() + Math.random(),
      name: authorName,
      text: text.trim(),
      date: new Date().toLocaleDateString(),
      email: user?.email || email.trim(),
      website: website.trim(),
      avatar: user?.profile_photo || defaultProfile,
      isGuest: !user,
      parentId
    };
  };

  const handleCommentSubmit = (event) => {
    event.preventDefault();
    const newComment = createComment(commentText, commentEmail, commentWebsite);
    if (!newComment) return;
    const nextComments = [...comments, newComment];
    setComments(nextComments);
    localStorage.setItem(`testsite-comments-${id}`, JSON.stringify(nextComments));
    setCommentEmail('');
    setCommentWebsite('');
    setCommentText('');
  };

  const handleReplySubmit = (event, parentId) => {
    event.preventDefault();
    const newReply = createComment(replyText, '', '', parentId);
    if (!newReply) return;
    const nextComments = [...comments, newReply];
    setComments(nextComments);
    localStorage.setItem(`testsite-comments-${id}`, JSON.stringify(nextComments));
    setReplyText('');
    setReplyTo(null);
  };

  const getCommentAvatar = (comment) => {
    const currentProfilePhoto = user?.profile_photo || (user?.email ? localStorage.getItem(`testsite-profile-${user.email.toLowerCase()}`) : null);
    const belongsToCurrentUser = user && (
      (comment.email && user.email && comment.email.toLowerCase() === user.email.toLowerCase()) ||
      (comment.name && user.username && comment.name === user.username)
    );

    return belongsToCurrentUser ? (currentProfilePhoto || defaultProfile) : (comment.avatar || defaultProfile);
  };

  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`flex gap-4 border-b border-slate-100 pb-5 last:border-0 ${isReply ? 'ml-10 pt-4' : ''}`}>
      <img src={getCommentAvatar(comment)} alt="Comment author" className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <strong className="text-sm text-slate-900">{comment.name || 'Guests 00000000'}</strong>
          <button type="button" onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="text-xs font-semibold text-slate-500 hover:text-emerald-600">Reply</button>
        </div>
        <div className="mt-1 text-xs text-slate-400">{comment.date}</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">{comment.text}</p>
        {replyTo === comment.id && (
          user && !user.confirmed ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Please confirm your account before replying.</p>
          ) : (
            <form onSubmit={(event) => handleReplySubmit(event, comment.id)} className="mt-4 space-y-3">
              <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Write your reply *" className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" required />
              <div className="flex gap-3">
                <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Post Reply</button>
                <button type="button" onClick={() => { setReplyTo(null); setReplyText(''); }} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          )
        )}
        {comments.filter((reply) => String(reply.parentId) === String(comment.id)).map((reply) => renderComment(reply, true))}
      </div>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Blog Single"
        breadcrumbs={[
          { label: 'Home', to: '/' },
          { label: 'Blog', to: '/blog' },
          { label: 'Single Blog' }
        ]}
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top Action Bar */}
        <div className="mb-8 flex items-center justify-between">
            <Link to="/blog" className="text-sm font-semibold !text-[#22C55E] hover:!text-[#22C55E] focus:!text-[#22C55E] active:!text-[#22C55E]">
            ← Back to Blog
          </Link>

          {isAuthor && (
            <div className="flex gap-3">
              <Link
                to={`/edit-post/${post.id}`}
                className="rounded-lg bg-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Edit Post
              </Link>
              <button
                onClick={handleDeletePost}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main column */}
          <main className="lg:col-span-8">
            <div className="mb-6 overflow-hidden bg-white shadow">
              {(post.featuredImage || post.image) && (
                <img src={post.featuredImage || post.image} alt={post.title} className="w-full object-cover" style={{ height: 440 }} />
              )}
              <div className="p-8">
                <div className="text-sm uppercase tracking-[0.3em] text-emerald-600">{post.category || 'General'}</div>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900">{post.title}</h1>
                <div className="mt-3 text-sm text-slate-600">By {post.author || 'Author'}</div>
                <div className="mt-6 prose prose-sm max-w-none text-slate-700 leading-7">{renderPostContent(post.content)}</div>
              </div>
            </div>

            {/* Author box */}
            <div className="mb-8 rounded-2xl bg-white p-6 shadow">
              <div className="flex items-center gap-5">
                {authorProfilePhoto ? (
                  <img src={authorProfilePhoto} alt="Author profile" className="h-24 w-24 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-2xl font-semibold text-white">
                    {(post.author || user?.firstName || user?.username || 'A')[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold text-slate-900">{post.author || 'Author'}</div>
                  {socialLinks.length > 0 && (
                    <div className="mt-1 flex items-center gap-3 text-slate-500">
                      {socialLinks.map((link) => (
                        <a key={link.name} href={link.value.startsWith('http') ? link.value : `https://${link.value}`} target="_blank" rel="noreferrer" aria-label={link.name} className="transition hover:text-emerald-600">
                          <i className={`fab ${link.icon} text-base`} />
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-slate-600 italic">{authorBio || 'No bio provided.'}</p>
                </div>
              </div>
            </div>

            <div className="mb-8 rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">Comments</h2>
              <div className="mt-5 space-y-4">
                {comments.length === 0 && <p className="text-sm text-slate-500">No comments yet.</p>}
                {comments.filter((comment) => !comment.parentId).map((comment) => renderComment(comment))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow">
              <h2 className="text-xl font-semibold text-slate-900">Leave a Reply</h2>
              <p className="mt-2 text-sm text-slate-500">Your email address will not be published. Required fields are marked *</p>
              {user && !user.confirmed ? (
                <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Please confirm your account before commenting. Commenting is disabled until confirmation.</p>
              ) : (
                <form onSubmit={handleCommentSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {!user && <input value={commentName} onChange={(event) => setCommentName(event.target.value)} placeholder="Your Name *" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" required />}
                    {!user && <input type="email" value={commentEmail} onChange={(event) => setCommentEmail(event.target.value)} placeholder="Your Email *" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" required />}
                  </div>
                  {!user && <input value={commentWebsite} onChange={(event) => setCommentWebsite(event.target.value)} placeholder="Your Website" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" />}
                  <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Your Comment *" className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm" required />
                  <button type="submit" className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Post Comment</button>
                </form>
              )}
            </div>
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
            {/* Search */}
            <div className="border-b border-slate-100 pb-6">
              <label htmlFor="search" className="sr-only">Search</label>
              <form onSubmit={(event) => { event.preventDefault(); const query = event.currentTarget.elements.search.value.trim(); navigate(query ? `/blog?search=${encodeURIComponent(query)}` : '/blog'); }} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <i className="fa-solid fa-magnifying-glass text-slate-400" aria-hidden="true" />
                <input id="search" name="search" type="search" placeholder="Search posts" className="w-full bg-transparent text-sm text-slate-900 outline-none" />
                <button type="submit" aria-label="Search posts" className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#22C55E] text-white transition hover:bg-emerald-700">
                  <i className="fa-solid fa-magnifying-glass text-xs" aria-hidden="true" />
                </button>
              </form>
            </div>

            {/* Categories */}
            <div className="border-b border-slate-100 py-6">
              <h3 className="text-lg font-semibold text-slate-900">Categories</h3>
              <ul className="mt-5 space-y-3 text-slate-600">
                {categories.map(([category, count]) => (
                  <li key={category}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      aria-pressed={selectedCategories.includes(category)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${selectedCategories.includes(category) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'}`}
                    >
                      <span>{category}</span>
                      <span className={`text-xs font-semibold ${selectedCategories.includes(category) ? 'text-emerald-600' : 'text-slate-400'}`}>{count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
              <div className="border-b border-slate-100 py-6">
                <h3 className="text-lg font-semibold text-slate-900">Recent Posts</h3>
                <div className="mt-5 space-y-4">
                  {recentPosts.map((recentPost) => (
                    <Link key={recentPost.id} to={`/blog/${recentPost.id}`} className="flex gap-4 rounded-lg hover:bg-slate-50 p-2 transition">
                      <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100">
                        {(recentPost.featuredImage || recentPost.image) ? (
                          <img src={recentPost.featuredImage || recentPost.image} alt={recentPost.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400">
                            <i className="fas fa-image text-lg"></i>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-2">{recentPost.title}</h4>
                        <p className="mt-1 text-xs text-slate-500">{recentPost.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="pt-6">
                <h3 className="text-lg font-semibold text-slate-900">Tags</h3>
                <div className="mt-5 flex flex-wrap gap-3">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => navigate(`/blog?tag=${encodeURIComponent(tag)}`)}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-emerald-600 hover:text-emerald-600"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            </div>
          </aside>
        </div>
      </section>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Delete this post?</h3>
            <p className="mt-3 text-sm text-slate-600">
              This action cannot be undone. The blog post will be removed permanently.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeletePost}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleBlog;
