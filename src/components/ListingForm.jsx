import { useState } from 'react';
import { addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ImagePlus, Trash2 } from 'lucide-react';
import { listingsCol, listingDoc } from '../lib/firebase';
import { CATEGORIES, normalizePhone, compressImage } from '../lib/utils';
import { Modal, Field, Button, Notice, inputClass } from './ui';

// Create a new listing, or edit one the current user owns (pass `listing`).
export default function ListingForm({ open, onClose, user, profile, listing, onSaved }) {
  const editing = Boolean(listing);
  const [form, setForm] = useState(() => ({
    kind: listing?.kind || 'product',
    title: listing?.title || '',
    description: listing?.description || '',
    category: listing?.category || CATEGORIES[0],
    price: listing?.price ?? '',
    priceType: listing?.priceType || 'Fixed',
    location: listing?.location || profile?.location || '',
    phone: listing?.phone || profile?.phone || '',
    image: listing?.image || '',
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

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
    if (!Number.isFinite(price) || price < 0) return setError('Enter a valid price.');
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
        seller: profile?.businessName || profile?.name || user.displayName || 'Comrade',
        sellerRole: profile?.role || 'student',
        sellerPro: Boolean(profile?.isPro),
        updatedAt: serverTimestamp(),
      };
      if (editing) {
        await updateDoc(listingDoc(listing.id), data);
      } else {
        await addDoc(listingsCol(), {
          ...data,
          sellerId: user.uid,
          userId: user.uid,
          status: 'available',
          createdAt: serverTimestamp(),
        });
      }
      onSaved?.(editing ? 'Listing updated.' : 'Your listing is live on the marketplace.');
      onClose();
    } catch (err) {
      setError(
        err.code === 'permission-denied'
          ? 'You do not have permission to save this listing. Make sure you are signed in.'
          : err.message || 'Could not save listing.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit listing' : 'Sell something'} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-1 rounded-full bg-[#1d1d1f] p-1">
          {[
            ['product', 'Product'],
            ['service', 'Service'],
          ].map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setForm({ ...form, kind: value })}
              className={`rounded-full py-2 text-sm font-medium transition-colors ${
                form.kind === value ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div>
          {form.image ? (
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <img src={form.image} alt="Listing preview" className="max-h-60 w-full object-cover" />
              <button
                type="button"
                onClick={() => setForm({ ...form, image: '' })}
                className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white hover:bg-black"
                aria-label="Remove photo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-[#1d1d1f] py-8 text-sm text-gray-400 hover:text-white">
              <ImagePlus className="h-6 w-6" />
              {imageBusy ? 'Processing photo…' : 'Add a photo (optional)'}
              <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={imageBusy} />
            </label>
          )}
        </div>

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

        <Field label="Description">
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="Condition, what's included, availability…"
            className={inputClass}
            value={form.description}
            onChange={set('description')}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (Ksh)">
            <input
              required
              type="number"
              min="0"
              inputMode="numeric"
              className={inputClass}
              value={form.price}
              onChange={set('price')}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Pricing">
            <select className={inputClass} value={form.priceType} onChange={set('priceType')}>
              <option value="Fixed">Fixed</option>
              <option value="Negotiable">Negotiable</option>
            </select>
          </Field>
          <Field label="Location">
            <input placeholder="e.g. Hall 6" className={inputClass} value={form.location} onChange={set('location')} />
          </Field>
        </div>

        <Field label="Contact phone">
          <input required type="tel" className={inputClass} value={form.phone} onChange={set('phone')} />
        </Field>

        <Notice>{error}</Notice>

        <Button type="submit" variant="light" loading={busy} disabled={imageBusy} className="w-full">
          {editing ? 'Save changes' : 'Publish listing'}
        </Button>
      </form>
    </Modal>
  );
}
