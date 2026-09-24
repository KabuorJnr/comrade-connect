import { User, LogOut, Pencil, Zap, Plus, MapPin, Phone, AlertCircle } from 'lucide-react';
import { ROLES, toMillis } from '../lib/utils';
import { ListingCard } from '../components/Listing';
import { Avatar, Button, RoleBadge } from '../components/ui';

export default function ProfileView({
  user,
  profile,
  isGuest,
  listings,
  onSignIn,
  onRegister,
  onEditProfile,
  onSell,
  onOpenListing,
  onUpgrade,
  onSignOut,
}) {
  if (isGuest) {
    return (
      <div className="animate-fade-in rounded-3xl border border-white/5 bg-[#1d1d1f] p-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#2c2c2e]">
          <User className="h-8 w-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">Join ComradeConnect</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-gray-400">
          Register as a student, merchant or trader to list products and services, post to the campus feed and contact
          sellers.
        </p>
        <div className="mt-6 space-y-2">
          <Button className="w-full" onClick={onRegister}>
            Create an account
          </Button>
          <Button variant="ghost" className="w-full" onClick={onSignIn}>
            I already have an account
          </Button>
        </div>
      </div>
    );
  }

  const mine = listings
    .filter((l) => l.sellerId === user.uid || l.userId === user.uid)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  const active = mine.filter((l) => l.status !== 'sold').length;
  const displayName = profile?.businessName || profile?.name || user.displayName || 'Comrade';

  return (
    <div className="animate-fade-in space-y-6">
      {!profile && (
        <button
          type="button"
          onClick={onEditProfile}
          className="flex w-full items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-left text-sm text-yellow-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Your seller profile isn't set up yet. Tap to add your name and phone so buyers can reach you.
        </button>
      )}

      <section className="rounded-3xl border border-white/5 bg-[#1d1d1f] p-6 text-center">
        <Avatar name={displayName} size="mx-auto h-20 w-20 text-2xl" />
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">{displayName}</h2>
        {profile?.businessName && <p className="text-sm text-gray-400">{profile.name}</p>}
        <p className="mt-1 text-xs text-gray-500">{user.email}</p>
        <div className="mt-2 flex justify-center">
          <RoleBadge role={ROLES[profile?.role]?.label} pro={profile?.isPro} />
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-x-4 text-xs text-gray-500">
          {profile?.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> +{profile.phone}
            </span>
          )}
          {profile?.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {profile.location}
            </span>
          )}
        </div>
        {profile?.bio && <p className="mt-3 text-sm text-gray-300">{profile.bio}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-[#2c2c2e] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Active</p>
            <p className="text-2xl font-semibold text-white">{active}</p>
          </div>
          <div className="rounded-2xl bg-[#2c2c2e] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Sold</p>
            <p className="text-2xl font-semibold text-white">{mine.length - active}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onEditProfile}>
            <Pencil className="h-4 w-4" /> Edit profile
          </Button>
          <Button onClick={onSell}>
            <Plus className="h-4 w-4" /> New listing
          </Button>
        </div>
      </section>

      <section>
        <h3 className="mb-3 px-1 text-lg font-semibold text-white">My listings</h3>
        {mine.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {mine.map((l) => (
              <ListingCard key={l.id} listing={l} onOpen={onOpenListing} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-[#1d1d1f] p-6 text-center text-sm text-gray-500">
            You haven't listed anything yet.
          </p>
        )}
      </section>

      {!profile?.isPro && (
        <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-r from-[#1c1c1e] to-[#2c2c2e] p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-white">Seller Pro</h3>
              <p className="mt-1 text-xs text-gray-400">Verified badge and priority placement. Optional.</p>
            </div>
            <Zap className="h-5 w-5 fill-yellow-500 text-yellow-500" />
          </div>
          <Button variant="light" className="w-full" onClick={onUpgrade}>
            Upgrade (Ksh 250/mo)
          </Button>
        </section>
      )}

      <button
        type="button"
        onClick={onSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-4 font-medium text-red-500 hover:bg-white/5"
      >
        <LogOut className="h-5 w-5" /> Sign out
      </button>
    </div>
  );
}
