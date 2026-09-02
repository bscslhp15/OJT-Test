import { Link, useSearchParams } from 'react-router-dom';
import { useContext, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AuthContext from '../context/AuthContext';

const getPostExcerpt = (post) => {
  if (post.description || post.excerpt) return post.description || post.excerpt;

  if (typeof post.content !== 'string') return 'No description available';

  try {
    const parsed = JSON.parse(post.content);
    if (parsed && Array.isArray(parsed.blocks)) {
      const firstBlock = parsed.blocks.find((block) => block.type === 'paragraph' && block.data?.text)
        || parsed.blocks.find((block) => block.data?.text || block.data?.caption);
      const text = firstBlock
        ? (firstBlock.data?.text || firstBlock.data?.caption || '').replace(/\s+/g, ' ').trim()
        : '';
      return text ? text.substring(0, 150) : 'No description available';
    }
  } catch (error) {
    // Continue with the legacy HTML excerpt below.
  }

  const text = post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.substring(0, 150) : 'No description available';
};

const Blog = () => {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTags, setSelectedTags] = useState(() => {
    const tag = searchParams.get('tag');
    return tag ? [tag] : [];
  });
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;
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
  const mergedPosts = [...globalPostsEnriched, ...userPostsEnriched.filter((post) => !globalPostsEnriched.some((item) => String(item.id) === String(post.id)))];
  const categoryData = mergedPosts.reduce((categoriesByName, post) => {
    const category = post.category || 'General';
    categoriesByName[category] = (categoriesByName[category] || 0) + 1;
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
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(post.category || 'General');
    const postTags = Array.isArray(post.tags) ? post.tags : [];
    const matchesTag = selectedTags.length === 0 || selectedTags.some((tag) => postTags.includes(tag));
    const searchableText = `${post.title || ''} ${post.author || ''} ${getPostExcerpt(post)}`.toLowerCase();
    const matchesSearch = !searchTerm.trim() || searchableText.includes(searchTerm.trim().toLowerCase());
    return matchesCategory && matchesTag && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(displayPosts.length / postsPerPage));
  const paginatedPosts = displayPosts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);
  const recentPosts = displayPosts.slice(0, 3);

  const toggleCategory = (category) => {
    setCurrentPage(1);
    setSelectedCategories((activeCategories) => activeCategories.includes(category)
      ? activeCategories.filter((activeCategory) => activeCategory !== category)
      : [...activeCategories, category]);
  };

  const toggleTag = (tag) => {
    setCurrentPage(1);
    setSelectedTags((activeTags) => activeTags.includes(tag)
      ? activeTags.filter((activeTag) => activeTag !== tag)
      : [...activeTags, tag]);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const getCommentCount = (postId) => {
    try {
      const savedComments = JSON.parse(localStorage.getItem(`testsite-comments-${postId}`) || '[]');
      return Array.isArray(savedComments) ? savedComments.length : 0;
    } catch (error) {
      return 0;
    }
  };

  return (
    <>
      <PageHeader title="Blog" subtitle="Browse the latest posts and explore author content." />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            {displayPosts.length === 0 && (
              <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow-lg">No posts found for the selected filters.</div>
            )}
            {paginatedPosts.map((post) => (
              <article key={post.id} className="overflow-hidden bg-white shadow-lg">
                {(post.featuredImage || post.image) && (
                  <img src={post.featuredImage || post.image} alt={post.title} className="h-80 w-full object-cover" />
                )}
                <div className="p-8">
                  <h2 className="text-2xl font-semibold text-slate-900">{post.title}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span><i className="fas fa-user mr-1"></i>{post.author || 'Author'}</span>
                    <span><i className="far fa-calendar mr-1"></i>{post.date}</span>
                    <span><i className="far fa-comments mr-1"></i>{getCommentCount(post.id)} Comments</span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-slate-600">{getPostExcerpt(post)}</p>
                  <div className="mt-6 flex items-center justify-end gap-4">
                    <Link to={`/blog/${post.id}`} className="rounded-full bg-[#22C55E] px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      Read More
                    </Link>
                  </div>
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
                <i className="fa-solid fa-magnifying-glass text-slate-400" aria-hidden="true" />
                <input id="search" type="search" value={searchTerm} onChange={handleSearchChange} placeholder="Search by title or author" className="w-full bg-transparent text-sm text-slate-900 outline-none" />
              </div>
            </div>

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

            {recentPosts.length > 0 && (
              <div className="border-b border-slate-100 py-6">
                <h3 className="text-lg font-semibold text-slate-900">Recent Posts</h3>
                <div className="mt-5 space-y-4">
                  {recentPosts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.id}`} className="flex items-center gap-4 rounded-xl p-2 transition hover:bg-slate-50">
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
              <h3 className="text-lg font-semibold text-slate-900">Tags</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                {tags.map(([tag, count]) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={selectedTags.includes(tag)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${selectedTags.includes(tag) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-600 hover:border-[#22C55E] hover:text-[#22C55E]'}`}
                  >
                    {tag} <span className="ml-1 text-xs">{count}</span>
                  </button>
                ))}
              </div>
            </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
};

export default Blog;
