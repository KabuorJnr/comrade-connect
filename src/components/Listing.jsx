import { useState } from 'react';
import { updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, Phone, MessageCircle, Package, Wrench, Pencil, Trash2, CheckCircle, RotateCcw, Store } from 'lucide-react';
import { listingDoc } from '../lib/firebase';
import { campus } from '../lib/campus';
import { formatPrice, timeAgo, whatsappLink } from '../lib/utils';
import { Modal, Button, Avatar, RoleBadge, Notice } from './ui';

export function ListingCard({ listing, onOpen }) {
  const sold = listing.status === 'sold';
  const KindIcon = listing.kind === 'service' ? Wrench : Package;
  return (
    <button
      type="button"
      onClick={() => onOpen(listing)}
      className="group w-full overflow-hidden rounded-3xl border border-white/5 bg-[#1d1d1f] text-left transition-transform duration-300 hover:scale-[1.01]"
    >
      {listing.image && (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
          <img src={listing.image} alt={listing.title} loading="lazy" className="h-full w-full object-cover" />
          {sold && (
            <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Sold
            </span>
          )}
        </div>
      )}
      <div className="p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <KindIcon className="h-3 w-3" /> {listing.category}
          </span>
          <span className="text-[10px] text-gray-500">{timeAgo(listing.createdAt, '')}</span>
        </div>
        <h3 className="mb-1 text-lg font-bold leading-tight tracking-tight text-white">{listing.title}</h3>
        {listing.description && <p className="mb-4 line-clamp-2 text-sm text-gray-400">{listing.description}</p>}
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">
              {formatPrice(listing.price)}
              {listing.priceType === 'Negotiable' && <span className="ml-1 text-xs font-normal text-gray-500">neg.</span>}
            </div>
            <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
              <Store className="h-3 w-3" /> {listing.seller || 'Comrade'}
              {listing.sellerPro && <RoleBadge pro />}
            </div>
          </div>
          {!listing.image && sold ? (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase text-gray-300">Sold</span>
          ) : (
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black">View</span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ListingDetail({ listing, onClose, isOwner, onEdit, onViewSeller, onRequireAuth, isGuest }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  if (!listing) return null;

  const sold = listing.status === 'sold';
  const wa = whatsappLink(listing.phone, `Hi, I saw "${listing.title}" on ${campus.appName}. Is it still available?`);

  const run = async (label, fn) => {
    setBusy(label);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Action failed.');
    } finally {
      setBusy('');
    }
  };

  const toggleSold = () =>
    run('sold', () =>
      updateDoc(listingDoc(listing.id), {
        status: sold ? 'available' : 'sold',
        updatedAt: serverTimestamp(),
      }),
    );

  const remove = () => {
    if (!window.confirm('Delete this listing permanently?')) return;
    run('delete', async () => {
      await deleteDoc(listingDoc(listing.id));
      onClose();
    });
  };

  return (
    <Modal open onClose={onClose} title={listing.kind === 'service' ? 'Service' : 'Product'} wide>
      {listing.image && (
        <img src={listing.image} alt={listing.title} className="mb-5 max-h-80 w-full rounded-2xl object-cover" />
      )}
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{listing.category}</div>
      <h3 className="text-2xl font-semibold tracking-tight text-white">{listing.title}</h3>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-xl font-semibold text-white">{formatPrice(listing.price)}</span>
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-gray-400">{listing.priceType || 'Fixed'}</span>
        {sold && <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-300">Sold</span>}
      </div>
      {listing.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-300">{listing.description}</p>
      )}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {listing.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {listing.location}
          </span>
        )}
        <span>Posted {timeAgo(listing.createdAt)}</span>
      </div>

      <button
        type="button"
        onClick={() => listing.sellerId && onViewSeller(listing.sellerId)}
        disabled={!listing.sellerId}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-[#1d1d1f] p-4 text-left enabled:hover:bg-[#252528]"
      >
        <Avatar name={listing.seller} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{listing.seller || 'Comrade'}</div>
          <RoleBadge role={listing.sellerRole} pro={listing.sellerPro} />
        </div>
        {listing.sellerId && <span className="text-xs text-brand-light">View shop</span>}
      </button>

      <div className="mt-5 space-y-3">
        <Notice>{error}</Notice>
        {isOwner ? (
          <div className="grid grid-cols-3 gap-2">
            <Button variant="ghost" onClick={() => onEdit(listing)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button variant="ghost" loading={busy === 'sold'} onClick={toggleSold}>
              {sold ? <RotateCcw className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              {sold ? 'Relist' : 'Sold'}
            </Button>
            <Button variant="danger" loading={busy === 'delete'} onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        ) : isGuest ? (
          <Button className="w-full" onClick={onRequireAuth}>
            Sign in to contact the seller
          </Button>
        ) : (
          <>
            <a
              href={`tel:+${listing.phone?.replace(/^\+/, '')}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-semibold text-white hover:bg-brand/90"
            >
              <Phone className="h-4 w-4" /> Call seller
            </a>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] py-3 text-sm font-semibold text-green-500 hover:bg-[#2c2c2e]"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
