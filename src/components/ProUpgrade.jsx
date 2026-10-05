import { useState } from 'react';
import { CheckCircle, Smartphone } from 'lucide-react';
import { API_URL } from '../lib/firebase';
import { normalizePhone } from '../lib/utils';
import { campus } from '../lib/campus';
import { Modal, Button, Field, Notice, inputClass } from './ui';

const PRO_PRICE = campus.pro.price;

// Optional Pro subscription via M-Pesa STK push. Selling is free; Pro only adds a badge.
export default function ProUpgrade({ open, onClose, profile, user }) {
  const [phone, setPhone] = useState(profile?.phone || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const pay = async () => {
    setError('');
    const number = normalizePhone(phone);
    if (!number) return setError('Enter a valid Safaricom number, e.g. 0712345678.');
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/stkpush`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: number, amount: PRO_PRICE, accountReference: user?.uid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Payment request failed.');
      setSent(true);
    } catch (err) {
      setError(
        err instanceof TypeError
          ? 'Payment server is unreachable right now. Please try again later.'
          : err.message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Seller Pro">
      {sent ? (
        <div className="space-y-4 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <p className="text-sm text-gray-300">
            Check your phone and enter your M-Pesa PIN to complete the {campus.currency} {PRO_PRICE} payment. Your Pro badge is
            activated once the payment is confirmed.
          </p>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border border-white/5 bg-[#1d1d1f] p-5">
            <div className="mb-3 flex items-center justify-between border-b border-white/5 pb-3">
              <span className="font-medium text-gray-300">Monthly plan</span>
              <span className="text-xl font-semibold text-white">{campus.currency} {PRO_PRICE}</span>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand" /> Verified Pro badge on your shop and listings
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand" /> Pro listings shown first in search
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">Listing items is free for every registered account.</p>
          </div>
          <Field label="M-Pesa number">
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-green-500" />
              <input
                type="tel"
                className={`${inputClass} pl-10`}
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </Field>
          <Notice>{error}</Notice>
          <Button variant="success" loading={busy} className="w-full" onClick={pay}>
            Pay {campus.currency} {PRO_PRICE} with M-Pesa
          </Button>
        </div>
      )}
    </Modal>
  );
}
