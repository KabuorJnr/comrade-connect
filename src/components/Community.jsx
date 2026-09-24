import { useState } from 'react';
import { addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { Heart, Trash2, Send } from 'lucide-react';
import { postsCol, postDoc } from '../lib/firebase';
import { POST_TYPES, timeAgo } from '../lib/utils';
import { Avatar, Button, Notice, RoleBadge, inputClass } from './ui';

export function PostComposer({ user, profile }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('General');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setBusy(true);
    setError('');
    try {
      await addDoc(postsCol(), {
        type,
        content: text.slice(0, 1000),
        author: profile?.businessName || profile?.name || user.displayName || 'Comrade',
        authorRole: profile?.role || 'student',
        authorId: user.uid,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      setContent('');
      setType('General');
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'You need to be signed in to post.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-3xl border border-white/5 bg-[#1d1d1f] p-4">
      <textarea
        rows={3}
        maxLength={1000}
        placeholder="Share an update, event, or offer with campus…"
        className={`${inputClass} bg-black/30`}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <select className={`${inputClass} w-auto bg-black/30 py-2`} value={type} onChange={(e) => setType(e.target.value)}>
          {POST_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <Button type="submit" loading={busy} disabled={!content.trim()} className="ml-auto py-2">
          <Send className="h-4 w-4" /> Post
        </Button>
      </div>
      <Notice>{error}</Notice>
    </form>
  );
}

export function PostCard({ post, user, isGuest, onRequireAuth }) {
  const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
  const liked = Boolean(user && likedBy.includes(user.uid));
  const likeCount = likedBy.length + (Number(post.likes) || 0);
  const isOwner = Boolean(user && post.authorId === user.uid);
  const isEvent = post.type === 'Event';

  const toggleLike = async () => {
    if (isGuest) return onRequireAuth();
    try {
      await updateDoc(postDoc(post.id), { likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    } catch (err) {
      console.error('Like failed:', err);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deleteDoc(postDoc(post.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <article
      className={`rounded-3xl border border-white/5 p-5 ${
        isEvent ? 'bg-gradient-to-br from-[#1d1d1f] to-[#2d1b2d]' : 'bg-[#1d1d1f]'
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={post.author} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{post.author || 'Comrade'}</div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              {timeAgo(post.createdAt, post.time)}
              {post.authorRole && <RoleBadge role={post.authorRole} />}
            </div>
          </div>
        </div>
        <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {post.type || 'General'}
        </span>
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-gray-300">{post.content}</p>
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <button
          type="button"
          onClick={toggleLike}
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${liked ? 'text-pink-500' : 'text-gray-400 hover:text-white'}`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-pink-500' : ''}`} /> {likeCount}
        </button>
        {isOwner && (
          <button type="button" onClick={remove} className="text-gray-500 hover:text-red-400" aria-label="Delete post">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </article>
  );
}
