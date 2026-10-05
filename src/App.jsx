import { useEffect, useMemo, useState } from 'react';
import { onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from './components/ui';
import BrandMark from './components/BrandMark';
import { auth, universitiesCol, platformAdminDoc, userDoc } from './lib/firebase';
import { campus } from './lib/campus';
import {
  UniversityContext,
  withDefaults,
  applyTheme,
  savedUniversityId,
  saveUniversityId,
} from './lib/university';
import FeedbackProvider from './components/FeedbackProvider';
import AuthModal from './components/AuthModal';
import NewUniversityModal from './components/NewUniversityModal';
import UniversityPicker from './views/UniversityPicker';
import Marketplace from './Marketplace';

// Placeholder university used while no university is chosen (e.g. signing in from the picker).
const NO_UNIVERSITY = withDefaults('', { name: campus.appName, shortName: campus.appName });

function Splash({ message, onRetry }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <BrandMark className="h-16 w-16" />
      <p className="text-lg font-semibold text-white">{campus.appName}</p>
      {message ? (
        <p className="max-w-xs text-sm text-gray-400">{message}</p>
      ) : (
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" aria-label="Loading" />
      )}
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}

function loadErrorMessage(err) {
  if (err?.code === 'permission-denied') {
    return "The database refused access. If you run this app, deploy firestore.rules (see the README's Setup section).";
  }
  if (err?.code === 'unavailable') return "Can't reach the server. Check your internet connection.";
  return `Couldn't load universities (${err?.code || 'unknown error'}).`;
}

function Root() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [anonFailed, setAnonFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [platformAdmin, setPlatformAdmin] = useState({ uid: null, value: false });
  const [universitiesState, setUniversitiesState] = useState({ items: [], loading: true, error: '' });
  // A build locked to one university (campus.json "university") skips the picker entirely.
  const [selectedId, setSelectedId] = useState(() => campus.university || savedUniversityId());
  const [picking, setPicking] = useState(false);
  const [addingUniversity, setAddingUniversity] = useState(false);
  const [authMode, setAuthMode] = useState(null);

  const isGuest = !user || user.isAnonymous;
  const isPlatformAdmin = !isGuest && platformAdmin.uid === user.uid && platformAdmin.value;

  // Guests get an anonymous session so they can browse; registering replaces it with a real account.
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthReady(true);
        if (u) {
          setAnonFailed(false);
        } else {
          signInAnonymously(auth).catch((err) => {
            console.warn('Anonymous sign-in unavailable:', err.code);
            setAnonFailed(true);
          });
        }
      }),
    [],
  );

  useEffect(() => {
    if (!user || user.isAnonymous) return undefined;
    return onSnapshot(
      platformAdminDoc(user.uid),
      (snap) => setPlatformAdmin({ uid: user.uid, value: snap.exists() }),
      () => setPlatformAdmin({ uid: user.uid, value: false }),
    );
  }, [user]);

  // When a signed-in user has no university chosen on this device, open their home university.
  useEffect(() => {
    if (!user || user.isAnonymous || selectedId) return;
    getDoc(userDoc(user.uid))
      .then((snap) => {
        const home = snap.data()?.university;
        if (home) {
          saveUniversityId(home);
          setSelectedId(home);
        }
      })
      .catch(() => {});
  }, [user, selectedId]);

  // Wait until there is a session (guest or real) before reading, so rules that require sign-in
  // don't reject the first request; re-subscribe whenever the account changes.
  const sessionReady = authReady && (Boolean(user) || anonFailed);
  const uid = user?.uid || '';
  useEffect(() => {
    if (!sessionReady) return undefined;
    return onSnapshot(
      universitiesCol(),
      (snap) =>
        setUniversitiesState({
          items: snap.docs.map((d) => withDefaults(d.id, d.data())),
          loading: false,
          error: '',
        }),
      (err) => {
        console.error('Universities error:', err);
        setUniversitiesState({ items: [], loading: false, error: loadErrorMessage(err) });
      },
    );
  }, [sessionReady, uid, reloadKey]);

  const retry = () => {
    setUniversitiesState({ items: [], loading: true, error: '' });
    setReloadKey((k) => k + 1);
  };

  const universities = universitiesState.items;
  const uni = useMemo(() => {
    const found = universities.find((u) => u.id === selectedId);
    return found && (found.status !== 'hidden' || isPlatformAdmin || campus.university) ? found : null;
  }, [universities, selectedId, isPlatformAdmin]);

  useEffect(() => {
    applyTheme(uni?.primary);
  }, [uni?.primary]);

  const select = (id) => {
    saveUniversityId(id);
    setSelectedId(id);
    setPicking(false);
  };

  let content;
  if (!sessionReady || (universitiesState.loading && selectedId)) {
    content = <Splash />;
  } else if (universitiesState.error && !universities.length) {
    content = <Splash message={universitiesState.error} onRetry={retry} />;
  } else if (campus.university && !uni) {
    content = <Splash message={`${campus.appName} isn't available yet. Please check back soon.`} />;
  } else if (!uni || picking) {
    content = (
      <UniversityContext.Provider value={NO_UNIVERSITY}>
        <UniversityPicker
          universities={universities}
          loading={universitiesState.loading}
          currentId={uni?.id}
          isPlatformAdmin={isPlatformAdmin}
          isGuest={isGuest}
          onSelect={select}
          onCancel={uni ? () => setPicking(false) : undefined}
          onAddUniversity={() => setAddingUniversity(true)}
          onSignIn={() => setAuthMode('signin')}
        />
        {authMode && <AuthModal open mode={authMode} setMode={setAuthMode} onClose={() => setAuthMode(null)} />}
      </UniversityContext.Provider>
    );
  } else {
    content = (
      <UniversityContext.Provider value={uni}>
        <Marketplace
          key={`${uni.id}:${uid}`}
          user={user}
          isGuest={isGuest}
          isPlatformAdmin={isPlatformAdmin}
          canSwitch={!campus.university}
          onSwitchUniversity={() => setPicking(true)}
          onAddUniversity={() => setAddingUniversity(true)}
        />
      </UniversityContext.Provider>
    );
  }

  return (
    <>
      {content}
      {addingUniversity && isPlatformAdmin && (
        <NewUniversityModal
          open
          user={user}
          onClose={() => setAddingUniversity(false)}
          onCreated={(id) => {
            setAddingUniversity(false);
            select(id);
          }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <FeedbackProvider>
      <Root />
    </FeedbackProvider>
  );
}
