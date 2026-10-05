import { useEffect } from 'react';
import { X, Loader2, AlertCircle, CheckCircle, BadgeCheck } from 'lucide-react';
import { initials } from '../lib/utils';

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/80 backdrop-blur-xl sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-slide-up relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#0b0b0c] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem] ${
          wide ? 'max-w-lg' : 'max-w-md'
        }`}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full bg-[#1d1d1f] p-2 text-gray-400 transition-colors hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 ml-1 block text-xs text-gray-600">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-2xl border border-transparent bg-[#1d1d1f] px-4 py-3 text-sm font-medium text-white placeholder-gray-600 outline-none transition-colors focus:border-[#424245] focus:bg-[#252528]';

export function Button({ children, loading, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-brand text-white hover:bg-brand/90',
    light: 'bg-white text-black hover:bg-gray-200',
    ghost: 'bg-[#1d1d1f] text-white hover:bg-[#2c2c2e]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-500',
  };
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export function Notice({ kind = 'error', children }) {
  if (!children) return null;
  const isError = kind === 'error';
  const Icon = isError ? AlertCircle : CheckCircle;
  return (
    <div
      className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? 'border-red-500/30 bg-red-500/10 text-red-300'
          : 'border-green-500/30 bg-green-500/10 text-green-300'
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export function Avatar({ name, size = 'h-10 w-10 text-xs', className = '' }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-tr from-gray-700 to-gray-600 font-semibold text-white ${size} ${className}`}
    >
      {initials(name)}
    </div>
  );
}

export function RoleBadge({ role, pro }) {
  if (!role && !pro) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {role && (
        <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          {role}
        </span>
      )}
      {pro && <BadgeCheck className="h-4 w-4 text-brand-light" aria-label="Pro seller" />}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="py-20 text-center text-gray-500">
      {Icon && <Icon className="mx-auto mb-4 h-12 w-12 opacity-20" />}
      <h3 className="text-lg font-semibold text-gray-400">{title}</h3>
      {text && <p className="mx-auto mt-1 max-w-xs text-sm">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-20 opacity-50">
      <Loader2 className="h-8 w-8 animate-spin text-white" />
    </div>
  );
}
