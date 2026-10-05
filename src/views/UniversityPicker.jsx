import { useMemo, useState } from 'react';
import { Search, GraduationCap, Plus, ArrowLeft, Check, LogIn, EyeOff } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import { campus } from '../lib/campus';
import { contrastText } from '../lib/university';
import { Avatar, Button, EmptyState, RowSkeletons, Tag } from '../components/ui';

// Full-screen university chooser: first-run onboarding and "Switch university".
export default function UniversityPicker({
  universities,
  loading,
  currentId,
  isPlatformAdmin,
  isGuest,
  onSelect,
  onCancel,
  onAddUniversity,
  onSignIn,
}) {
  const [query, setQuery] = useState('');
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return universities
      .filter((u) => isPlatformAdmin || u.status !== 'hidden')
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.shortName.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [universities, query, isPlatformAdmin]);

  return (
    <div className="relative mx-auto flex min-h-[100dvh] max-w-xl flex-col px-4 pb-10 pt-[calc(1.5rem+env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-brand/20 to-transparent" aria-hidden="true" />

      <div className="relative flex items-center justify-between">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="-ml-2 inline-flex min-h-[40px] items-center gap-1 rounded-full px-2 text-sm text-gray-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <span />
        )}
        {isGuest && onSignIn && (
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-sm text-gray-300 hover:text-white"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </button>
        )}
      </div>

      <header className="relative mt-6 text-center">
        <BrandMark className="mx-auto h-16 w-16 drop-shadow-[0_10px_30px_rgb(var(--brand)/0.45)]" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">{campus.appName}</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-400">{campus.tagline}</p>
      </header>

      <h2 className="relative mt-8 text-sm font-semibold text-white">
        {onCancel ? 'Switch university' : 'Choose your university'}
      </h2>
      <label className="relative mt-3 block">
        <span className="sr-only">Search universities</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          autoFocus={!onCancel}
          placeholder="Search universities"
          className="min-h-[48px] w-full rounded-2xl border border-white/5 bg-white/[0.06] py-3 pl-10 pr-4 text-[15px] text-white placeholder-gray-500 outline-none focus:border-brand/60"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>

      <div className="relative mt-3 flex-1">
        {loading ? (
          <RowSkeletons count={5} />
        ) : visible.length ? (
          <ul className="space-y-2">
            {visible.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => onSelect(u.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors hover:bg-white/[0.06] ${
                    u.id === currentId ? 'border-brand/50 bg-brand/10' : 'border-white/[0.06] bg-white/[0.03]'
                  }`}
                >
                  <Avatar
                    src={u.logo}
                    name={u.shortName}
                    size="h-11 w-11 text-xs"
                    style={{ background: u.primary, color: contrastText(u.primary) }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 font-semibold leading-snug text-white">{u.name}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {u.shortName}
                      {u.status === 'hidden' && (
                        <Tag tone="amber">
                          <EyeOff className="h-3 w-3" aria-hidden="true" /> Hidden
                        </Tag>
                      )}
                    </div>
                  </div>
                  {u.id === currentId && <Check className="h-5 w-5 text-brand-light" aria-label="Current" />}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={GraduationCap}
            title={universities.length ? 'No university matches' : 'No universities yet'}
            text={
              universities.length
                ? 'Check the spelling, or ask us to add your university.'
                : isPlatformAdmin
                  ? 'Add the first university to get started.'
                  : isGuest
                    ? 'Universities appear here once they are set up. Running this app? Sign in as the super admin to add the first one.'
                    : 'Universities will appear here once they are set up.'
            }
          />
        )}
      </div>

      {isPlatformAdmin && (
        <Button variant="ghost" className="relative mt-4 w-full" onClick={onAddUniversity}>
          <Plus className="h-4 w-4" /> Add a university
        </Button>
      )}
    </div>
  );
}
