import { useCallback, useState } from 'react';
import { addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { listingsCol, listingDoc } from '../lib/firebase';
import { campus, LOCATIONS_LIST_ID } from '../lib/campus';
import { useUniversity } from '../lib/university';
import { useFeedback } from '../lib/feedback';
import { normalizePhone, localPhone, compressImage } from '../lib/utils';
import { Modal, Field, Button, Notice, Segmented, inputClass } from './ui';
import { LocationPicker } from './LazyMaps';

// Create a new listing, or edit one the current user owns (pass `listing`).
export default function ListingForm({ open, onClose, user, profile, listing }) {
  const uni = useUniversity();
  const { toast } = useFeedback();
  const editing = Boolean(listing);
  const [form, setForm] = useState(() => ({
    kind: listing?.kind || 'product',
    title: listing?.title || '',
    description: listing?.description || '',
    category: uni.categories.includes(listing?.category) ? listing.category : uni.categories[0],
    price: listing?.price ?? '',
    priceType: listing?.priceType || 'Fixed',
    location: listing?.location || profile?.location || '',
    phone: localPhone(listing?.phone || profile?.phone),
    image: listing?.image || '',
    geo: listing?.geo || null,
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const setGeo = useCallback((geo) => setForm((f) => ({ ...f, geo })), []);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setImageBusy(true);
    try {
      const image = await compressImage(file);
      setForm((f) => ({ ...f, image }));
    } catch (err) {
      setError(err.message);
    } finally {
      setImageBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const price = Number(form.price);
    const phone = normalizePhone(form.phone);
    if (!form.title.trim()) return setError('Give your listing a title.');
    if (form.price === '' || !Number.isFinite(price) || price < 0) return setError('Enter a valid price.');
    if (!phone) return setError('Enter a valid Kenyan phone number buyers can reach.');

    setBusy(true);
    try {
      const data = {
        kind: form.kind,
        title: form.title.trim().slice(0, 100),
        description: form.description.trim().slice(0, 1000),
        category: form.category,
        price,
        priceType: form.priceType,
        location: form.location.trim(),
        phone,
        image: form.image || '',
        geo: form.geo ? { lat: form.geo.lat, lng: form.geo.lng } : null,
        seller: profile?.businessName || profile?.name || user.displayName || 'Comrade',
        sellerRole: profile?.role || 'student',
        sellerPro: Boolean(profile?.isPro),
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(listingDoc(uni.id, listing.id), data);
      } else {
        await addDoc(listingsCol(uni.id), {
          ...data,
          sellerId: user.uid,
          userId: user.uid,
          status: 'available',
          createdAt: serverTimestamp(),
        });
      }
      toast(editing ? 'Listing updated' : 'Your listing is live');
      onClose();
    } catch (err) {
      setError(
        err.code === 'permission-denied'
          ? "You don't have permission to save this listing. Make sure you're signed in."
          : err.message || 'Could not save listing.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit listing' : 'New listing'}
      subtitle={editing ? undefined : `Free to list at ${uni.shortName}`}
      wide
      footer={
        <Button type="submit" form="listing-form" variant="light" loading={busy} disabled={imageBusy} className="w-full">
          {editing ? 'Save changes' : 'Publish listing'}
        </Button>
      }
    >
      <form id="listing-form" onSubmit={handleSubmit} className="space-y-4">
        <Segmented
          label="Listing type"
          value={form.kind}
          onChange={(kind) => setForm({ ...form, kind })}
          options={[
            ['product', 'Product'],
            ['service', 'Service'],
          ]}
        />

        {form.image ? (
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black">
            <img src={form.image} alt="Listing preview" className="max-h-64 w-full object-contain" />
            <button
              type="button"
              onClick={() => setForm({ ...form, image: '' })}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
              aria-label="Remove photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex min-h-[132px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] text-sm text-gray-400 transition-colors hover:border-white/30 hover:text-white focus-within:border-brand">
            {imageBusy ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span>{imageBusy ? 'Processing photo…' : 'Add a photo'}</span>
            <span className="text-xs text-gray-600">Listings with photos sell faster</span>
            <input type="file" accept="image/*" className="sr-only" onChange={handleImage} disabled={imageBusy} />
          </label>
        )}

        <Field label="Title">
          <input
            required
            maxLength={100}
            placeholder={form.kind === 'product' ? 'e.g. HP EliteBook 840, 8GB RAM' : 'e.g. Braiding & hair styling'}
            className={inputClass}
            value={form.title}
            onChange={set('title')}
          />
        </Field>

        <Field label="Description" hint={`${form.description.length}/1000`}>
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Condition, what's included, availability…"
            className={inputClass}
            value={form.description}
            onChange={set('description')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={set('category')}>
              {uni.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Price (${campus.currency})`}>
            <input
              required
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="0"
              className={inputClass}
              value={form.price}
              onChange={set('price')}
            />
          </Field>
        </div>

        <Segmented
          label="Pricing"
          value={form.priceType}
          onChange={(priceType) => setForm({ ...form, priceType })}
          options={[
            ['Fixed', 'Fixed price'],
            ['Negotiable', 'Negotiable'],
          ]}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location">
            <input
              placeholder={uni.locations[0] ? `e.g. ${uni.locations[0]}` : 'e.g. Hall 6'}
              list={LOCATIONS_LIST_ID}
              className={inputClass}
              value={form.location}
              onChange={set('location')}
            />
          </Field>
          <Field label="Contact phone">
            <input required type="tel" inputMode="tel" className={inputClass} value={form.phone} onChange={set('phone')} />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 ml-1 block text-xs font-medium text-gray-400">Meeting point on the map (optional)</span>
          <LocationPicker value={form.geo} onChange={setGeo} center={uni.map} zoom={uni.map.zoom} />
          <p className="ml-1 mt-1.5 text-xs text-gray-500">Buyers get directions here. Pick a public spot on campus.</p>
        </div>

        <Notice>{error}</Notice>
      </form>
    </Modal>
  );
}
