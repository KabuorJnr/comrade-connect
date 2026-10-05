import { useMemo, useState } from 'react';
import { deleteDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Search, Store, MapPin, Phone, MessageCircle, ChevronRight, BadgeCheck, Shield, ShieldOff } from 'lucide-react';
import { profileDoc, uniAdminDoc } from '../lib/firebase';
import { campus } from '../lib/campus';
import { useUniversity } from '../lib/university';
import { useFeedback } from '../lib/feedback';
import { ROLES, whatsappLink, toMillis } from '../lib/utils';
import { Avatar, SellerBadges, EmptyState, RowSkeletons, Modal, Chip, Button } from '../components/ui';
import { ListingCard } from '../components/Listing';

export default function SellersView({ profiles, listings, adminIds, loading, onViewSeller }) {
  const uni = useUniversity();
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
      .filter((p) => role === 'all' || (role === 'verified' ? p.verified : p.role === role))
      .filter((p) => !q || [p.name, p.businessName, p.location, p.bio].some((v) => v?.toLowerCase().includes(q)))
      .sort(
        (a, b) =>
          Number(Boolean(b.verified)) - Number(Boolean(a.verified)) ||
          (counts[b.uid] || 0) - (counts[a.uid] || 0) ||
          toMillis(b.createdAt) - toMillis(a.createdAt),
      );
  }, [profiles, query, role, counts]);

  return (
    <div className="animate-fade-in space-y-4">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Sellers</h1>
        <p className="mt-0.5 text-sm text-gray-400">
          {profiles.length} students, merchants and traders at {uni.shortName}
        </p>
      </header>

      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 -mx-4 space-y-2.5 bg-black/85 px-4 pb-3 pt-2 backdrop-blur-xl">
        <label className="relative block">
          <span className="sr-only">Search sellers</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            placeholder="Search sellers or shops"
            className="min-h-[44px] w-full rounded-full border border-white/5 bg-white/[0.06] py-2.5 pl-10 pr-4 text-[15px] text-white placeholder-gray-500 outline-none focus:border-brand/60"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {[['all', 'All'], ['verified', 'Verified'], ...Object.entries(ROLES).map(([k, r]) => [k, `${r.label}s`])].map(
            ([value, label]) => (
              <Chip key={value} active={role === value} onClick={() => setRole(value)}>
                {label}
              </Chip>
            ),
          )}
        </div>
      </div>

      {loading ? (
        <RowSkeletons count={5} />
      ) : filtered.length ? (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li key={p.uid}>
              <button
                type="button"
                onClick={() => onViewSeller(p.uid)}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3.5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <Avatar name={p.businessName || p.name} size="h-11 w-11 text-sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-semibold text-white">{p.businessName || p.name}</span>
                    {p.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-light" aria-label="Verified" />}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                    <span>{ROLES[p.role]?.label || 'Student'}</span>
                    {p.location && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{p.location}</span>
                      </>
                    )}
                    {adminIds.has(p.uid) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-brand-light">Admin</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-white">{counts[p.uid] || 0}</div>
                  <div className="text-[10px] text-gray-500">listings</div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Store}
          title={profiles.length ? 'No sellers match' : 'No sellers yet'}
          text={profiles.length ? 'Try a different search.' : `Registered sellers at ${uni.shortName} appear here.`}
        />
      )}
    </div>
  );
}

export function SellerProfileModal({ profile, listings, onClose, onOpenListing, isGuest, onRequireAuth, isAdmin, isSellerAdmin, currentUser }) {
  const uni = useUniversity();
  const { confirm, toast } = useFeedback();
  const [busy, setBusy] = useState('');
  if (!profile) return null;

  const own = listings
    .filter((l) => l.sellerId === profile.uid)
    .sort((a, b) => (a.status === 'sold') - (b.status === 'sold') || toMillis(b.createdAt) - toMillis(a.createdAt));
  const wa = whatsappLink(profile.phone, `Hi, I found your shop on ${campus.appName}.`);
  const displayName = profile.businessName || profile.name;
  const isSelf = currentUser?.uid === profile.uid;

  const run = async (label, fn, done) => {
    setBusy(label);
    try {
      await fn();
      toast(done);
    } catch (err) {
      toast(err.code === 'permission-denied' ? "You don't have permission to do that." : err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const toggleVerified = () =>
    run(
      'verify',
      () =>
        updateDoc(profileDoc(uni.id, profile.uid), {
          verified: !profile.verified,
          verifiedBy: currentUser.uid,
          updatedAt: serverTimestamp(),
        }),
      profile.verified ? 'Verification removed' : `${displayName} is now verified`,
    );

  const toggleAdmin = async () => {
    const ok = await confirm(
      isSellerAdmin
        ? {
            title: `Remove ${profile.name} as admin?`,
            message: `They will no longer be able to manage ${uni.shortName}.`,
            confirmText: 'Remove admin',
            danger: true,
          }
        : {
            title: `Make ${profile.name} an admin?`,
            message: `Admins can change ${uni.shortName}'s branding, categories and locations, verify sellers, remove listings and posts, and appoint other admins.`,
            confirmText: 'Make admin',
          },
    );
    if (!ok) return;
    run(
      'admin',
      () =>
        isSellerAdmin
          ? deleteDoc(uniAdminDoc(uni.id, profile.uid))
          : setDoc(uniAdminDoc(uni.id, profile.uid), {
              uid: profile.uid,
              name: profile.name,
              addedBy: currentUser.uid,
              addedAt: serverTimestamp(),
            }),
      isSellerAdmin ? 'Admin removed' : `${profile.name} is now an admin`,
    );
  };

  return (
    <Modal open onClose={onClose} title="Shop" wide>
      <div className="text-center">
        <Avatar name={displayName} size="mx-auto h-20 w-20 text-2xl" />
        <h3 className="mt-3 flex items-center justify-center gap-1.5 text-xl font-semibold tracking-tight text-white">
          {displayName}
          {profile.verified && <BadgeCheck className="h-5 w-5 text-brand-light" aria-label="Verified" />}
        </h3>
        {profile.businessName && <p className="text-sm text-gray-400">{profile.name}</p>}
        <div className="mt-2 flex justify-center">
          <SellerBadges role={ROLES[profile.role]?.label} pro={profile.isPro} admin={isSellerAdmin} />
        </div>
        {profile.location && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {profile.location}
          </p>
        )}
        {profile.bio && <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-gray-300">{profile.bio}</p>}
      </div>

      {!isSelf &&
        (isGuest ? (
          <Button className="mt-5 w-full" onClick={onRequireAuth}>
            Sign in to contact
          </Button>
        ) : (
          profile.phone && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <a
                href={`tel:+${profile.phone}`}
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand/90"
              >
                <Phone className="h-4 w-4" /> Call
              </a>
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-black hover:bg-[#25D366]/90"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          )
        ))}

      {isAdmin && (
        <div className="mt-4 rounded-2xl border border-brand/20 bg-brand/[0.06] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-light">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" /> Admin tools
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="ghost" loading={busy === 'verify'} onClick={toggleVerified}>
              <BadgeCheck className="h-4 w-4" /> {profile.verified ? 'Unverify' : 'Verify seller'}
            </Button>
            <Button
              size="sm"
              variant={isSellerAdmin ? 'danger-ghost' : 'ghost'}
              loading={busy === 'admin'}
              disabled={isSelf}
              onClick={toggleAdmin}
            >
              {isSellerAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {isSellerAdmin ? 'Remove admin' : 'Make admin'}
            </Button>
          </div>
        </div>
      )}

      <h4 className="mb-3 mt-6 text-sm font-semibold text-white">
        Listings <span className="font-normal text-gray-500">({own.length})</span>
      </h4>
      {own.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {own.map((l) => (
            <ListingCard key={l.id} listing={l} onOpen={onOpenListing} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl bg-white/[0.03] p-5 text-center text-sm text-gray-500">No listings yet.</p>
      )}
    </Modal>
  );
}
