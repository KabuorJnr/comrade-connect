import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Briefcase, Store, Users, User, Plus, LogIn } from 'lucide-react';
import { onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { auth, listingsCol, postsCol, profilesCol, profileDoc } from './lib/firebase';
import { toMillis } from './lib/utils';
import { campus, LOCATIONS_LIST_ID } from './lib/campus';
import { Avatar, Notice } from './components/ui';
import AuthModal from './components/AuthModal';
import ProfileForm from './components/ProfileForm';
import ListingForm from './components/ListingForm';
import ProUpgrade from './components/ProUpgrade';
import { ListingDetail } from './components/Listing';
import MarketView from './views/MarketView';
import SellersView, { SellerProfileModal } from './views/SellersView';
import CommunityView from './views/CommunityView';
import ProfileView from './views/ProfileView';

const TABS = [
  { id: 'market', label: 'Market', icon: Briefcase },
  { id: 'sellers', label: 'Sellers', icon: Store },
  { id: 'community', label: 'Feed', icon: Users },
  { id: 'profile', label: 'Me', icon: User },
];

function useCollection(colRef, enabled) {
  const [state, setState] = useState({ items: [], loading: true, error: '' });
  useEffect(() => {
    if (!enabled) return undefined;
    return onSnapshot(
      colRef(),
      (snap) => setState({ items: snap.docs.map((d) => ({ id: d.id, ...d.data() })), loading: false, error: '' }),
      (err) => {
        console.error('Firestore error:', err);
        setState({
          items: [],
          loading: false,
          error: err.code === 'permission-denied' ? 'Access denied by database rules.' : 'Network error. Try again.',
        });
      },
    );
  }, [colRef, enabled]);
  return state;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileState, setProfileState] = useState({ uid: null, data: null });
  const [tab, setTab] = useState('market');
  const [toast, setToast] = useState('');

  // Modal state
  const [authMode, setAuthMode] = useState(null); // 'signin' | 'register' | 'reset'
  const [editingProfile, setEditingProfile] = useState(false);
  const [listingForm, setListingForm] = useState(null); // { listing?: object }
  const [openListingId, setOpenListingId] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isGuest = !user || user.isAnonymous;
  const profile = !isGuest && profileState.uid === user.uid ? profileState.data : null;

  // Guests get an anonymous session so they can browse; registering replaces it with a real account.
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthReady(true);
        if (!u) signInAnonymously(auth).catch((err) => console.warn('Anonymous sign-in unavailable:', err.code));
      }),
    [],
  );

  useEffect(() => {
    if (!user || user.isAnonymous) return undefined;
    return onSnapshot(
      profileDoc(user.uid),
      (snap) => setProfileState({ uid: snap.id, data: snap.exists() ? { uid: snap.id, ...snap.data() } : null }),
      (err) => console.error('Profile error:', err),
    );
  }, [user]);

  const listingsState = useCollection(listingsCol, authReady);
  const postsState = useCollection(postsCol, authReady);
  const profilesState = useCollection(profilesCol, authReady);

  const listings = listingsState.items;
  const posts = useMemo(
    () => [...postsState.items].sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)),
    [postsState.items],
  );
  const profiles = useMemo(() => profilesState.items.map((p) => ({ ...p, uid: p.uid || p.id })), [profilesState.items]);
  const openListing = listings.find((l) => l.id === openListingId) || null;
  const sellerProfile = profiles.find((p) => p.uid === sellerId) || null;

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const requireAuth = useCallback(() => setAuthMode('signin'), []);

  const startSelling = () => {
    if (isGuest) return setAuthMode('register');
    if (!profile) return setEditingProfile(true);
    setListingForm({});
  };

  const handleSignOut = async () => {
    if (!window.confirm(`Sign out of ${campus.appName}?`)) return;
    await signOut(auth);
    setTab('market');
  };

  const openSeller = (uid) => {
    setOpenListingId(null);
    setSellerId(uid);
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
      if (tab !== 'market') return setTab('market');
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

  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-black pb-32 text-[#f5f5f7]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-8rem] h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute right-[-4rem] top-[18rem] h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button type="button" onClick={() => setTab('market')} className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-white" />
            <span className="text-sm font-semibold tracking-wide text-white/90">{campus.appName}</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={startSelling}
              className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand/90"
            >
              <Plus className="h-3.5 w-3.5" /> Sell
            </button>
            {isGuest ? (
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="inline-flex items-center gap-1 text-xs font-medium text-white/80 hover:text-white"
              >
                <LogIn className="h-4 w-4" /> Sign in
              </button>
            ) : (
              <button type="button" onClick={() => setTab('profile')} aria-label="My profile">
                <Avatar name={profile?.businessName || profile?.name || user.displayName} size="h-8 w-8 text-[10px]" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pt-20">
        {toast && (
          <div className="mb-4">
            <Notice kind="success">{toast}</Notice>
          </div>
        )}

        {tab === 'market' && (
          <MarketView
            listings={listings}
            loading={listingsState.loading}
            error={listingsState.error}
            sellerCount={profiles.length}
            onOpen={(l) => setOpenListingId(l.id)}
            onSell={startSelling}
          />
        )}
        {tab === 'sellers' && (
          <SellersView
            profiles={profiles}
            listings={listings}
            loading={profilesState.loading}
            onViewSeller={openSeller}
          />
        )}
        {tab === 'community' && (
          <CommunityView
            posts={posts}
            loading={postsState.loading}
            user={user}
            profile={profile}
            isGuest={isGuest}
            onRequireAuth={requireAuth}
          />
        )}
        {tab === 'profile' && (
          <ProfileView
            user={user}
            profile={profile}
            isGuest={isGuest}
            listings={listings}
            onSignIn={() => setAuthMode('signin')}
            onRegister={() => setAuthMode('register')}
            onEditProfile={() => setEditingProfile(true)}
            onSell={startSelling}
            onOpenListing={(l) => setOpenListingId(l.id)}
            onUpgrade={() => setShowUpgrade(true)}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      <nav className="pointer-events-none fixed bottom-4 left-0 right-0 z-50 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-[#1d1d1f]/90 px-2 py-2 shadow-2xl shadow-black/50 backdrop-blur-2xl">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex w-16 flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium transition-colors ${
                tab === id ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={tab === id ? 2.5 : 2} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      <datalist id={LOCATIONS_LIST_ID}>
        {campus.locations.map((place) => (
          <option key={place} value={place} />
        ))}
      </datalist>

      {authMode && (
        <AuthModal open mode={authMode} setMode={setAuthMode} onClose={() => setAuthMode(null)} />
      )}
      {editingProfile && user && !isGuest && (
        <ProfileForm open user={user} profile={profile} onClose={() => setEditingProfile(false)} />
      )}
      {listingForm && user && !isGuest && (
        <ListingForm
          open
          user={user}
          profile={profile}
          listing={listingForm.listing}
          onClose={() => setListingForm(null)}
          onSaved={setToast}
        />
      )}
      {openListing && (
        <ListingDetail
          listing={openListing}
          onClose={() => setOpenListingId(null)}
          isOwner={Boolean(user && !isGuest && openListing.sellerId === user.uid)}
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
