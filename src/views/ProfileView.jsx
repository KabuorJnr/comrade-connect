import { LogOut, Pencil, Zap, Plus, MapPin, Phone, AlertCircle, Repeat, Shield, ChevronRight, UserRound, Copy } from 'lucide-react';
import { useFeedback } from '../lib/feedback';
import { campus } from '../lib/campus';
import { PRO_ENABLED } from '../lib/firebase';
import { useUniversity } from '../lib/university';
import { ROLES, toMillis } from '../lib/utils';
import { ListingCard } from '../components/Listing';
import { Avatar, Button, SellerBadges, Card, SectionTitle, EmptyState } from '../components/ui';

function MenuRow({ icon: Icon, label, hint, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/[0.04] ${
        danger ? 'text-red-400' : 'text-white'
      }`}
    >
      <Icon className={`h-5 w-5 ${danger ? '' : 'text-gray-400'}`} aria-hidden="true" />
      <span className="flex-1">
        {label}
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
      {!danger && <ChevronRight className="h-4 w-4 text-gray-600" aria-hidden="true" />}
    </button>
  );
}

export default function ProfileView({
  user,
  profile,
  isGuest,
  isAdmin,
  canSwitch,
  listings,
  onSignIn,
  onRegister,
  onEditProfile,
  onSell,
  onOpenListing,
  onUpgrade,
  onSignOut,
  onSwitchUniversity,
  onOpenAdmin,
}) {
  const uni = useUniversity();
  const { toast } = useFeedback();

  // Needed once by the owner to make this account the super admin (see README).
  const copyAccountId = async () => {
    try {
      await navigator.clipboard.writeText(user.uid);
      toast('Account ID copied');
    } catch {
      toast(`Account ID: ${user.uid}`);
    }
  };

  if (isGuest) {
    return (
      <div className="animate-fade-in space-y-4">
        <Card className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.06]">
            <UserRound className="h-7 w-7 text-gray-400" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Join {uni.shortName} on {campus.appName}</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
            Register as a student, merchant or trader to sell, post to the feed and contact sellers.
          </p>
          <div className="mx-auto mt-6 max-w-xs space-y-2">
            <Button className="w-full" onClick={onRegister}>
              Create an account
            </Button>
            <Button variant="ghost" className="w-full" onClick={onSignIn}>
              I already have an account
            </Button>
          </div>
        </Card>
        {canSwitch && (
          <Card className="overflow-hidden p-0">
            <MenuRow icon={Repeat} label="Switch university" hint={uni.name} onClick={onSwitchUniversity} />
          </Card>
        )}
      </div>
    );
  }

  const mine = listings
    .filter((l) => l.sellerId === user.uid || l.userId === user.uid)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
  const active = mine.filter((l) => l.status !== 'sold').length;
  const displayName = profile?.businessName || profile?.name || user.displayName || user.email?.split('@')[0] || 'Comrade';

  return (
    <div className="animate-fade-in space-y-5">
      {!profile && (
        <button
          type="button"
          onClick={onEditProfile}
          className="flex w-full items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left text-sm text-amber-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-semibold">Finish setting up at {uni.shortName}.</span> Add your name and phone so
            buyers can reach you.
          </span>
        </button>
      )}

      <Card className="text-center">
        <Avatar name={displayName} size="mx-auto h-20 w-20 text-2xl" />
        <h1 className="mt-3 text-xl font-bold tracking-tight text-white">{displayName}</h1>
        {profile?.businessName && <p className="text-sm text-gray-400">{profile.name}</p>}
        <p className="mt-0.5 text-xs text-gray-500">{user.email}</p>
        <div className="mt-2 flex justify-center">
          <SellerBadges role={ROLES[profile?.role]?.label} verified={profile?.verified} pro={profile?.isPro} admin={isAdmin} />
        </div>
        {(profile?.phone || profile?.location) && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
            {profile?.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" /> +{profile.phone}
              </span>
            )}
            {profile?.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {profile.location}
              </span>
            )}
          </div>
        )}
        {profile?.bio && <p className="mx-auto mt-3 max-w-sm text-sm text-gray-300">{profile.bio}</p>}

        <dl className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <dt className="text-xs text-gray-500">Active</dt>
            <dd className="text-xl font-bold text-white">{active}</dd>
          </div>
          <div className="rounded-2xl bg-white/[0.04] p-3">
            <dt className="text-xs text-gray-500">Sold</dt>
            <dd className="text-xl font-bold text-white">{mine.length - active}</dd>
          </div>
        </dl>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="ghost" onClick={onEditProfile}>
            <Pencil className="h-4 w-4" /> Edit profile
          </Button>
          <Button onClick={onSell}>
            <Plus className="h-4 w-4" /> New listing
          </Button>
        </div>
      </Card>

      <section>
        <SectionTitle>My listings</SectionTitle>
        {mine.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mine.map((l) => (
              <ListingCard key={l.id} listing={l} onOpen={onOpenListing} />
            ))}
          </div>
        ) : (
          <Card className="p-0">
            <EmptyState title="You haven't listed anything yet" text="It's free and takes under a minute." />
          </Card>
        )}
      </section>

      {PRO_ENABLED && !profile?.isPro && (
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-white">Seller Pro</h2>
              <p className="mt-1 text-xs text-gray-400">Pro badge and priority placement. Optional.</p>
            </div>
            <Zap className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
          </div>
          <Button variant="light" className="w-full" onClick={onUpgrade}>
            Upgrade · {campus.currency} {campus.pro.price}/mo
          </Button>
        </Card>
      )}

      <Card className="divide-y divide-white/[0.06] overflow-hidden p-0">
        {isAdmin && <MenuRow icon={Shield} label={`Manage ${uni.shortName}`} hint="Branding, categories, admins" onClick={onOpenAdmin} />}
        {canSwitch && <MenuRow icon={Repeat} label="Switch university" hint={uni.name} onClick={onSwitchUniversity} />}
        <MenuRow icon={Copy} label="Copy my account ID" hint={user.uid} onClick={copyAccountId} />
        <MenuRow icon={LogOut} label="Sign out" onClick={onSignOut} danger />
      </Card>
    </div>
  );
}
