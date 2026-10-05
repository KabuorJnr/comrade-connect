import { useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { FeedbackContext } from '../lib/feedback';
import { Button, Modal } from './ui';

export default function FeedbackProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);
  const resolver = useRef(null);
  const nextId = useRef(0);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog(options);
      }),
    [],
  );

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }, []);

  const toast = useCallback((message, kind = 'success') => {
    const id = ++nextId.current;
    setToasts((list) => [...list.slice(-2), { id, message, kind }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3500);
  }, []);

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-[80] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = t.kind === 'error' ? AlertCircle : CheckCircle;
          return (
            <div
              key={t.id}
              className={`animate-toast pointer-events-auto flex max-w-sm items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-2xl backdrop-blur-xl ${
                t.kind === 'error'
                  ? 'border-red-500/30 bg-red-950/90 text-red-200'
                  : 'border-white/10 bg-[#1c1c1e]/95 text-white'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${t.kind === 'error' ? 'text-red-400' : 'text-green-400'}`} />
              {t.message}
            </div>
          );
        })}
      </div>

      <Modal
        open={Boolean(dialog)}
        onClose={() => close(false)}
        title={dialog?.title || 'Are you sure?'}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="ghost" onClick={() => close(false)}>
              {dialog?.cancelText || 'Cancel'}
            </Button>
            <Button variant={dialog?.danger ? 'danger' : 'primary'} onClick={() => close(true)}>
              {dialog?.confirmText || 'Continue'}
            </Button>
          </div>
        }
      >
        {dialog?.message && <p className="text-sm leading-relaxed text-gray-400">{dialog.message}</p>}
      </Modal>
    </FeedbackContext.Provider>
  );
}
