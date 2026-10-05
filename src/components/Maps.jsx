// Leaflet + OpenStreetMap maps. Loaded on demand through LazyMaps.jsx to keep the main bundle small.
import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { LocateFixed, Loader2, Trash2 } from 'lucide-react';
import { campus } from '../lib/campus';
import { formatPrice } from '../lib/utils';

const pinIcon = L.divIcon({ className: 'cc-marker', html: '<div class="cc-pin"></div>', iconSize: [0, 0] });

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const priceIcon = (listing) =>
  L.divIcon({
    className: 'cc-marker',
    html: `<div class="cc-price${listing.status === 'sold' ? ' is-sold' : ''}">${escapeHtml(formatPrice(listing.price))}</div>`,
    iconSize: [0, 0],
  });

function Tiles() {
  return <TileLayer url={campus.map.tileUrl} attribution={campus.map.attribution} maxZoom={19} />;
}

// Maps inside animated modals measure their size too early; re-measure once they settle.
function FixSize() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [map, target]);
  return null;
}

function ClickToPlace({ onPlace, onZoom }) {
  useMapEvents({
    click: (e) => onPlace({ lat: round(e.latlng.lat), lng: round(e.latlng.lng) }),
    zoomend: (e) => onZoom?.(e.target.getZoom()),
  });
  return null;
}

const round = (n) => Math.round(n * 1e6) / 1e6;

function frameClass(height) {
  return `relative z-0 overflow-hidden rounded-2xl border border-white/10 ${height}`;
}

// Tap the map (or drag the pin) to choose a point; "My location" uses the device GPS.
export function LocationPicker({ value, onChange, center, zoom = 16, onZoomChange, height = 'h-56', clearable = true }) {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);
  const start = value || center;

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError("This device can't share its location.");
      return;
    }
    setLocating(true);
    setLocateError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point = { lat: round(pos.coords.latitude), lng: round(pos.coords.longitude) };
        onChange(point);
        setFlyTarget(point);
        setLocating(false);
      },
      (err) => {
        setLocateError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Tap the map to place the pin instead.'
            : "Couldn't get your location. Tap the map to place the pin instead.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const dragHandlers = useMemo(
    () => ({
      dragend: (e) => {
        const p = e.target.getLatLng();
        onChange({ lat: round(p.lat), lng: round(p.lng) });
      },
    }),
    [onChange],
  );

  return (
    <div>
      <div className={frameClass(height)}>
        <MapContainer center={[start.lat, start.lng]} zoom={value ? Math.max(zoom, 16) : zoom} className="h-full w-full" attributionControl>
          <Tiles />
          <FixSize />
          <FlyTo target={flyTarget} />
          <ClickToPlace onPlace={onChange} onZoom={onZoomChange} />
          {value && <Marker position={[value.lat, value.lng]} icon={pinIcon} draggable eventHandlers={dragHandlers} />}
        </MapContainer>
        {!value && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[400] flex justify-center">
            <span className="rounded-full bg-black/75 px-3 py-1 text-xs text-white backdrop-blur">Tap the map to drop a pin</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-60"
        >
          {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
          {locating ? 'Finding you…' : 'Use my location'}
        </button>
        {clearable && value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-xs font-medium text-gray-400 hover:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove pin
          </button>
        )}
      </div>
      {locateError && <p className="ml-1 mt-1.5 text-xs text-amber-300">{locateError}</p>}
    </div>
  );
}

// Read-only map of a single place.
export function PlaceMap({ point, height = 'h-44' }) {
  return (
    <div className={frameClass(height)}>
      <MapContainer
        center={[point.lat, point.lng]}
        zoom={16}
        className="h-full w-full"
        scrollWheelZoom={false}
        dragging={!L.Browser.mobile}
        zoomControl={false}
      >
        <Tiles />
        <FixSize />
        <Marker position={[point.lat, point.lng]} icon={pinIcon} interactive={false} />
      </MapContainer>
    </div>
  );
}

function FitToListings({ points, fallback }) {
  const map = useMap();
  const key = points.map((p) => `${p.lat},${p.lng}`).join('|');
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [48, 48], maxZoom: 17 });
    else if (points.length === 1) map.setView([points[0].lat, points[0].lng], 16);
    else map.setView([fallback.lat, fallback.lng], fallback.zoom);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refit only when the set of points changes
  }, [map, key]);
  return null;
}

// Marketplace map: one price bubble per pinned listing.
export function ListingsMap({ listings, center, onOpen, height = 'h-[60dvh]' }) {
  const pinned = listings.filter((l) => l.geo);
  return (
    <div className={frameClass(height)}>
      <MapContainer center={[center.lat, center.lng]} zoom={center.zoom} className="h-full w-full">
        <Tiles />
        <FixSize />
        <FitToListings points={pinned.map((l) => l.geo)} fallback={center} />
        {pinned.map((l) => (
          <Marker
            key={l.id}
            position={[l.geo.lat, l.geo.lng]}
            icon={priceIcon(l)}
            title={l.title}
            alt={`${l.title}, ${formatPrice(l.price)}`}
            eventHandlers={{ click: () => onOpen(l) }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
