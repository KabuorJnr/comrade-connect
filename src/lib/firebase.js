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

// All marketplace data lives under artifacts/{dataNamespace}/public/data/..., so campuses that share
// a Firebase project keep separate listings, sellers and feeds. Web config is public by design;
// access is enforced by firestore.rules.
export const appId = campus.dataNamespace;
const DATA_PATH = ['artifacts', appId, 'public', 'data'];

// Listings keep the historical "services" collection name so existing data stays visible.
export const listingsCol = () => collection(db, ...DATA_PATH, 'services');
export const listingDoc = (id) => doc(db, ...DATA_PATH, 'services', id);
export const postsCol = () => collection(db, ...DATA_PATH, 'community_posts');
export const postDoc = (id) => doc(db, ...DATA_PATH, 'community_posts', id);
export const profilesCol = () => collection(db, ...DATA_PATH, 'profiles');
export const profileDoc = (uid) => doc(db, ...DATA_PATH, 'profiles', uid);

export const API_URL =
  import.meta.env.VITE_API_URL || campus.paymentsApiUrl || (import.meta.env.DEV ? 'http://localhost:5000' : '');

// Pro upgrades need the M-Pesa payment server, so they are hidden when no server is configured.
export const PRO_ENABLED = Boolean(campus.pro?.enabled && API_URL);
