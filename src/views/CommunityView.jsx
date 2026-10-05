import { useMemo, useState } from 'react';
import { MessagesSquare, PenSquare } from 'lucide-react';
import { useUniversity } from '../lib/university';
import { PostComposer, PostCard } from '../components/Community';
import { EmptyState, RowSkeletons, Chip, Button } from '../components/ui';

const FILTERS = [
  ['all', 'All'],
  ['General', 'General'],
  ['Event', 'Events'],
  ['Announcement', 'Notices'],
];

export default function CommunityView({ posts, loading, user, profile, isGuest, isAdmin, onRequireAuth }) {
  const uni = useUniversity();
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(
    () => (filter === 'all' ? posts : posts.filter((p) => (p.type || 'General') === filter)),
    [posts, filter],
  );

  return (
    <div className="animate-fade-in space-y-4">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">{uni.shortName} feed</h1>
        <p className="mt-0.5 text-sm text-gray-400">Events, notices and updates from comrades and sellers.</p>
      </header>

      {isGuest ? (
        <button
          type="button"
          onClick={onRequireAuth}
          className="flex w-full items-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-4 text-left text-sm text-gray-400 hover:text-white"
        >
          <PenSquare className="h-5 w-5" aria-hidden="true" /> Sign in to post to the {uni.shortName} feed
        </button>
      ) : (
        <PostComposer user={user} profile={profile} />
      )}

      <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist" aria-label="Filter posts">
        {FILTERS.map(([value, label]) => (
          <Chip key={value} active={filter === value} onClick={() => setFilter(value)}>
            {label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <RowSkeletons count={3} />
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} user={user} isGuest={isGuest} isAdmin={isAdmin} onRequireAuth={onRequireAuth} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessagesSquare}
          title={posts.length ? 'Nothing in this filter' : 'The feed is quiet'}
          text={posts.length ? 'Try another filter.' : 'Start the conversation with your campus.'}
          action={
            !posts.length &&
            isGuest && (
              <Button size="sm" onClick={onRequireAuth}>
                Sign in to post
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
