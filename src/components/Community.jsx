import { useState } from 'react';
import { addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { Heart, Trash2, Send, CalendarDays, Megaphone } from 'lucide-react';
import { postsCol, postDoc } from '../lib/firebase';
import { useUniversity } from '../lib/university';
import { useFeedback } from '../lib/feedback';
import { POST_TYPES, timeAgo } from '../lib/utils';
import { Avatar, Button, Notice, SellerBadges, Tag, Segmented, inputClass } from './ui';

export function PostComposer({ user, profile }) {
  const uni = useUniversity();
  const { toast } = useFeedback();
  const [content, setContent] = useState('');
  const [type, setType] = useState('General');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const author = profile?.businessName || profile?.name || user.displayName || 'Comrade';

  const submit = async (e) => {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setBusy(true);
    setError('');
    try {
      await addDoc(postsCol(uni.id), {
        type,
        content: text.slice(0, 1000),
        author,
        authorRole: profile?.role || 'student',
        authorId: user.uid,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      setContent('');
      setType('General');
      toast('Posted to the feed');
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'You need to be signed in to post.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4">
      <div className="flex gap-3">
        <Avatar name={author} />
        <label className="flex-1">
          <span className="sr-only">Write a post</span>
          <textarea
            rows={3}
            maxLength={1000}
            placeholder={`Share something with ${uni.shortName}…`}
            className={`${inputClass} resize-none`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Segmented
          label="Post type"
          className="flex-1"
          value={type}
          onChange={setType}
          options={POST_TYPES.map((t) => [t, t === 'Announcement' ? 'Notice' : t])}
        />
        <Button type="submit" size="sm" loading={busy} disabled={!content.trim()}>
          <Send className="h-3.5 w-3.5" /> Post
        </Button>
      </div>
      {error && (
        <div className="mt-3">
          <Notice>{error}</Notice>
        </div>
      )}
    </form>
  );
}

export function PostCard({ post, user, isGuest, isAdmin, onRequireAuth }) {
  const uni = useUniversity();
  const { confirm, toast } = useFeedback();
  const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];
  const liked = Boolean(user && likedBy.includes(user.uid));
  const likeCount = likedBy.length + (Number(post.likes) || 0);
  const isOwner = Boolean(user && !isGuest && post.authorId === user.uid);
  const type = post.type || 'General';

  const toggleLike = async () => {
    if (isGuest) return onRequireAuth();
    try {
      await updateDoc(postDoc(uni.id, post.id), { likedBy: liked ? arrayRemove(user.uid) : arrayUnion(user.uid) });
    } catch (err) {
      toast(err.message || 'Could not like this post', 'error');
    }
  };

  const remove = async () => {
    const asAdmin = !isOwner;
    const ok = await confirm({
      title: asAdmin ? 'Remove this post?' : 'Delete this post?',
      message: asAdmin ? `It will be removed from the ${uni.shortName} feed for everyone.` : 'This cannot be undone.',
      confirmText: asAdmin ? 'Remove' : 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDoc(postDoc(uni.id, post.id));
      toast(asAdmin ? 'Post removed' : 'Post deleted');
    } catch (err) {
      toast(err.message || 'Could not delete this post', 'error');
    }
  };

  const typeTag =
    type === 'Event' ? (
      <Tag tone="brand">
        <CalendarDays className="h-3 w-3" aria-hidden="true" /> Event
      </Tag>
    ) : type === 'Announcement' ? (
      <Tag tone="amber">
        <Megaphone className="h-3 w-3" aria-hidden="true" /> Notice
      </Tag>
    ) : null;

  return (
    <article className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4">
      <header className="flex items-start gap-3">
        <Avatar name={post.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-semibold text-white">{post.author || 'Comrade'}</span>
            {post.authorRole && post.authorRole !== 'student' && <SellerBadges role={post.authorRole} />}
          </div>
          <div className="text-xs text-gray-500">{timeAgo(post.createdAt, post.time)}</div>
        </div>
        {typeTag}
      </header>
      <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-gray-200">{post.content}</p>
      <footer className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
          className={`-ml-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2 text-sm font-medium transition-colors ${
            liked ? 'text-pink-500' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-pink-500' : ''}`} /> {likeCount > 0 ? likeCount : ''}
        </button>
        {(isOwner || isAdmin) && (
          <button
            type="button"
            onClick={remove}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-2 text-xs text-gray-500 hover:text-red-400"
            aria-label={isOwner ? 'Delete post' : 'Remove post (admin)'}
          >
            <Trash2 className="h-4 w-4" /> {isOwner ? '' : 'Remove'}
          </button>
        )}
      </footer>
    </article>
  );
}
