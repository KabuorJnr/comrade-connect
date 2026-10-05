import { useState } from 'react';
import { getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { universityDoc } from '../lib/firebase';
import { UNIVERSITY_ID_PATTERN, newUniversityData } from '../lib/university';
import { useFeedback } from '../lib/feedback';
import { Modal, Field, Button, Notice, inputClass } from './ui';

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

// Super admin only: adds a university with default settings, ready for its admins to customise.
export default function NewUniversityModal({ open, onClose, user, onCreated }) {
  const { toast } = useFeedback();
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [id, setId] = useState('');
  const [idTouched, setIdTouched] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const effectiveId = idTouched ? id : slugify(shortName || name);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('Enter the full university name.');
    if (!shortName.trim()) return setError('Enter a short name, e.g. UoN.');
    if (!UNIVERSITY_ID_PATTERN.test(effectiveId)) {
      return setError('The ID must be 2–40 lowercase letters, numbers or dashes.');
    }
    setBusy(true);
    try {
      if ((await getDoc(universityDoc(effectiveId))).exists()) {
        setError(`A university with ID "${effectiveId}" already exists.`);
        return;
      }
      await setDoc(universityDoc(effectiveId), {
        ...newUniversityData(name.trim(), shortName.trim(), user.uid),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast(`${shortName.trim()} added`);
      onCreated(effectiveId);
    } catch (err) {
      setError(err.code === 'permission-denied' ? 'Only the super admin can add universities.' : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add a university" subtitle="You can customise everything after creating it.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <input
            required
            className={inputClass}
            placeholder="e.g. University of Nairobi"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Short name">
          <input
            required
            className={inputClass}
            placeholder="e.g. UoN"
            maxLength={24}
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
        </Field>
        <Field label="ID" hint="Permanent. Used to keep this university's data separate.">
          <input
            className={`${inputClass} font-mono`}
            value={effectiveId}
            onChange={(e) => {
              setIdTouched(true);
              setId(slugify(e.target.value));
            }}
          />
        </Field>
        <Notice>{error}</Notice>
        <Button type="submit" loading={busy} className="w-full">
          Create university
        </Button>
      </form>
    </Modal>
  );
}
