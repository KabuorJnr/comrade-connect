import { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import { campus } from '../lib/campus';
import { PostComposer, PostCard } from '../components/Community';
import { EmptyState, Spinner } from '../components/ui';

const FILTERS = [
  ['all', 'All'],
  ['General', 'General'],
  ['Event', 'Events'],
  ['Announcement', 'Notices'],
];

export default function CommunityView({ posts, loading, user, profile, isGuest, onRequireAuth }) {
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(
    () => (filter === 'all' ? posts : posts.filter((p) => (p.type || 'General') === filter)),
    [posts, filter],
  );

  return (
    <div className="animate-fade-in space-y-4">
      <section className="rounded-3xl border border-white/5 bg-[#1d1d1f] p-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tighter text-white">{campus.campusName} feed</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-gray-400">Events, notices and updates from comrades and sellers.</p>
      </section>

      {isGuest ? (
        <button
          type="button"
          onClick={onRequireAuth}
          className="w-full rounded-3xl border border-dashed border-white/15 bg-[#1d1d1f] p-4 text-sm text-gray-400 hover:text-white"
        >
          Sign in to post to the campus feed
        </button>
      ) : (
        <PostComposer user={user} profile={profile} />
      )}

      <div className="grid grid-cols-4 gap-1 rounded-lg bg-[#1d1d1f] p-1">
        {FILTERS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-md py-1.5 text-xs font-medium ${
              filter === value ? 'bg-[#636366] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length ? (
        filtered.map((post) => (
          <PostCard key={post.id} post={post} user={user} isGuest={isGuest} onRequireAuth={onRequireAuth} />
        ))
      ) : (
        <EmptyState icon={Users} title="Nothing here yet" text="Start the conversation." />
      )}
    </div>
  );
}
