import { useState } from 'react';
import { updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
  MapPin,
  Phone,
  MessageCircle,
  Package,
  Wrench,
  Pencil,
  Trash2,
  CheckCircle,
  RotateCcw,
  ChevronRight,
  ShieldAlert,
  BadgeCheck,
  Navigation,
} from 'lucide-react';
import { listingDoc } from '../lib/firebase';
import { campus } from '../lib/campus';
import { useUniversity } from '../lib/university';
import { useFeedback } from '../lib/feedback';
import { formatPrice, timeAgo, whatsappLink, directionsUrl } from '../lib/utils';
import { PlaceMap } from './LazyMaps';
import { Modal, Button, Avatar, SellerBadges, Notice, Tag } from './ui';

function Placeholder({ kind, className = '' }) {
  const Icon = kind === 'service' ? Wrench : Package;
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-brand/25 to-brand/5 ${className}`}>
      <Icon className="h-8 w-8 text-brand-light/70" aria-hidden="true" />
    </div>
  );
}

export function ListingCard({ listing, onOpen }) {
  const sold = listing.status === 'sold';
  return (
    <button
      type="button"
      onClick={() => onOpen(listing)}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] text-left transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black">
        {listing.image ? (
          <img
            src={listing.image}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] ${sold ? 'opacity-50' : ''}`}
          />
        ) : (
          <Placeholder kind={listing.kind} className={`h-full w-full ${sold ? 'opacity-50' : ''}`} />
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {sold && <span className="rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Sold</span>}
          {listing.kind === 'service' && !sold && (
            <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">Service</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="text-[15px] font-bold text-white">
          {formatPrice(listing.price)}
          {listing.priceType === 'Negotiable' && <span className="ml-1 text-[11px] font-normal text-gray-500">neg.</span>}
        </div>
        <h3 className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-gray-300">{listing.title}</h3>
        <div className="mt-auto flex items-center gap-1 pt-2 text-[11px] text-gray-500">
          {listing.sellerVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand-light" aria-label="Verified seller" />}
          <span className="truncate">{listing.location || listing.seller || 'Campus'}</span>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">{timeAgo(listing.createdAt)}</span>
        </div>
      </div>
    </button>
  );
}

export function ListingDetail({ listing, onClose, isOwner, isAdmin, onEdit, onViewSeller, onRequireAuth, isGuest }) {
  const uni = useUniversity();
  const { confirm, toast } = useFeedback();
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
    run('sold', async () => {
      await updateDoc(listingDoc(uni.id, listing.id), {
        status: sold ? 'available' : 'sold',
        updatedAt: serverTimestamp(),
      });
      toast(sold ? 'Listing is available again' : 'Marked as sold');
    });

  const remove = async (asAdmin) => {
    const ok = await confirm({
      title: asAdmin ? 'Remove this listing?' : 'Delete this listing?',
      message: asAdmin
        ? `This removes "${listing.title}" from ${uni.shortName} for everyone. Use this for listings that break the rules.`
        : 'This cannot be undone.',
      confirmText: asAdmin ? 'Remove' : 'Delete',
      danger: true,
    });
    if (!ok) return;
    run('delete', async () => {
      await deleteDoc(listingDoc(uni.id, listing.id));
      toast(asAdmin ? 'Listing removed' : 'Listing deleted');
      onClose();
    });
  };

  return (
    <Modal open onClose={onClose} title={listing.kind === 'service' ? 'Service' : 'Product'} wide>
      <div className="-mx-6 mb-5 bg-black">
        {listing.image ? (
          <img src={listing.image} alt={listing.title} className="max-h-[22rem] w-full object-contain" />
        ) : (
          <Placeholder kind={listing.kind} className="h-40 w-full" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Tag>{listing.category}</Tag>
        {listing.priceType === 'Negotiable' && <Tag tone="brand">Negotiable</Tag>}
        {sold && <Tag tone="red">Sold</Tag>}
      </div>
      <h3 className="mt-2 text-xl font-semibold leading-tight tracking-tight text-white">{listing.title}</h3>
      <p className="mt-1 text-2xl font-bold text-white">{formatPrice(listing.price)}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {listing.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {listing.location}
          </span>
        )}
        <span>Posted {timeAgo(listing.createdAt)}</span>
      </div>

      {listing.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-300">{listing.description}</p>
      )}

      {listing.geo && (
        <div className="mt-5">
          <PlaceMap point={listing.geo} />
          <a
            href={directionsUrl(listing.geo)}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white/[0.06] px-3.5 text-xs font-semibold text-white hover:bg-white/10"
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> Directions
          </a>
        </div>
      )}

      <button
        type="button"
        onClick={() => listing.sellerId && onViewSeller(listing.sellerId)}
        disabled={!listing.sellerId}
        className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3 text-left enabled:hover:bg-white/[0.06]"
      >
        <Avatar name={listing.seller} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{listing.seller || 'Comrade'}</div>
          <SellerBadges role={listing.sellerRole} verified={listing.sellerVerified} pro={listing.sellerPro} />
        </div>
        {listing.sellerId && <ChevronRight className="h-4 w-4 text-gray-500" aria-label="View shop" />}
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
            <Button variant="danger-ghost" loading={busy === 'delete'} onClick={() => remove(false)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        ) : isGuest ? (
          <Button className="w-full" onClick={onRequireAuth}>
            Sign in to contact the seller
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:+${listing.phone?.replace(/^\+/, '')}`}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white hover:bg-brand/90"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-semibold text-black hover:bg-[#25D366]/90"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        )}
        {isAdmin && !isOwner && (
          <Button variant="danger-ghost" size="sm" className="w-full" loading={busy === 'delete'} onClick={() => remove(true)}>
            <ShieldAlert className="h-4 w-4" /> Remove listing (admin)
          </Button>
        )}
      </div>
    </Modal>
  );
}
