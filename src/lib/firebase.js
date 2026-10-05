import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { campus } from './campus';

export const app = getApps().length ? getApp() : initializeApp(campus.firebase);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Local development against `firebase emulators:start --only auth,firestore`.
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

// Each university's marketplace lives under artifacts/{universityId}/public/data/..., so listings,
// sellers and feeds stay separate. Web config is public by design; access is enforced by firestore.rules.
const dataPath = (uni) => ['artifacts', uni, 'public', 'data'];

// Listings keep the historical "services" collection name.
export const listingsCol = (uni) => collection(db, ...dataPath(uni), 'services');
export const listingDoc = (uni, id) => doc(db, ...dataPath(uni), 'services', id);
export const postsCol = (uni) => collection(db, ...dataPath(uni), 'community_posts');
export const postDoc = (uni, id) => doc(db, ...dataPath(uni), 'community_posts', id);
export const profilesCol = (uni) => collection(db, ...dataPath(uni), 'profiles');
export const profileDoc = (uni, uid) => doc(db, ...dataPath(uni), 'profiles', uid);

// University settings, editable by that university's admins.
export const universitiesCol = () => collection(db, 'universities');
export const universityDoc = (uni) => doc(db, 'universities', uni);
export const uniAdminsCol = (uni) => collection(db, 'universities', uni, 'admins');
export const uniAdminDoc = (uni, uid) => doc(db, 'universities', uni, 'admins', uid);

// Platform admins (created in the Firebase console) can add universities and act as admin anywhere.
export const platformAdminDoc = (uid) => doc(db, 'platformAdmins', uid);

// A signed-in user's home university, so the app opens there on any device.
export const userDoc = (uid) => doc(db, 'users', uid);

export const API_URL =
  import.meta.env.VITE_API_URL || campus.paymentsApiUrl || (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Pro upgrades need the M-Pesa payment server, so they are hidden when no server is configured.
export const PRO_ENABLED = Boolean(campus.pro?.enabled && API_URL);
