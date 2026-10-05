// Loads and validates campus configuration from campuses/<id>/campus.json.
// Every campus inherits from campuses/default/campus.json; objects merge, arrays and values replace.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CAMPUSES_DIR = join(ROOT, 'campuses');

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

function merge(base, override) {
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = isObject(value) && isObject(base[key]) ? merge(base[key], value) : value;
  }
  return out;
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`Could not read ${file}: ${err.message}`);
  }
}

export function listCampuses() {
  return readdirSync(CAMPUSES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(CAMPUSES_DIR, d.name, 'campus.json')))
    .map((d) => d.name)
    .sort();
}

export function activeCampusId() {
  return process.env.CAMPUS || 'default';
}

function lighten(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * amount);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function hexToRgbTriplet(hex) {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function loadCampus(id = activeCampusId()) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error(`Invalid campus id "${id}". Use lowercase letters, numbers and dashes.`);
  }
  const file = join(CAMPUSES_DIR, id, 'campus.json');
  if (!existsSync(file)) {
    throw new Error(`Unknown campus "${id}". Available: ${listCampuses().join(', ')}`);
  }
  const base = readJson(join(CAMPUSES_DIR, 'default', 'campus.json'));
  const campus = merge(base, id === 'default' ? {} : readJson(file));
  campus.id = id;

  const errors = [];
  const hex = /^#[0-9a-fA-F]{6}$/;
  if (!campus.appName) errors.push('appName is required');
  if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(campus.android?.appId || '')) {
    errors.push('android.appId must look like com.example.app (lowercase, dots, no dashes)');
  }
  if (!Number.isInteger(campus.android?.versionCode) || campus.android.versionCode < 1) {
    errors.push('android.versionCode must be a positive whole number');
  }
  if (!campus.android?.versionName) errors.push('android.versionName is required');
  if (!hex.test(campus.theme?.primary || '')) errors.push('theme.primary must be a hex colour like #0071e3');
  if (!hex.test(campus.theme?.background || '')) errors.push('theme.background must be a hex colour like #000000');
  if (campus.university != null && !/^[a-z0-9][a-z0-9-]{1,39}$/.test(campus.university)) {
    errors.push('university must be a university id (lowercase letters, numbers, dashes) or null');
  }
  if (!Array.isArray(campus.categories) || !campus.categories.length) errors.push('categories must be a non-empty list');
  const map = campus.map || {};
  if (!Array.isArray(map.center) || map.center.length !== 2 || !map.center.every(Number.isFinite)) {
    errors.push('map.center must be [latitude, longitude]');
  }
  if (!map.tileUrl) errors.push('map.tileUrl is required');
  if (!campus.firebase?.apiKey || !campus.firebase?.projectId) errors.push('firebase config is incomplete');
  if (errors.length) throw new Error(`campuses/${id}/campus.json:\n  - ${errors.join('\n  - ')}`);

  campus.theme.primaryLight = lighten(campus.theme.primary, 0.35);
  const ownLogo = join(CAMPUSES_DIR, id, 'logo.png');
  campus.logoPath = existsSync(ownLogo) ? ownLogo : join(CAMPUSES_DIR, 'default', 'logo.png');
  return campus;
}

// The subset of the config that is shipped to the browser.
export function publicCampus(campus) {
  const { logoPath: _logoPath, android: _android, ...rest } = campus;
  return rest;
}
