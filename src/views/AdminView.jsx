import { useCallback, useMemo, useState } from 'react';
import { deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  Shield,
  Palette,
  Tags,
  MapPin,
  Users,
  ImagePlus,
  Trash2,
  X,
  Plus,
  Eye,
  EyeOff,
  Globe2,
  BadgeCheck,
  ShoppingBag,
  MessagesSquare,
  Store,
  Info,
  Map as MapIcon,
} from 'lucide-react';
import { universityDoc, uniAdminDoc } from '../lib/firebase';
import { useUniversity, contrastText } from '../lib/university';
import { useFeedback } from '../lib/feedback';
import { compressImage, timeAgo } from '../lib/utils';
import { Avatar, Button, Card, Field, Notice, SectionTitle, Tag, inputClass } from '../components/ui';
import { LocationPicker } from '../components/LazyMaps';

const SWATCHES = ['#0071e3', '#15803d', '#b91c1c', '#7c3aed', '#c2410c', '#0f766e', '#be185d', '#a16207', '#1e3a8a', '#000000'];

function ListEditor({ label, items, onChange, placeholder, max, maxLength, emptyText }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const value = draft.trim().slice(0, maxLength);
    if (!value) return;
    if (items.some((i) => i.toLowerCase() === value.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...items, value]);
    setDraft('');
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 && <p className="text-sm text-gray-500">{emptyText}</p>}
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex min-h-[34px] items-center gap-1 rounded-full bg-white/[0.06] py-1 pl-3 pr-1 text-sm text-gray-200"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i !== item))}
              aria-label={`Remove ${item}`}
              className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 hover:bg-white/10 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      {items.length < max && (
        <div className="mt-3 flex gap-2">
          <label className="flex-1">
            <span className="sr-only">{label}</span>
            <input
              className={inputClass}
              placeholder={placeholder}
              maxLength={maxLength}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }}
            />
          </label>
          <Button variant="ghost" onClick={add} disabled={!draft.trim()} aria-label={`Add ${label}`}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      )}
      <p className="ml-1 mt-1.5 text-xs text-gray-500">
        {items.length}/{max}
      </p>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
      <div className="mt-2 text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

export default function AdminView({ user, isPlatformAdmin, admins, profiles, listings, posts, onAddUniversity, onSwitchUniversity }) {
  const uni = useUniversity();
  const { confirm, toast } = useFeedback();
  const initial = useMemo(
    () => ({
      name: uni.name,
      shortName: uni.shortName,
      tagline: uni.tagline,
      primary: uni.primary,
      logo: uni.logo,
      categories: uni.categories,
      locations: uni.locations,
      map: uni.map.set ? { lat: uni.map.lat, lng: uni.map.lng, zoom: uni.map.zoom } : null,
    }),
    [uni],
  );
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [error, setError] = useState('');
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setMapCentre = useCallback(
    (point) => setForm((f) => ({ ...f, map: point ? { lat: point.lat, lng: point.lng, zoom: f.map?.zoom || 16 } : null })),
    [],
  );
  const setMapZoom = useCallback(
    (zoom) => setForm((f) => (f.map && f.map.zoom !== zoom ? { ...f, map: { ...f.map, zoom } } : f)),
    [],
  );

  const profileNames = useMemo(() => Object.fromEntries(profiles.map((p) => [p.uid, p.name])), [profiles]);
  const stats = {
    listings: listings.filter((l) => l.status !== 'sold').length,
    sellers: profiles.length,
    verified: profiles.filter((p) => p.verified).length,
    posts: posts.length,
  };

  const handleLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLogoBusy(true);
    setError('');
    try {
      setForm((f) => ({ ...f, logo: '' }));
      const logo = await compressImage(file, 256, 150_000, 'image/png');
      setForm((f) => ({ ...f, logo }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLogoBusy(false);
    }
  };

  const save = async () => {
    setError('');
    const name = form.name.trim();
    const shortName = form.shortName.trim();
    if (name.length < 2) return setError('University name is too short.');
    if (!shortName) return setError('Add a short name, e.g. JKUAT.');
    if (!/^#[0-9a-fA-F]{6}$/.test(form.primary)) return setError('Brand colour must be a hex colour like #15803d.');
    if (!form.categories.length) return setError('Add at least one category.');
    setSaving(true);
    try {
      await updateDoc(universityDoc(uni.id), {
        name,
        shortName,
        tagline: form.tagline.trim(),
        theme: { primary: form.primary.toLowerCase() },
        logo: form.logo || '',
        categories: form.categories,
        locations: form.locations,
        map: form.map,
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      });
      toast('Changes are live for everyone');
    } catch (err) {
      const message = err.code === 'permission-denied' ? "You don't have permission to change this university." : err.message;
      setError(message);
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const setVisibility = async (status) => {
    const hiding = status === 'hidden';
    const ok = await confirm({
      title: hiding ? `Hide ${uni.shortName}?` : `Show ${uni.shortName}?`,
      message: hiding
        ? 'Students will no longer find it in the university list. Its data is kept.'
        : 'Students will be able to find and join it.',
      confirmText: hiding ? 'Hide' : 'Show',
      danger: hiding,
    });
    if (!ok) return;
    try {
      await updateDoc(universityDoc(uni.id), { status, updatedAt: serverTimestamp(), updatedBy: user.uid });
      toast(hiding ? 'University hidden' : 'University is visible');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const removeAdmin = async (admin) => {
    const self = admin.uid === user.uid;
    const ok = await confirm({
      title: self ? 'Stop being an admin?' : `Remove ${admin.name} as admin?`,
      message: self ? `You will lose access to these settings for ${uni.shortName}.` : 'They will no longer be able to manage this university.',
      confirmText: 'Remove',
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteDoc(uniAdminDoc(uni.id, admin.uid));
      toast('Admin removed');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const previewText = contrastText(form.primary);

  return (
    <div className="animate-fade-in space-y-5 pb-24">
      <header className="flex items-start justify-between gap-3 px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Manage {uni.shortName}</h1>
          <p className="mt-0.5 text-sm text-gray-400">Changes apply instantly to everyone at {uni.shortName}.</p>
        </div>
        <Tag tone="brand">
          <Shield className="h-3 w-3" aria-hidden="true" /> {isPlatformAdmin ? 'Super admin' : 'Admin'}
        </Tag>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={ShoppingBag} label="Active listings" value={stats.listings} />
        <Stat icon={Store} label="Sellers" value={stats.sellers} />
        <Stat icon={BadgeCheck} label="Verified" value={stats.verified} />
        <Stat icon={MessagesSquare} label="Posts" value={stats.posts} />
      </div>

      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <Palette className="h-4 w-4 text-gray-400" aria-hidden="true" /> Branding
          </span>
        </SectionTitle>

        <div
          className="mb-5 overflow-hidden rounded-2xl border border-white/10 p-4"
          style={{ background: `linear-gradient(135deg, ${form.primary}55, transparent 70%)` }}
          aria-label="Preview"
        >
          <div className="flex items-center gap-3">
            <Avatar src={form.logo} name={form.shortName} size="h-12 w-12 text-sm" style={{ background: form.primary, color: previewText }} />
            <div className="min-w-0">
              <div className="truncate text-xs" style={{ color: form.primary === '#000000' ? '#9ca3af' : undefined }}>
                {form.name || 'University name'}
              </div>
              <div className="truncate font-semibold text-white">{form.shortName || 'Short name'} marketplace</div>
            </div>
            <span className="ml-auto rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: form.primary, color: previewText }}>
              Sell
            </span>
          </div>
          {form.tagline && <p className="mt-3 text-sm text-gray-300">{form.tagline}</p>}
        </div>

        <div className="space-y-4">
          <Field label="University name">
            <input className={inputClass} maxLength={80} value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Short name" hint="Shown in headings, e.g. “JKUAT feed”.">
            <input className={inputClass} maxLength={24} value={form.shortName} onChange={set('shortName')} />
          </Field>
          <Field label="Tagline" hint={`${form.tagline.length}/200`}>
            <textarea rows={2} className={inputClass} maxLength={200} value={form.tagline} onChange={set('tagline')} />
          </Field>

          <div>
            <span className="mb-1.5 ml-1 block text-xs font-medium text-gray-400">Brand colour</span>
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, primary: c })}
                  aria-label={`Use colour ${c}`}
                  aria-pressed={form.primary.toLowerCase() === c}
                  className={`h-9 w-9 rounded-full border-2 transition-transform ${
                    form.primary.toLowerCase() === c ? 'scale-110 border-white' : 'border-white/10'
                  }`}
                  style={{ background: c }}
                />
              ))}
              <label className="relative flex h-9 items-center gap-2 rounded-full bg-white/[0.06] pl-1 pr-3 text-xs text-gray-300">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.primary) ? form.primary : '#000000'}
                  onChange={set('primary')}
                  className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  aria-label="Pick a custom colour"
                />
                <input
                  value={form.primary}
                  onChange={set('primary')}
                  maxLength={7}
                  className="w-[4.5rem] bg-transparent font-mono uppercase outline-none"
                  aria-label="Colour hex code"
                />
              </label>
            </div>
          </div>

          <div>
            <span className="mb-1.5 ml-1 block text-xs font-medium text-gray-400">Logo</span>
            <div className="flex items-center gap-3">
              <Avatar src={form.logo} name={form.shortName} size="h-14 w-14 text-sm" style={{ background: form.primary, color: previewText }} />
              <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full bg-white/[0.06] px-4 text-sm font-medium text-white hover:bg-white/10 focus-within:outline focus-within:outline-2 focus-within:outline-brand">
                <ImagePlus className="h-4 w-4" aria-hidden="true" /> {logoBusy ? 'Processing…' : form.logo ? 'Replace' : 'Upload'}
                <input type="file" accept="image/*" className="sr-only" onChange={handleLogo} disabled={logoBusy} />
              </label>
              {form.logo && (
                <Button variant="danger-ghost" size="sm" onClick={() => setForm({ ...form, logo: '' })}>
                  <Trash2 className="h-4 w-4" /> Remove
                </Button>
              )}
            </div>
            <p className="ml-1 mt-1.5 text-xs text-gray-500">Square image works best. Shown in the header and university list.</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <Tags className="h-4 w-4 text-gray-400" aria-hidden="true" /> Categories
          </span>
        </SectionTitle>
        <p className="-mt-1 mb-3 text-sm text-gray-500">What people can sell. Shown in this order.</p>
        <ListEditor
          label="category"
          items={form.categories}
          onChange={(categories) => setForm({ ...form, categories })}
          placeholder="e.g. Hostel essentials"
          max={30}
          maxLength={30}
          emptyText="Add at least one category."
        />
      </Card>

      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" /> Campus locations
          </span>
        </SectionTitle>
        <p className="-mt-1 mb-3 text-sm text-gray-500">Hostels, gates and estates suggested when people enter a location.</p>
        <ListEditor
          label="location"
          items={form.locations}
          onChange={(locations) => setForm({ ...form, locations })}
          placeholder="e.g. Hall 6, Gate C"
          max={100}
          maxLength={50}
          emptyText="No locations yet."
        />
      </Card>

      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-gray-400" aria-hidden="true" /> Campus map
          </span>
        </SectionTitle>
        <p className="-mt-1 mb-3 text-sm text-gray-500">
          Tap the centre of campus. Maps in the app open here, zoomed the way you leave it.
        </p>
        <LocationPicker
          value={form.map}
          onChange={setMapCentre}
          onZoomChange={setMapZoom}
          center={uni.map}
          zoom={form.map?.zoom || uni.map.zoom}
          height="h-64"
        />
      </Card>

      <Card>
        <SectionTitle>
          <span className="inline-flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" aria-hidden="true" /> Admins
          </span>
        </SectionTitle>
        <ul className="divide-y divide-white/[0.06]">
          {admins.map((a) => (
            <li key={a.uid} className="flex items-center gap-3 py-2.5">
              <Avatar name={profileNames[a.uid] || a.name} size="h-9 w-9 text-xs" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">
                  {profileNames[a.uid] || a.name}
                  {a.uid === user.uid && <span className="ml-1.5 text-xs text-gray-500">(you)</span>}
                </div>
                <div className="text-xs text-gray-500">Added {timeAgo(a.addedAt)}</div>
              </div>
              <Button variant="danger-ghost" size="sm" onClick={() => removeAdmin(a)} aria-label={`Remove ${a.name}`}>
                Remove
              </Button>
            </li>
          ))}
          {!admins.length && <li className="py-2 text-sm text-gray-500">No university admins yet.</li>}
        </ul>
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/[0.03] p-3 text-xs leading-relaxed text-gray-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          To add an admin, ask them to register at {uni.shortName}, then open their shop from the Sellers tab and tap
          “Make admin”. You can also verify trusted sellers there.
        </p>
      </Card>

      {isPlatformAdmin && (
        <Card>
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-gray-400" aria-hidden="true" /> Super admin
            </span>
          </SectionTitle>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] p-3">
              <div>
                <div className="text-sm font-medium text-white">Visibility</div>
                <div className="text-xs text-gray-500">
                  {uni.status === 'hidden' ? 'Hidden from the university list' : 'Listed for all students'} · id{' '}
                  <code className="text-gray-400">{uni.id}</code>
                </div>
              </div>
              {uni.status === 'hidden' ? (
                <Button size="sm" variant="ghost" onClick={() => setVisibility('active')}>
                  <Eye className="h-4 w-4" /> Show
                </Button>
              ) : (
                <Button size="sm" variant="danger-ghost" onClick={() => setVisibility('hidden')}>
                  <EyeOff className="h-4 w-4" /> Hide
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={onAddUniversity}>
                <Plus className="h-4 w-4" /> Add university
              </Button>
              <Button variant="ghost" onClick={onSwitchUniversity}>
                <Globe2 className="h-4 w-4" /> All universities
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Notice>{error}</Notice>

      {dirty && (
        <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4">
          <div className="animate-toast flex w-full max-w-md items-center gap-2 rounded-full border border-white/10 bg-[#1c1c1e]/95 p-1.5 pl-4 shadow-2xl backdrop-blur-xl">
            <span className="flex-1 text-sm text-gray-300">Unsaved changes</span>
            <Button variant="ghost" size="sm" onClick={() => setForm(initial)}>
              Discard
            </Button>
            <Button size="sm" loading={saving} onClick={save} disabled={logoBusy}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
