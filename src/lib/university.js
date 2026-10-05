import { createContext, useContext } from 'react';
import { campus } from './campus';

export const UniversityContext = createContext(null);

// The active university, with build-time defaults filled in. See withDefaults().
export function useUniversity() {
  return useContext(UniversityContext);
}

export const UNIVERSITY_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;
const HEX = /^#[0-9a-fA-F]{6}$/;

export function isValidPoint(p) {
  return Boolean(p) && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
}

export function withDefaults(id, data = {}) {
  const name = data.name || id;
  return {
    id,
    name,
    shortName: data.shortName || name,
    tagline:
      data.tagline || `Students, merchants and traders at ${data.shortName || name} in one place.`,
    primary: HEX.test(data.theme?.primary || '') ? data.theme.primary : campus.theme.primary,
    categories: Array.isArray(data.categories) && data.categories.length ? data.categories : campus.categories,
    locations: Array.isArray(data.locations) ? data.locations : [],
    logo: data.logo || '',
    status: data.status || 'active',
    // Campus map centre, set by the university's admins. Falls back to the country view.
    map: isValidPoint(data.map)
      ? { lat: data.map.lat, lng: data.map.lng, zoom: data.map.zoom || 16, set: true }
      : { lat: campus.map.center[0], lng: campus.map.center[1], zoom: campus.map.zoom, set: false },
  };
}

// Template for a brand-new university created by a platform admin.
export function newUniversityData(name, shortName, uid) {
  return {
    name,
    shortName,
    tagline: `Students, merchants and traders at ${shortName} in one place.`,
    theme: { primary: campus.theme.primary },
    categories: campus.categories,
    locations: [],
    logo: '',
    status: 'active',
    createdBy: uid,
  };
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Brand colour is exposed as CSS variables consumed by Tailwind's `brand` colour.
export function applyTheme(primary) {
  const hex = HEX.test(primary || '') ? primary : campus.theme.primary;
  const rgb = hexToRgb(hex);
  const light = rgb.map((c) => Math.round(c + (255 - c) * 0.35));
  const root = document.documentElement;
  root.style.setProperty('--brand', rgb.join(' '));
  root.style.setProperty('--brand-light', light.join(' '));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', campus.theme.background);
}

// Readable text colour (black/white) on top of a given background colour.
export function contrastText(hex) {
  const [r, g, b] = hexToRgb(HEX.test(hex || '') ? hex : '#000000');
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#000000' : '#ffffff';
}

const SELECTED_KEY = 'komradi.university';

export function savedUniversityId() {
  try {
    return localStorage.getItem(SELECTED_KEY) || '';
  } catch {
    return '';
  }
}

export function saveUniversityId(id) {
  try {
    if (id) localStorage.setItem(SELECTED_KEY, id);
    else localStorage.removeItem(SELECTED_KEY);
  } catch {
    // Storage can be unavailable (private mode); the picker simply shows again next time.
  }
}
