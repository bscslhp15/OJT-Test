import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createComment, fetchComments, moderateComment, updateComment } from '../services/api';
import AuthContext from '../context/auth-context';
import { loadPublicPosts } from '../services/public-data';
import { getEditPostUrl, getPostUrl } from '../services/post-url';

const commentDate = (comment) => {
  const date = new Date(comment.created_at || comment.createdAt || comment.date || '');
  return Number.isNaN(date.getTime())
    ? comment.date || '—'
    : date.toLocaleString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: '2-digit' });
};

const getLocalComments = (post) => {
  try {
    const comments = JSON.parse(localStorage.getItem(`testsite-comments-${post.id}`) || '[]');
    if (!Array.isArray(comments)) return [];
    const idMap = new Map(comments.map((comment, index) => [
      String(comment?.id ?? index),
      `local-${post.id}-${index}`
    ]));

    return comments.filter((comment) => comment && typeof comment === 'object' && (comment.text || comment.content)).map((comment, index) => ({
      ...comment,
      id: idMap.get(String(comment.id ?? index)),
      post_id: comment.post_id ?? comment.postId ?? post.id,
      parentId: idMap.get(String(comment.parentId ?? comment.parent_id)) || comment.parentId || comment.parent_id || null,
      name: comment.name || comment.author_name || 'Guest',
      email: comment.email || comment.author_email || '',
      website: comment.website || '',
      avatar: comment.avatar || comment.author_avatar || '',
      text: comment.text || comment.content,
      date: comment.date || comment.created_at || comment.createdAt || '',
      status: comment.status || 'local',
      localOnly: true
    }));
  } catch (error) {
    return [];
  }
};

const AdminComments = () => {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [comments, setComments] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState([]);
  const [moderatingId, setModeratingId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [quickEditId, setQuickEditId] = useState(null);
  const [quickEditForm, setQuickEditForm] = useState({ name: '', email: '', website: '', text: '' });
  const [savingComment, setSavingComment] = useState(false);
  const postId = searchParams.get('post');

  useEffect(() => {
    let isMounted = true;
    const authKey = user?.authKey || user?.auth_key;
    Promise.all([fetchComments(undefined, authKey, true), loadPublicPosts()])
      .then(([commentResponse, loadedPosts]) => {
        if (!isMounted) return;
        const remoteComments = Array.isArray(commentResponse.data) ? commentResponse.data : [];
        const safePosts = Array.isArray(loadedPosts) ? loadedPosts : [];
        const remoteFingerprints = new Set(remoteComments.map((comment) => [
          String(comment.post_id ?? comment.postId ?? ''),
          String(comment.email || comment.author_email || comment.name || comment.author_name || '').toLowerCase(),
          String(comment.text || comment.content || '').trim()
        ].join('|')));
        const localComments = safePosts.flatMap(getLocalComments).filter((comment) => !remoteComments.some((remote) => (
          String(remote.id) === String(comment.id)
          || remoteFingerprints.has([
            String(comment.post_id ?? comment.postId ?? ''),
            String(comment.email || comment.author_email || comment.name || comment.author_name || '').toLowerCase(),
            String(comment.text || comment.content || '').trim()
          ].join('|'))
        )));
        setComments([...remoteComments, ...localComments]);
        setPosts(safePosts);
      })
      .catch(() => {
        if (isMounted) setError('Could not load comments. Please try again.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [user?.authKey, user?.auth_key]);

  const selectedPost = !postId
    ? null
    : posts.find((post) => String(post.id) === String(postId));
  const postComments = postId
    ? comments.filter((comment) => String(comment.post_id ?? comment.postId) === String(postId))
    : comments;
  const parentComments = new Map(comments.map((comment) => [String(comment.id), comment]));
  const activeComments = postComments.filter((comment) => !['spam', 'trash'].includes(comment.status));
  const commentCounts = {
    all: activeComments.length,
    mine: activeComments.filter((comment) => String(comment.email || '').toLowerCase() === String(user?.email || '').toLowerCase()).length,
    pending: postComments.filter((comment) => comment.status === 'pending').length,
    approved: postComments.filter((comment) => (comment.status || 'approved') === 'approved').length,
    spam: postComments.filter((comment) => comment.status === 'spam').length,
    trash: postComments.filter((comment) => comment.status === 'trash').length
  };

  const visibleComments = useMemo(() => postComments.filter((comment) => {
    if ((statusFilter === 'all' || statusFilter === 'mine') && ['spam', 'trash'].includes(comment.status)) return false;
    if (statusFilter === 'mine' && String(comment.email || '').toLowerCase() !== String(user?.email || '').toLowerCase()) return false;
    if (statusFilter === 'pending' && comment.status !== 'pending') return false;
    if (statusFilter === 'approved' && (comment.status || 'approved') !== 'approved') return false;
    if (statusFilter === 'spam' && comment.status !== 'spam') return false;
    if (statusFilter === 'trash' && comment.status !== 'trash') return false;
    if (typeFilter === 'comments' && !comment.text) return false;
    const post = posts.find((item) => String(item.id) === String(comment.post_id ?? comment.postId));
    const searchable = [comment.name, comment.email, comment.website, comment.text, post?.title].join(' ').toLowerCase();
    return searchable.includes(searchQuery.toLowerCase());
  }), [postComments, posts, searchQuery, statusFilter, typeFilter, user?.email]);
  const allSelected = visibleComments.length > 0 && visibleComments.every((comment) => selectedIds.includes(String(comment.id)));
  const statusTabs = [
    ['all', 'All'],
    ['mine', 'Mine'],
    ['pending', 'Pending'],
    ['approved', 'Approved'],
    ['spam', 'Spam'],
    ['trash', 'Trash']
  ];

  const toggleAll = (checked) => {
    setSelectedIds((current) => checked
      ? [...new Set([...current, ...visibleComments.map((comment) => String(comment.id))])]
      : current.filter((id) => !visibleComments.some((comment) => String(comment.id) === id)));
  };

  const changeCommentStatus = async (comment, action) => {
    const authKey = user?.authKey || user?.auth_key;
    if (!authKey) {
      setError('Your admin session is missing. Please sign in again.');
      return;
    }
    if (action === 'delete-permanently' && !window.confirm('Permanently delete this comment and its replies? This cannot be undone.')) return;
    setModeratingId(String(comment.id));
    setError('');
    try {
      const { data } = await moderateComment(authKey, { commentId: comment.id, action });
      if (data.deleted) {
        setComments((current) => current.filter((item) => String(item.id) !== String(data.id)));
      } else {
        setComments((current) => current.map((item) => String(item.id) === String(data.id)
          ? { ...item, status: data.status, previousStatus: data.previousStatus }
          : item));
      }
      setSelectedIds((current) => current.filter((id) => id !== String(comment.id)));
    } catch (moderationError) {
      setError(moderationError.response?.data?.message || 'Could not update this comment. Please try again.');
    } finally {
      setModeratingId(null);
    }
  };

  const handleReplySubmit = async (event, comment) => {
    event.preventDefault();
    const authKey = user?.authKey || user?.auth_key;
    if (!authKey || !replyText.trim()) return;
    setSavingComment(true);
    setError('');
    try {
      const { data } = await createComment({
        post_id: comment.post_id ?? comment.postId,
        parent_id: comment.id,
        content: replyText.trim(),
        authKey
      });
      setComments((current) => [...current, data]);
      setReplyText('');
      setReplyTo(null);
    } catch (replyError) {
      setError(replyError.response?.data?.message || 'Could not post this reply. Please try again.');
    } finally {
      setSavingComment(false);
    }
  };

  const handleQuickEditSubmit = async (event, comment) => {
    event.preventDefault();
    const authKey = user?.authKey || user?.auth_key;
    if (!authKey) return;
    setSavingComment(true);
    setError('');
    try {
      const { data } = await updateComment(comment.id, authKey, quickEditForm);
      setComments((current) => current.map((item) => String(item.id) === String(data.id) ? { ...item, ...data } : item));
      setQuickEditId(null);
    } catch (editError) {
      setError(editError.response?.data?.message || 'Could not update this comment. Please try again.');
    } finally {
      setSavingComment(false);
    }
  };

  return (
    <main className="min-h-full bg-[#F7FAF7] px-4 py-6 text-[#1E1E1E] md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-normal">Comments{selectedPost ? <> on “<Link to={getEditPostUrl(selectedPost)} className="text-[#3858E9] underline decoration-1 underline-offset-2 hover:text-[#2145E6]">{selectedPost.title}</Link>”</> : ''}</h1>
            {selectedPost && <Link to={getPostUrl(selectedPost)} className="text-sm text-[#2271B1] hover:underline">View Post</Link>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#69736A]">
            {statusTabs.map(([value, label], index) => (
              <span key={value} className="contents">
                {index > 0 && <span aria-hidden="true">|</span>}
                <button type="button" onClick={() => setStatusFilter(value)} className={statusFilter === value ? 'font-semibold text-[#1E1E1E]' : 'text-[#2271B1] hover:text-[#16803C]'}>
                  {label} ({commentCounts[value]})
                </button>
              </span>
            ))}
          </div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); setSearchQuery(searchInput.trim()); }} className="flex w-full gap-2 sm:w-auto">
          <label htmlFor="admin-comment-search" className="sr-only">Search comments</label>
          <input id="admin-comment-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-9 min-w-0 flex-1 rounded-xl border border-[#B8C0B8] bg-white px-3 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E] sm:w-52" />
          <button type="submit" className="h-9 shrink-0 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Search Comments</button>
        </form>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="comment-bulk-actions">Bulk actions</label>
          <select id="comment-bulk-actions" defaultValue="" className="h-9 min-w-32 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]">
            <option value="">Bulk actions</option>
            <option value="unapprove">Unapprove</option>
            <option value="spam">Mark as spam</option>
            <option value="trash">Move to Trash</option>
          </select>
          <button type="button" className="h-9 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Apply</button>
          <label className="sr-only" htmlFor="comment-type-filter">Comment type</label>
          <select id="comment-type-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-9 min-w-40 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]">
            <option value="all">All comment types</option>
            <option value="comments">Comments</option>
          </select>
        </div>
        <span className="text-xs text-[#69736A]">{visibleComments.length} {visibleComments.length === 1 ? 'item' : 'items'}</span>
      </div>

      <div className="mt-2 overflow-x-auto rounded-2xl border border-[#C8D0C8] bg-white">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="text-[#384238]">
            <tr className="border-b border-[#C8D0C8]">
              <th className="w-10 px-3 py-3"><input type="checkbox" aria-label="Select all comments" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} className="green-checkbox" /></th>
              <th className="w-[24%] px-3 py-3 font-medium">Author</th>
              <th className="px-3 py-3 font-medium">Comment</th>
              <th className="w-[18%] px-3 py-3 font-medium">In response to</th>
              <th className="w-[18%] px-3 py-3 font-medium">Submitted on</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[#69736A]">Loading comments...</td></tr>
            ) : visibleComments.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[#69736A]">No comments found.</td></tr>
            ) : visibleComments.map((comment, index) => {
              const parent = comment.parentId ? parentComments.get(String(comment.parentId)) : null;
              const post = posts.find((item) => String(item.id) === String(comment.post_id ?? comment.postId));
              if (quickEditId === String(comment.id)) {
                return (
                  <tr key={comment.id} className="border-b border-[#DCE5DC] bg-[#F7FAF7]">
                    <td colSpan={5} className="p-3 md:p-4">
                      <form onSubmit={(event) => handleQuickEditSubmit(event, comment)} className="rounded-lg border border-[#C8D0C8] bg-white p-3 min-[360px]:p-4">
                        <h2 className="mb-3 text-sm font-semibold text-[#1E1E1E]">Quick Edit Comment</h2>
                        <textarea required value={quickEditForm.text} onChange={(event) => setQuickEditForm((current) => ({ ...current, text: event.target.value }))} className="min-h-24 w-full rounded-md border border-[#B8C0B8] px-2 py-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          <label className="min-w-0 text-xs text-[#526052]">Name<input value={quickEditForm.name} onChange={(event) => setQuickEditForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 h-9 w-full min-w-0 rounded-md border border-[#B8C0B8] px-2 text-sm" /></label>
                          <label className="min-w-0 text-xs text-[#526052]">Email<input type="email" value={quickEditForm.email} onChange={(event) => setQuickEditForm((current) => ({ ...current, email: event.target.value }))} className="mt-1 h-9 w-full min-w-0 rounded-md border border-[#B8C0B8] px-2 text-sm" /></label>
                          <label className="min-w-0 text-xs text-[#526052]">URL<input value={quickEditForm.website} onChange={(event) => setQuickEditForm((current) => ({ ...current, website: event.target.value }))} className="mt-1 h-9 w-full min-w-0 rounded-md border border-[#B8C0B8] px-2 text-sm" /></label>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="submit" disabled={savingComment} className="h-9 rounded-md bg-[#3858e9] px-4 text-sm font-semibold text-white hover:bg-[#2145e6] disabled:opacity-60">{savingComment ? 'Saving...' : 'Update Comment'}</button>
                          <button type="button" onClick={() => setQuickEditId(null)} className="h-9 rounded-md border border-[#3858e9] px-4 text-sm font-semibold text-[#3858e9]">Cancel</button>
                        </div>
                      </form>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={comment.id} className={`group border-b border-[#DCE5DC] align-top ${comment.status === 'pending' ? 'border-l-4 border-l-red-500 bg-[#FFFBEA]' : comment.status === 'spam' ? 'bg-[#FFF4F1]' : comment.status === 'trash' ? 'bg-[#F2F2F2] text-[#69736A]' : index % 2 ? 'bg-[#F7FAF7]' : 'bg-white'} hover:bg-[#F0F8F0]`}>
                  <td className="px-3 py-3"><input type="checkbox" aria-label={`Select comment by ${comment.name || 'guest'}`} checked={selectedIds.includes(String(comment.id))} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, String(comment.id)])] : current.filter((id) => id !== String(comment.id)))} className="green-checkbox" /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <img src={comment.avatar || '/images/default-profile.jpg'} alt="" className="h-9 w-9 shrink-0 rounded object-cover" />
                      <div className="min-w-0 break-words text-xs [overflow-wrap:anywhere]">
                        <div className="font-semibold text-[#2271B1]">{comment.name || 'Guest'}</div>
                        {comment.website && <div className="mt-1 text-[#2271B1]">{comment.website}</div>}
                        {comment.email && <div className="mt-1 text-[#2271B1]">{comment.email}</div>}
                        {post && <Link to={`${getPostUrl(post)}#comment-${comment.id}`} className="mt-1 block break-all text-[#2271B1] hover:underline">{window.location.origin}{getPostUrl(post)}</Link>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {parent && <div className="mb-1 text-xs text-[#69736A]">In reply to <Link to={`${getPostUrl(post || {})}#comment-${parent.id}`} className="text-[#2271B1] hover:underline">{parent.name || 'Comment'}</Link>.</div>}
                    <p className="break-words text-sm leading-5 text-[#384238] [overflow-wrap:anywhere]">{comment.text}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-1 text-xs text-[#16803C] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      {comment.localOnly ? (
                        <span className="text-[#69736A]">Local only; not saved to the server.</span>
                      ) : comment.status === 'spam' ? (
                        <>
                          <button type="button" disabled={moderatingId === String(comment.id)} onClick={() => changeCommentStatus(comment, 'not-spam')} className="hover:underline disabled:opacity-50">{moderatingId === String(comment.id) ? 'Saving...' : 'Not Spam'}</button><span aria-hidden="true" className="text-[#8A948A]">|</span>
                          <button type="button" onClick={() => changeCommentStatus(comment, 'delete-permanently')} className="text-red-600 hover:underline">Delete Permanently</button>
                        </>
                      ) : comment.status === 'trash' ? (
                        <>
                          <button type="button" disabled={moderatingId === String(comment.id)} onClick={() => changeCommentStatus(comment, 'spam')} className="hover:underline disabled:opacity-50">Spam</button><span aria-hidden="true" className="text-[#8A948A]">|</span>
                          <button type="button" disabled={moderatingId === String(comment.id)} onClick={() => changeCommentStatus(comment, 'restore')} className="hover:underline disabled:opacity-50">Restore</button><span aria-hidden="true" className="text-[#8A948A]">|</span>
                          <button type="button" onClick={() => changeCommentStatus(comment, 'delete-permanently')} className="text-red-600 hover:underline">Delete Permanently</button>
                        </>
                      ) : (
                        <>
                          <button type="button" disabled={moderatingId === String(comment.id)} onClick={() => changeCommentStatus(comment, comment.status === 'pending' ? 'approve' : 'unapprove')} className="hover:underline disabled:opacity-50">
                            {moderatingId === String(comment.id) ? 'Saving...' : comment.status === 'pending' ? 'Approve' : 'Unapprove'}
                          </button><span aria-hidden="true" className="text-[#8A948A]">|</span>
                          <button type="button" onClick={() => { setReplyTo(replyTo === String(comment.id) ? null : String(comment.id)); setReplyText(''); }} className="hover:underline">Reply</button><span aria-hidden="true" className="text-[#8A948A]">|</span>
                          <button type="button" onClick={() => { setQuickEditId(String(comment.id)); setQuickEditForm({ name: comment.name || '', email: comment.email || '', website: post ? `${window.location.origin}${getPostUrl(post)}` : comment.website || '', text: comment.text || '' }); }} className="hover:underline">Quick Edit</button><span aria-hidden="true" className="text-[#8A948A]">|</span>
                          <Link to={`/testsite/admin/comments/${comment.id}/edit`} className="hover:underline">Edit</Link><span aria-hidden="true" className="text-[#8A948A]">|</span>
                          <button type="button" disabled={moderatingId === String(comment.id)} onClick={() => changeCommentStatus(comment, 'spam')} className="hover:underline disabled:opacity-50">Spam</button><span aria-hidden="true" className="text-[#8A948A]">|</span>
                          <button type="button" disabled={moderatingId === String(comment.id)} onClick={() => changeCommentStatus(comment, 'trash')} className="text-red-600 hover:underline disabled:opacity-50">Trash</button>
                        </>
                      )}
                    </div>
                    {replyTo === String(comment.id) && (
                      <form onSubmit={(event) => handleReplySubmit(event, comment)} className="mt-3 space-y-2">
                        <textarea autoFocus required value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Write a reply..." className="min-h-24 w-full rounded-md border border-[#B8C0B8] px-3 py-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                        <div className="flex gap-2">
                          <button type="submit" disabled={savingComment} className="h-9 rounded-md bg-[#3858e9] px-4 text-sm font-semibold text-white hover:bg-[#2145e6] disabled:opacity-60">{savingComment ? 'Replying...' : 'Reply'}</button>
                          <button type="button" onClick={() => { setReplyTo(null); setReplyText(''); }} className="h-9 rounded-md border border-[#3858e9] px-4 text-sm font-semibold text-[#3858e9]">Cancel</button>
                        </div>
                      </form>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-[#2271B1]">
                    {post ? <Link to={getPostUrl(post)} className="hover:underline">{post.title || 'Untitled'}</Link> : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-[#2271B1]">{commentDate(comment)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#C8D0C8] text-[#384238]">
              <th className="px-3 py-3"><input type="checkbox" aria-label="Select all comments" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} className="green-checkbox" /></th>
              <th className="px-3 py-3 text-left font-medium">Author</th>
              <th className="px-3 py-3 text-left font-medium">Comment</th>
              <th className="px-3 py-3 text-left font-medium">In response to</th>
              <th className="px-3 py-3 text-left font-medium">Submitted on</th>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="comment-bulk-actions-bottom">Bulk actions</label>
          <select id="comment-bulk-actions-bottom" defaultValue="" className="h-9 min-w-32 rounded-xl border border-[#B8C0B8] bg-white px-2 text-sm focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]">
            <option value="">Bulk actions</option>
            <option value="unapprove">Unapprove</option>
            <option value="spam">Mark as spam</option>
            <option value="trash">Move to Trash</option>
          </select>
          <button type="button" className="h-9 rounded-xl border border-[#22C55E] px-3 text-sm text-[#176B34] transition-colors hover:bg-[#22C55E] hover:text-[#102718]">Apply</button>
        </div>
        <span className="text-xs text-[#69736A]">{visibleComments.length} {visibleComments.length === 1 ? 'item' : 'items'}</span>
      </div>
    </main>
  );
};

export default AdminComments;