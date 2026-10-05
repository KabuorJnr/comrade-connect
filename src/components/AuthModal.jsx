import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, profileDoc } from '../lib/firebase';
import { LOCATIONS_LIST_ID } from '../lib/campus';
import { ROLES, normalizePhone, authErrorMessage } from '../lib/utils';
import { Modal, Field, Button, Notice, inputClass } from './ui';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'student',
  businessName: '',
  phone: '',
  location: '',
};

export default function AuthModal({ open, mode, setMode, onClose }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const switchMode = (next) => {
    setMode(next);
    setError('');
    setInfo('');
  };
  const close = () => {
    setForm(emptyForm);
    setError('');
    setInfo('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setBusy(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, form.email.trim());
        setInfo('Password reset link sent. Check your email.');
        return;
      }
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
        close();
        return;
      }

      const phone = normalizePhone(form.phone);
      if (!form.name.trim()) throw new Error('Please enter your name.');
      if (!phone) throw new Error('Enter a valid Kenyan phone number, e.g. 0712345678.');
      if (form.role !== 'student' && !form.businessName.trim()) {
        throw new Error('Please enter your business or shop name.');
      }

      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      await updateProfile(cred.user, { displayName: form.name.trim() });
      await setDoc(profileDoc(cred.user.uid), {
        uid: cred.user.uid,
        name: form.name.trim(),
        role: form.role,
        businessName: form.businessName.trim(),
        phone,
        location: form.location.trim(),
        bio: '',
        isPro: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      close();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const titles = { signin: 'Welcome back', register: 'Create your account', reset: 'Reset password' };

  return (
    <Modal open={open} onClose={close} title={titles[mode]}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <>
            <div>
              <span className="mb-1.5 ml-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                I am a
              </span>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ROLES).map(([key, role]) => (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setForm({ ...form, role: key })}
                    className={`rounded-2xl border px-2 py-3 text-center transition-colors ${
                      form.role === key
                        ? 'border-brand bg-brand/15 text-white'
                        : 'border-white/5 bg-[#1d1d1f] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{role.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-gray-500">{role.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
            <Field label="Full name">
              <input required className={inputClass} value={form.name} onChange={set('name')} autoComplete="name" />
            </Field>
            {form.role !== 'student' && (
              <Field label="Business / shop name">
                <input required className={inputClass} value={form.businessName} onChange={set('businessName')} />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone (M-Pesa / WhatsApp)">
                <input
                  required
                  type="tel"
                  placeholder="0712 345 678"
                  className={inputClass}
                  value={form.phone}
                  onChange={set('phone')}
                  autoComplete="tel"
                />
              </Field>
              <Field label="Location">
                <input
                  placeholder="e.g. Hall 6"
                  list={LOCATIONS_LIST_ID}
                  className={inputClass}
                  value={form.location}
                  onChange={set('location')}
                />
              </Field>
            </div>
          </>
        )}

        <Field label="Email">
          <input
            required
            type="email"
            className={inputClass}
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
          />
        </Field>

        {mode !== 'reset' && (
          <Field label="Password" hint={mode === 'register' ? 'At least 6 characters.' : undefined}>
            <input
              required
              type="password"
              minLength={6}
              className={inputClass}
              value={form.password}
              onChange={set('password')}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </Field>
        )}

        <Notice>{error}</Notice>
        <Notice kind="success">{info}</Notice>

        <Button type="submit" loading={busy} className="w-full">
          {mode === 'signin' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
        </Button>

        <div className="space-y-2 pt-1 text-center text-sm text-gray-500">
          {mode === 'signin' && (
            <>
              <p>
                New here?{' '}
                <button type="button" className="font-medium text-brand-light" onClick={() => switchMode('register')}>
                  Create an account
                </button>
              </p>
              <button type="button" className="text-xs text-gray-500 hover:text-gray-300" onClick={() => switchMode('reset')}>
                Forgot password?
              </button>
            </>
          )}
          {mode !== 'signin' && (
            <p>
              Already registered?{' '}
              <button type="button" className="font-medium text-brand-light" onClick={() => switchMode('signin')}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
