import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthContext from '../context/auth-context';
import { fetchComments, updateComment } from '../services/api';
import { loadPublicPosts } from '../services/public-data';
import { getPostUrl } from '../services/post-url';

const AdminCommentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [comment, setComment] = useState(null);
  const [post, setPost] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', website: '', text: '', status: 'approved' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const authKey = user?.authKey || user?.auth_key;
    Promise.all([fetchComments(undefined, authKey, true), loadPublicPosts()])
      .then(([commentResponse, posts]) => {
        if (!isMounted) return;
        const selectedComment = (Array.isArray(commentResponse.data) ? commentResponse.data : [])
          .find((item) => String(item.id) === String(id));
        if (!selectedComment) {
          setError('Comment not found.');
          return;
        }
        setComment(selectedComment);
        const commentPost = (Array.isArray(posts) ? posts : []).find((item) => String(item.id) === String(selectedComment.post_id ?? selectedComment.postId)) || null;
        setPost(commentPost);
        setForm({
          name: selectedComment.name || '',
          email: selectedComment.email || '',
          website: commentPost ? `${window.location.origin}${getPostUrl(commentPost)}` : selectedComment.website || '',
          text: selectedComment.text || '',
          status: selectedComment.status || 'approved'
        });
      })
      .catch(() => {
        if (isMounted) setError('Could not load this comment. Please try again.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [id, user?.authKey, user?.auth_key]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const authKey = user?.authKey || user?.auth_key;
    if (!authKey || !comment) return;
    setSaving(true);
    setError('');
    try {
      await updateComment(comment.id, authKey, form);
      navigate(`/testsite/admin/comments?post=${encodeURIComponent(comment.post_id ?? comment.postId)}`);
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Could not update this comment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'mt-1.5 h-10 w-full min-w-0 rounded-md border border-[#B8C0B8] bg-white px-3 text-sm text-[#1E1E1E] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]';

  return (
    <main className="min-h-full bg-[#F7FAF7] px-4 py-6 text-[#1E1E1E] md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-normal">Edit Comment</h1>
          {post && <p className="mt-2 break-words text-sm text-[#69736A]">Permalink: <Link to={`${getPostUrl(post)}#comments`} className="text-[#2271B1] hover:underline">{window.location.origin}{getPostUrl(post)}#comment-{comment?.id}</Link></p>}
        </div>
        <Link to={`/testsite/admin/comments${comment ? `?post=${encodeURIComponent(comment.post_id ?? comment.postId)}` : ''}`} className="text-sm text-[#2271B1] hover:underline">Back to Comments</Link>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {loading ? <div className="mt-5 rounded-lg border border-[#C8D0C8] bg-white px-4 py-8 text-center text-sm text-[#69736A]">Loading comment...</div>
        : comment && (
          <form onSubmit={handleSubmit} className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-4">
              <section className="overflow-hidden rounded-lg border border-[#C8D0C8] bg-white">
                <h2 className="border-b border-[#DCE5DC] px-4 py-3 text-sm font-semibold">Author</h2>
                <div className="grid gap-3 p-4">
                  <label className="grid gap-2 text-sm sm:grid-cols-[56px_minmax(0,1fr)] sm:items-center">Name<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={fieldClass} /></label>
                  <label className="grid gap-2 text-sm sm:grid-cols-[56px_minmax(0,1fr)] sm:items-center">Email<input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={fieldClass} /></label>
                  <label className="grid gap-2 text-sm sm:grid-cols-[56px_minmax(0,1fr)] sm:items-center">URL<input value={form.website} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} className={fieldClass} /></label>
                </div>
              </section>

              <section className="overflow-hidden rounded-lg border border-[#C8D0C8] bg-white">
                <h2 className="border-b border-[#DCE5DC] px-4 py-3 text-sm font-semibold">Comment</h2>
                <div className="p-4">
                  {comment.parentId && <p className="mb-3 text-xs text-[#69736A]">In reply to: {comment.parentId}</p>}
                  <textarea required value={form.text} onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} className="min-h-48 w-full rounded-md border border-[#B8C0B8] px-3 py-2 text-sm leading-6 text-[#1E1E1E] focus:border-[#22C55E] focus:outline-none focus:ring-1 focus:ring-[#22C55E]" />
                </div>
              </section>
            </div>

            <aside className="overflow-hidden rounded-lg border border-[#C8D0C8] bg-white">
              <h2 className="border-b border-[#DCE5DC] px-4 py-3 text-sm font-semibold">Save</h2>
              <div className="space-y-3 p-4">
                <div className="text-sm text-[#526052]">Status: <span className="font-semibold capitalize">{form.status}</span></div>
                {[
                  ['approved', 'Approved'],
                  ['pending', 'Pending'],
                  ['spam', 'Spam']
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm text-[#384238]">
                    <input type="radio" name="comment-status" value={value} checked={form.status === value} onChange={() => setForm((current) => ({ ...current, status: value }))} className="accent-[#22C55E]" />
                    {label}
                  </label>
                ))}
                <div className="border-t border-[#E5EBE5] pt-3 text-xs leading-5 text-[#69736A]">Submitted on: {comment.date || '—'}</div>
                {post && <div className="text-xs leading-5 text-[#69736A]">In response to: <Link to={getPostUrl(post)} className="text-[#2271B1] hover:underline">{post.title || 'Untitled'}</Link></div>}
                <button type="submit" disabled={saving} className="mt-2 h-10 w-full rounded-md bg-[#3858e9] px-4 text-sm font-semibold text-white hover:bg-[#2145e6] disabled:cursor-wait disabled:opacity-60">{saving ? 'Updating...' : 'Update Comment'}</button>
              </div>
            </aside>
          </form>
        )}
    </main>
  );
};

export default AdminCommentEdit;
