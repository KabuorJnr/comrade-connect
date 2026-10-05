import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag, Store, MessagesSquare, UserRound, Plus, LogIn, Shield, ChevronDown } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { auth, listingsCol, postsCol, profilesCol, profileDoc, uniAdminsCol } from './lib/firebase';
import { campus, LOCATIONS_LIST_ID } from './lib/campus';
import { useUniversity, contrastText } from './lib/university';
import { useFeedback } from './lib/feedback';
import { toMillis } from './lib/utils';
import { Avatar } from './components/ui';
import AuthModal from './components/AuthModal';
import ProfileForm from './components/ProfileForm';
import ListingForm from './components/ListingForm';
import ProUpgrade from './components/ProUpgrade';
import { ListingDetail } from './components/Listing';
import MarketView from './views/MarketView';
import SellersView, { SellerProfileModal } from './views/SellersView';
import CommunityView from './views/CommunityView';
import ProfileView from './views/ProfileView';
import AdminView from './views/AdminView';

function useCollection(colRef) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  useEffect(
    () =>
      onSnapshot(
        colRef,
        (snap) => setState({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: '' }),
        (err) => {
          console.error('Firestore error:', err);
          setState({
            items: [],
            loading: false,
            error:
              err.code === 'permission-denied'
                ? 'Access denied by database rules.'
                : "Couldn't load. Check your connection and try again.",
          });
        },
      ),
    [colRef],
  );
  return state;
}

// The marketplace for the active university. Remounted (key) whenever the university changes.
export default function Marketplace({ user, isGuest, isPlatformAdmin, canSwitch, onSwitchUniversity, onAddUniversity }) {
  const uni = useUniversity();
  const { confirm } = useFeedback();
  const [profileState, setProfileState] = useState({ uid: null, data: null });
  const [tab, setTab] = useState('market');

  // Modal state
  const [authMode, setAuthMode] = useState(null); // 'signin' | 'register' | 'reset'
  const [editingProfile, setEditingProfile] = useState(false);
  const [listingForm, setListingForm] = useState(null); // { listing?: object }
  const [openListingId, setOpenListingId] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const profile = !isGuest && profileState.uid === user.uid ? profileState.data : null;

  useEffect(() => {
    if (isGuest) return undefined;
    return onSnapshot(
      profileDoc(uni.id, user.uid),
      (snap) => setProfileState({ uid: snap.id, data: snap.exists() ? { uid: snap.id, ...snap.data() } : null }),
      (err) => console.error('Profile error:', err),
    );
  }, [uni.id, user, isGuest]);

  const refs = useMemo(
    () => ({
      listings: listingsCol(uni.id),
      posts: postsCol(uni.id),
      profiles: profilesCol(uni.id),
      admins: uniAdminsCol(uni.id),
    }),
    [uni.id],
  );
  const listingsState = useCollection(refs.listings);
  const postsState = useCollection(refs.posts);
  const profilesState = useCollection(refs.profiles);
  const adminsState = useCollection(refs.admins);

  const profiles = useMemo(() => profilesState.items.map((p) => ({ ...p, uid: p.uid || p.id })), [profilesState.items]);
  const verified = useMemo(() => new Set(profiles.filter((p) => p.verified).map((p) => p.uid)), [profiles]);
  const listings = useMemo(
    () => listingsState.items.map((l) => ({ ...l, sellerVerified: verified.has(l.sellerId) })),
    [listingsState.items, verified],
  );
  const posts = useMemo(
    () => [...postsState.items].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
    [postsState.items],
  );
  const admins = useMemo(
    () => adminsState.items.map((a) => ({ ...a, uid: a.uid || a.id })),
    [adminsState.items],
  );
  const adminIds = useMemo(() => new Set(admins.map((a) => a.uid)), [admins]);
  const isAdmin = !isGuest && (isPlatformAdmin || adminIds.has(user.uid));

  const openListing = listings.find((l) => l.id === openListingId) || null;
  const sellerProfile = profiles.find((p) => p.uid === sellerId) || null;
  const activeTab = tab === 'admin' && !isAdmin ? 'market' : tab;

  const requireAuth = useCallback(() => setAuthMode('signin'), []);

  const startSelling = () => {
    if (isGuest) return setAuthMode('register');
    if (!profile) return setEditingProfile(true);
    setListingForm({});
  };

  const handleSignOut = async () => {
    const ok = await confirm({
      title: `Sign out of ${campus.appName}?`,
      message: 'You can keep browsing as a guest.',
      confirmText: 'Sign out',
    });
    if (!ok) return;
    await signOut(auth);
    setTab('market');
  };

  const openSeller = (uid) => {
    setOpenListingId(null);
    setSellerId(uid);
  };

  const goTo = (next) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Android back button: close the top-most screen first, then return to the market, then exit.
  const handleBack = useRef(() => {});
  useEffect(() => {
    handleBack.current = () => {
      if (showUpgrade) return setShowUpgrade(false);
      if (listingForm) return setListingForm(null);
      if (editingProfile) return setEditingProfile(false);
      if (authMode) return setAuthMode(null);
      if (openListingId) return setOpenListingId(null);
      if (sellerId) return setSellerId(null);
      if (activeTab !== 'market') return setTab('market');
      NativeApp.exitApp();
    };
  });
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    const listener = NativeApp.addListener('backButton', () => handleBack.current());
    return () => {
      listener.then((l) => l.remove());
    };
  }, []);

  const tabs = [
    { id: 'market', label: 'Market', icon: ShoppingBag },
    { id: 'sellers', label: 'Sellers', icon: Store },
    { id: 'community', label: 'Feed', icon: MessagesSquare },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Shield }] : []),
    { id: 'profile', label: isGuest ? 'Account' : 'Me', icon: UserRound },
  ];

  return (
    <div className="relative min-h-[100dvh] overflow-x-clip pb-[calc(6.5rem+env(safe-area-inset-bottom))] text-[#f5f5f7]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-brand/10 to-transparent" aria-hidden="true" />

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.06] bg-black/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={canSwitch ? onSwitchUniversity : () => goTo('market')}
            className="flex min-w-0 items-center gap-2.5 rounded-full py-1 pr-2 text-left"
            aria-label={canSwitch ? `${uni.name}. Switch university` : uni.name}
          >
            <Avatar
              src={uni.logo}
              name={uni.shortName}
              size="h-8 w-8 text-[10px]"
              style={{ background: uni.primary, color: contrastText(uni.primary) }}
            />
            <span className="min-w-0">
              <span className="flex items-center gap-1 truncate text-sm font-semibold text-white">
                {uni.shortName}
                {canSwitch && <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" aria-hidden="true" />}
              </span>
              <span className="block truncate text-[11px] leading-tight text-gray-500">{campus.appName}</span>
            </span>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={startSelling}
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-brand px-3.5 text-xs font-semibold text-white hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Sell
            </button>
            {isGuest ? (
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-2.5 text-xs font-medium text-white/80 hover:text-white"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" /> Sign in
              </button>
            ) : (
              <button type="button" onClick={() => goTo('profile')} aria-label="My profile" className="rounded-full">
                <Avatar name={profile?.businessName || profile?.name || user.displayName || user.email} size="h-9 w-9 text-[11px]" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 pt-[calc(4.5rem+env(safe-area-inset-top))]">
        {activeTab === 'market' && (
          <MarketView
            listings={listings}
            loading={listingsState.loading}
            error={listingsState.error}
            sellerCount={profiles.length}
            onOpen={(l) => setOpenListingId(l.id)}
            onSell={startSelling}
          />
        )}
        {activeTab === 'sellers' && (
          <SellersView
            profiles={profiles}
            listings={listings}
            adminIds={adminIds}
            loading={profilesState.loading}
            onViewSeller={openSeller}
          />
        )}
        {activeTab === 'community' && (
          <CommunityView
            posts={posts}
            loading={postsState.loading}
            user={user}
            profile={profile}
            isGuest={isGuest}
            isAdmin={isAdmin}
            onRequireAuth={requireAuth}
          />
        )}
        {activeTab === 'admin' && (
          <AdminView
            user={user}
            isPlatformAdmin={isPlatformAdmin}
            admins={admins}
            profiles={profiles}
            listings={listings}
            posts={posts}
            onAddUniversity={onAddUniversity}
            onSwitchUniversity={onSwitchUniversity}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            profile={profile}
            isGuest={isGuest}
            isAdmin={isAdmin}
            canSwitch={canSwitch}
            listings={listings}
            onSignIn={() => setAuthMode('signin')}
            onRegister={() => setAuthMode('register')}
            onEditProfile={() => setEditingProfile(true)}
            onSell={startSelling}
            onOpenListing={(l) => setOpenListingId(l.id)}
            onUpgrade={() => setShowUpgrade(true)}
            onSignOut={handleSignOut}
            onSwitchUniversity={onSwitchUniversity}
            onOpenAdmin={() => goTo('admin')}
          />
        )}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-black/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-3xl justify-around px-2">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => goTo(id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  active ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" aria-hidden="true" />}
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      <datalist id={LOCATIONS_LIST_ID}>
        {uni.locations.map((place) => (
          <option key={place} value={place} />
        ))}
      </datalist>

      {authMode && <AuthModal open mode={authMode} setMode={setAuthMode} onClose={() => setAuthMode(null)} />}
      {editingProfile && !isGuest && (
        <ProfileForm open user={user} profile={profile} onClose={() => setEditingProfile(false)} />
      )}
      {listingForm && !isGuest && (
        <ListingForm
          open
          user={user}
          profile={profile}
          listing={listingForm.listing}
          onClose={() => setListingForm(null)}
        />
      )}
      {openListing && (
        <ListingDetail
          listing={openListing}
          onClose={() => setOpenListingId(null)}
          isOwner={Boolean(!isGuest && openListing.sellerId === user.uid)}
          isAdmin={isAdmin}
          isGuest={isGuest}
          onRequireAuth={() => {
            setOpenListingId(null);
            requireAuth();
          }}
          onEdit={(l) => {
            setOpenListingId(null);
            setListingForm({ listing: l });
          }}
          onViewSeller={openSeller}
        />
      )}
      {sellerProfile && !openListing && (
        <SellerProfileModal
          profile={sellerProfile}
          listings={listings}
          onClose={() => setSellerId(null)}
          onOpenListing={(l) => setOpenListingId(l.id)}
          isGuest={isGuest}
          isAdmin={isAdmin}
          isSellerAdmin={adminIds.has(sellerProfile.uid)}
          currentUser={isGuest ? null : user}
          onRequireAuth={() => {
            setSellerId(null);
            requireAuth();
          }}
        />
      )}
      {showUpgrade && !isGuest && (
        <ProUpgrade open user={user} profile={profile} onClose={() => setShowUpgrade(false)} />
      )}
    </div>
  );
}
