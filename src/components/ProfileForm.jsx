import { useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, profileDoc, userDoc } from '../lib/firebase';
import { LOCATIONS_LIST_ID } from '../lib/campus';
import { useUniversity } from '../lib/university';
import { useFeedback } from '../lib/feedback';
import { ROLES, normalizePhone, localPhone } from '../lib/utils';
import { Modal, Field, Button, Notice, inputClass } from './ui';

// Edits the signed-in user's seller profile at the active university (also creates it the first time).
export default function ProfileForm({ open, onClose, user, profile }) {
  const uni = useUniversity();
  const { toast } = useFeedback();
  const [form, setForm] = useState(() => ({
    name: profile?.name || user?.displayName || '',
    role: profile?.role || 'student',
    businessName: profile?.businessName || '',
    phone: localPhone(profile?.phone),
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
    if (!phone) return setError('Enter a valid Kenyan phone number, e.g. 0712 345 678.');
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
        data.verified = false;
      }
      await setDoc(profileDoc(uni.id, user.uid), data, { merge: true });
      await setDoc(userDoc(user.uid), { university: uni.id, updatedAt: serverTimestamp() });
      if (auth.currentUser && auth.currentUser.displayName !== data.name) {
        await updateProfile(auth.currentUser, { displayName: data.name });
      }
      toast(profile ? 'Profile saved' : `You're set up at ${uni.shortName}`);
      onClose();
    } catch (err) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={profile ? 'Edit profile' : `Set up your ${uni.shortName} profile`}
      subtitle={profile ? undefined : 'Buyers see this on your listings and shop page.'}
    >
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
          <input required className={inputClass} value={form.name} onChange={set('name')} autoComplete="name" />
        </Field>
        {form.role !== 'student' && (
          <Field label="Business or shop name">
            <input required className={inputClass} value={form.businessName} onChange={set('businessName')} />
          </Field>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input required type="tel" inputMode="tel" className={inputClass} value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Location">
            <input list={LOCATIONS_LIST_ID} className={inputClass} value={form.location} onChange={set('location')} />
          </Field>
        </div>
        <Field label="About you or your shop" hint={`${form.bio.length}/300`}>
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
