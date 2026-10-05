import { campus } from './campus';

export const CATEGORIES = campus.categories;

export const ROLES = {
  student: { label: 'Student', blurb: 'Buy and sell as a comrade' },
  merchant: { label: 'Merchant', blurb: 'Run a campus business or shop' },
  trader: { label: 'Trader', blurb: 'Sell goods to the campus community' },
};

export const POST_TYPES = ['General', 'Event', 'Announcement'];

// Normalises Kenyan numbers to 2547XXXXXXXX / 2541XXXXXXXX. Returns '' when invalid.
export function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  else if (digits.length === 9 && /^[17]/.test(digits)) digits = `254${digits}`;
  return /^254[17]\d{8}$/.test(digits) ? digits : '';
}

export function whatsappLink(phone, text) {
  const number = normalizePhone(phone);
  if (!number) return null;
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  return Number(ts) || 0;
}

export function timeAgo(ts, fallback = '') {
  const ms = toMillis(ts);
  if (!ms) return fallback || 'just now';
  const secs = Math.floor((Date.now() - ms) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(ms).toLocaleDateString();
}

export function formatPrice(price) {
  const n = Number(price);
  return Number.isFinite(n) ? `${campus.currency} ${n.toLocaleString()}` : `${campus.currency} ${price ?? '-'}`;
}

export function initials(name) {
  return (
    String(name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || '?'
  );
}

// Downscales an image file to a JPEG data URL small enough to store inside a Firestore document.
export function compressImage(file, maxSize = 900, maxBytes = 600_000) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      let quality = 0.8;
      let data = canvas.toDataURL('image/jpeg', quality);
      while (data.length > maxBytes && quality > 0.3) {
        quality -= 0.1;
        data = canvas.toDataURL('image/jpeg', quality);
      }
      if (data.length > maxBytes) reject(new Error('Image is too large. Try a smaller photo.'));
      else resolve(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

export function authErrorMessage(error) {
  const code = error?.code || '';
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
    'auth/invalid-email': 'That email address is not valid.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed':
      'Email/password sign-in is not enabled for this Firebase project yet.',
  };
  return messages[code] || error?.message || 'Something went wrong.';
}
