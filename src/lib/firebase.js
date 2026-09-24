import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Web config is public by design; access is enforced by firestore.rules.
const firebaseConfig = {
  apiKey: 'AIzaSyA1FJZC0NtFoIbcCIXVFuU1PPrr-d3FWR8',
  authDomain: 'comrade-connect-184cb.firebaseapp.com',
  projectId: 'comrade-connect-184cb',
  storageBucket: 'comrade-connect-184cb.firebasestorage.app',
  messagingSenderId: '910700491278',
  appId: '1:910700491278:web:db134716aa726302c3425f',
  measurementId: 'G-J52ZHC57WM',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Local development against `firebase emulators:start --only auth,firestore`.
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

// All marketplace data lives under artifacts/{appId}/public/data/...
export const appId = firebaseConfig.projectId;
const DATA_PATH = ['artifacts', appId, 'public', 'data'];

// Listings keep the historical "services" collection name so existing data stays visible.
export const listingsCol = () => collection(db, ...DATA_PATH, 'services');
export const listingDoc = (id) => doc(db, ...DATA_PATH, 'services', id);
export const postsCol = () => collection(db, ...DATA_PATH, 'community_posts');
export const postDoc = (id) => doc(db, ...DATA_PATH, 'community_posts', id);
export const profilesCol = () => collection(db, ...DATA_PATH, 'profiles');
export const profileDoc = (uid) => doc(db, ...DATA_PATH, 'profiles', uid);

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
