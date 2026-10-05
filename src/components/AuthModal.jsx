import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';
import { auth, profileDoc, userDoc } from '../lib/firebase';
import { campus, LOCATIONS_LIST_ID } from '../lib/campus';
import { useUniversity } from '../lib/university';
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
  const uni = useUniversity();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      if (!phone) throw new Error('Enter a valid Kenyan phone number, e.g. 0712 345 678.');
      if (form.role !== 'student' && !form.businessName.trim()) {
        throw new Error('Please enter your business or shop name.');
      }

      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      await updateProfile(cred.user, { displayName: form.name.trim() });
      await setDoc(profileDoc(uni.id, cred.user.uid), {
        uid: cred.user.uid,
        name: form.name.trim(),
        role: form.role,
        businessName: form.role === 'student' ? '' : form.businessName.trim(),
        phone,
        location: form.location.trim(),
        bio: '',
        isPro: false,
        verified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(userDoc(cred.user.uid), { university: uni.id, updatedAt: serverTimestamp() });
      close();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const titles = {
    signin: 'Welcome back',
    register: `Join ${uni.shortName}`,
    reset: 'Reset your password',
  };
  const subtitles = {
    signin: `Sign in to ${campus.appName}`,
    register: 'Sell, post and contact sellers on campus',
    reset: "We'll email you a reset link",
  };

  return (
    <Modal open={open} onClose={close} title={titles[mode]} subtitle={subtitles[mode]}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
        {mode === 'register' && (
          <>
            <fieldset>
              <legend className="mb-1.5 ml-1 text-xs font-medium text-gray-400">I'm joining as a</legend>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ROLES).map(([key, role]) => (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={form.role === key}
                    onClick={() => setForm({ ...form, role: key })}
                    className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                      form.role === key
                        ? 'border-brand bg-brand/15 text-white'
                        : 'border-white/5 bg-white/[0.04] text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{role.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-tight text-gray-500">{role.blurb}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <Field label="Full name">
              <input required className={inputClass} value={form.name} onChange={set('name')} autoComplete="name" />
            </Field>
            {form.role !== 'student' && (
              <Field label="Business or shop name">
                <input required className={inputClass} value={form.businessName} onChange={set('businessName')} />
              </Field>
            )}
            <Field label="Phone (M-Pesa / WhatsApp)" hint="Buyers use this to call or WhatsApp you.">
              <input
                required
                type="tel"
                inputMode="tel"
                placeholder="0712 345 678"
                className={inputClass}
                value={form.phone}
                onChange={set('phone')}
                autoComplete="tel"
              />
            </Field>
            <Field label="Where on campus? (optional)">
              <input
                placeholder={uni.locations[0] ? `e.g. ${uni.locations[0]}` : 'e.g. Hall 6'}
                list={LOCATIONS_LIST_ID}
                className={inputClass}
                value={form.location}
                onChange={set('location')}
              />
            </Field>
          </>
        )}

        <Field label="Email">
          <input
            required
            type="email"
            inputMode="email"
            className={inputClass}
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
          />
        </Field>

        {mode !== 'reset' && (
          <Field label="Password" hint={mode === 'register' ? 'At least 6 characters.' : undefined}>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                minLength={6}
                className={`${inputClass} pr-12`}
                value={form.password}
                onChange={set('password')}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
        )}

        <Notice>{error}</Notice>
        <Notice kind="success">{info}</Notice>

        <Button type="submit" loading={busy} className="w-full">
          {mode === 'signin' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Send reset link'}
        </Button>

        <div className="space-y-3 pt-1 text-center text-sm text-gray-500">
          {mode === 'signin' && (
            <>
              {uni.id ? (
                <p>
                  New here?{' '}
                  <button type="button" className="font-semibold text-brand-light" onClick={() => switchMode('register')}>
                    Create an account
                  </button>
                </p>
              ) : (
                <p>New here? Choose your university first, then create an account.</p>
              )}
              <button type="button" className="text-xs text-gray-500 underline-offset-2 hover:text-gray-300 hover:underline" onClick={() => switchMode('reset')}>
                Forgot password?
              </button>
            </>
          )}
          {mode !== 'signin' && (
            <p>
              Already have an account?{' '}
              <button type="button" className="font-semibold text-brand-light" onClick={() => switchMode('signin')}>
                Sign in
              </button>
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
