import { useMemo, useState } from 'react';
import { Search, Store, MapPin, Phone, MessageCircle } from 'lucide-react';
import { campus } from '../lib/campus';
import { ROLES, whatsappLink, toMillis } from '../lib/utils';
import { Avatar, RoleBadge, EmptyState, Spinner, Modal } from '../components/ui';
import { ListingCard } from '../components/Listing';

export default function SellersView({ profiles, listings, loading, onViewSeller }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');

  const counts = useMemo(() => {
    const map = {};
    listings.forEach((l) => {
      if (l.sellerId && l.status !== 'sold') map[l.sellerId] = (map[l.sellerId] || 0) + 1;
    });
    return map;
  }, [listings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles
      .filter((p) => role === 'all' || p.role === role)
      .filter((p) => !q || [p.name, p.businessName, p.location, p.bio].some((v) => v?.toLowerCase().includes(q)))
      .sort(
        (a, b) =>
          Number(Boolean(b.isPro)) - Number(Boolean(a.isPro)) ||
          (counts[b.uid] || 0) - (counts[a.uid] || 0) ||
          toMillis(b.createdAt) - toMillis(a.createdAt),
      );
  }, [profiles, query, role, counts]);

  return (
    <div className="animate-fade-in space-y-4">
      <section className="rounded-3xl border border-white/5 bg-[#1d1d1f] p-6 text-center">
        <h2 className="text-2xl font-semibold tracking-tighter text-white">Campus sellers</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-gray-400">
          Every registered student, merchant and trader — find a shop and see what they sell.
        </p>
      </section>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          placeholder="Search sellers or shops"
          className="w-full rounded-xl bg-[#1d1d1f] py-3 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="flex gap-2 text-xs">
        {[['all', 'All'], ...Object.entries(ROLES).map(([k, r]) => [k, `${r.label}s`])].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            className={`rounded-full px-3 py-1 font-medium ${
              role === value ? 'bg-[#f5f5f7] text-black' : 'bg-[#1d1d1f] text-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((p) => (
            <button
              key={p.uid}
              type="button"
              onClick={() => onViewSeller(p.uid)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-[#1d1d1f] p-4 text-left hover:bg-[#252528]"
            >
              <Avatar name={p.businessName || p.name} size="h-12 w-12 text-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-white">{p.businessName || p.name}</span>
                  <RoleBadge role={ROLES[p.role]?.label} pro={p.isPro} />
                </div>
                <div className="truncate text-xs text-gray-500">
                  {p.businessName ? `${p.name} · ` : ''}
                  {p.location || 'Campus'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-white">{counts[p.uid] || 0}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">listings</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon={Store} title="No sellers found" text="Registered sellers will appear here." />
      )}
    </div>
  );
}

export function SellerProfileModal({ profile, listings, onClose, onOpenListing, isGuest, onRequireAuth }) {
  if (!profile) return null;
  const own = listings
    .filter((l) => l.sellerId === profile.uid)
    .sort((a, b) => (a.status === 'sold') - (b.status === 'sold') || toMillis(b.createdAt) - toMillis(a.createdAt));
  const wa = whatsappLink(profile.phone, `Hi, I found your shop on ${campus.appName}.`);

  return (
    <Modal open onClose={onClose} title="Seller" wide>
      <div className="text-center">
        <Avatar name={profile.businessName || profile.name} size="mx-auto h-20 w-20 text-2xl" />
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{profile.businessName || profile.name}</h3>
        {profile.businessName && <p className="text-sm text-gray-400">{profile.name}</p>}
        <div className="mt-2 flex justify-center">
          <RoleBadge role={ROLES[profile.role]?.label} pro={profile.isPro} />
        </div>
        {profile.location && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3 w-3" /> {profile.location}
          </p>
        )}
        {profile.bio && <p className="mt-3 text-sm text-gray-300">{profile.bio}</p>}
      </div>

      {isGuest ? (
        <button
          type="button"
          onClick={onRequireAuth}
          className="mt-5 w-full rounded-full bg-brand py-3 text-sm font-semibold text-white"
        >
          Sign in to contact
        </button>
      ) : (
        profile.phone && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <a
              href={`tel:+${profile.phone}`}
              className="flex items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] py-3 text-sm font-semibold text-green-500"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        )
      )}

      <h4 className="mb-3 mt-6 text-sm font-semibold text-white">Listings ({own.length})</h4>
      {own.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {own.map((l) => (
            <ListingCard key={l.id} listing={l} onOpen={onOpenListing} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No listings yet.</p>
      )}
    </Modal>
  );
}
