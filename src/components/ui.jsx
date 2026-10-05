import { cloneElement, isValidElement, useEffect, useId, useRef } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, BadgeCheck, Shield, Zap } from 'lucide-react';
import { initials } from '../lib/utils';

export function Modal({ open, onClose, title, subtitle, children, wide = false, footer }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const previouslyFocused = document.activeElement;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="animate-fade-backdrop fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`animate-slide-up relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-[#0e0e10] shadow-2xl outline-none sm:rounded-[1.75rem] ${
          wide ? 'sm:max-w-lg' : 'sm:max-w-md'
        }`}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" aria-hidden="true" />
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-3 pt-4 sm:pt-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight text-white">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="overflow-y-auto overscroll-contain px-6 pb-6">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-white/5 bg-[#0e0e10] px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
        {!footer && <div className="h-[env(safe-area-inset-bottom)] shrink-0" />}
      </div>
    </div>
  );
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children }) {
  const noteId = useId();
  const note = error || hint;
  // Hints are linked with aria-describedby (not part of the label) so the field's name stays short.
  const control =
    note && isValidElement(children) ? cloneElement(children, { 'aria-describedby': noteId, 'aria-invalid': Boolean(error) || undefined }) : children;
  return (
    <div>
      <label className="block">
        <span className="mb-1.5 ml-1 block text-xs font-medium text-gray-400">{label}</span>
        {control}
      </label>
      {note && (
        <p id={noteId} className={`ml-1 mt-1 text-xs ${error ? 'text-red-400' : 'text-gray-500'}`}>
          {note}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'w-full min-h-[46px] rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3 text-[15px] text-white placeholder-gray-500 outline-none transition-colors focus:border-brand/60 focus:bg-white/[0.07] disabled:opacity-60';

export function Button({ children, loading, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand/90',
    light: 'bg-white text-black hover:bg-gray-200',
    ghost: 'bg-white/[0.06] text-white hover:bg-white/10',
    outline: 'border border-white/15 text-white hover:bg-white/5',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    'danger-ghost': 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
    success: 'bg-green-600 text-white hover:bg-green-500',
  };
  const sizes = {
    sm: 'min-h-[36px] px-3.5 text-xs',
    md: 'min-h-[46px] px-5 text-sm',
  };
  return (
    <button
      type="button"
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Loading" /> : children}
    </button>
  );
}

export function Notice({ kind = 'error', children }) {
  if (!children) return null;
  const isError = kind === 'error';
  const Icon = isError ? AlertCircle : CheckCircle;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
        isError ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-green-500/30 bg-green-500/10 text-green-300'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Avatar({ name, src, size = 'h-10 w-10 text-xs', className = '', style }) {
  return (
    <div
      style={style}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-zinc-600 to-zinc-800 font-semibold text-white ${size} ${className}`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(name)}
    </div>
  );
}

export function Tag({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-white/[0.06] text-gray-400',
    brand: 'bg-brand/15 text-brand-light',
    green: 'bg-green-500/15 text-green-400',
    red: 'bg-red-500/15 text-red-300',
    amber: 'bg-amber-500/15 text-amber-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// Role + trust markers shown next to a seller's name.
export function SellerBadges({ role, verified, pro, admin }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {verified && (
        <span className="inline-flex items-center gap-0.5 text-brand-light" title="Verified by the university">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Verified</span>
        </span>
      )}
      {role && <Tag>{role}</Tag>}
      {pro && (
        <Tag tone="amber">
          <Zap className="h-3 w-3" aria-hidden="true" /> Pro
        </Tag>
      )}
      {admin && (
        <Tag tone="brand">
          <Shield className="h-3 w-3" aria-hidden="true" /> Admin
        </Tag>
      )}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="px-6 py-16 text-center">
      {Icon && (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04]">
          <Icon className="h-6 w-6 text-gray-500" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-200">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-xs text-sm text-gray-500">{text}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex justify-center py-20" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-gray-500" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} aria-hidden="true" />;
}

export function ListingSkeletons({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="status" aria-label="Loading listings">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-3">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RowSkeletons({ count = 4 }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-4">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Pill-style single choice control.
export function Segmented({ options, value, onChange, label, className = '' }) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex gap-1 rounded-full bg-white/[0.05] p-1 ${className}`}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`min-h-[34px] flex-1 rounded-full px-3 text-xs font-semibold transition-colors ${
            value === v ? 'bg-white text-black' : 'text-gray-400 hover:text-white'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...props}
      className={`min-h-[34px] shrink-0 whitespace-nowrap rounded-full px-4 text-xs font-medium transition-colors ${
        active ? 'bg-white text-black' : 'bg-white/[0.05] text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return <section className={`rounded-3xl border border-white/[0.06] bg-white/[0.03] p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ children, action }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-1">
      <h2 className="text-base font-semibold text-white">{children}</h2>
      {action}
    </div>
  );
}
