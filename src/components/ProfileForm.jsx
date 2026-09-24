import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, profileDoc } from '../lib/firebase';
import { ROLES, normalizePhone } from '../lib/utils';
import { Modal, Field, Button, Notice, inputClass } from './ui';

// Edits the signed-in user's public seller profile (also used to finish a profile that failed to save at sign-up).
export default function ProfileForm({ open, onClose, user, profile }) {
  const [form, setForm] = useState(() => ({
    name: profile?.name || user?.displayName || '',
    role: profile?.role || 'student',
    businessName: profile?.businessName || '',
    phone: profile?.phone || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
  }));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const phone = normalizePhone(form.phone);
    if (!form.name.trim()) return setError('Please enter your name.');
    if (!phone) return setError('Enter a valid Kenyan phone number, e.g. 0712345678.');
    if (form.role !== 'student' && !form.businessName.trim()) {
      return setError('Please enter your business or shop name.');
    }
    setBusy(true);
    try {
      const data = {
        uid: user.uid,
        name: form.name.trim(),
        role: form.role,
        businessName: form.role === 'student' ? '' : form.businessName.trim(),
        phone,
        location: form.location.trim(),
        bio: form.bio.trim().slice(0, 300),
        updatedAt: serverTimestamp(),
      };
      if (!profile) {
        data.createdAt = serverTimestamp();
        data.isPro = false;
      }
      await setDoc(profileDoc(user.uid), data, { merge: true });
      if (auth.currentUser && auth.currentUser.displayName !== data.name) {
        await updateProfile(auth.currentUser, { displayName: data.name });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={profile ? 'Edit profile' : 'Complete your profile'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Account type">
          <select className={inputClass} value={form.role} onChange={set('role')}>
            {Object.entries(ROLES).map(([key, role]) => (
              <option key={key} value={key}>
                {role.label} — {role.blurb}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Full name">
          <input required className={inputClass} value={form.name} onChange={set('name')} />
        </Field>
        {form.role !== 'student' && (
          <Field label="Business / shop name">
            <input required className={inputClass} value={form.businessName} onChange={set('businessName')} />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input required type="tel" className={inputClass} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Location">
            <input className={inputClass} value={form.location} onChange={set('location')} />
          </Field>
        </div>
        <Field label="About you / your shop">
          <textarea rows={3} maxLength={300} className={inputClass} value={form.bio} onChange={set('bio')} />
        </Field>
        <Notice>{error}</Notice>
        <Button type="submit" loading={busy} className="w-full">
          Save profile
        </Button>
      </form>
    </Modal>
  );
}
