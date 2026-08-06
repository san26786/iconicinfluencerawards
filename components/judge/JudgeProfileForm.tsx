'use client';

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { Save, Loader2, CheckCircle2, Camera, X } from 'lucide-react';
import Image from 'next/image';

type Judge = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  expertise: string | null;
  bio: string | null;
  linkedin: string | null;
  facebook: string | null;
  twitter: string | null;
  profile_pic_url: string | null;
};

const inputBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50">{label}</span>
      {children}
    </label>
  );
}

function ProfilePicUpload({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/judge/profile-pic', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onChange(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-white/50">Profile Photo</p>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 flex-shrink-0">
          {value ? (
            <>
              <Image src={value} alt="Profile photo" fill className="rounded-full object-cover ring-2 ring-gold/30" />
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={disabled}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-white/15 bg-white/[0.03] text-white/25">
              <Camera className="h-7 w-7" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
            disabled={disabled || uploading}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled || uploading}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-white/70 transition-colors hover:border-gold/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {uploading ? 'Uploading…' : value ? 'Change photo' : 'Upload photo'}
          </button>
          <p className="mt-1.5 text-xs text-white/30">JPG, PNG or WEBP · max 3 MB</p>
          {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
        </div>
      </div>
    </div>
  );
}

export function JudgeProfileForm({ judge }: { judge: Judge }) {
  const [status,  setStatus]  = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error,   setError]   = useState('');
  const [picUrl,  setPicUrl]  = useState(judge.profile_pic_url ?? '');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('saving');
    setError('');

    const fd = new FormData(e.currentTarget);
    const payload = {
      judgeId:       judge.id,
      phone:         String(fd.get('phone')     ?? '').trim() || null,
      company:       String(fd.get('company')   ?? '').trim() || null,
      jobTitle:      String(fd.get('jobTitle')  ?? '').trim() || null,
      expertise:     String(fd.get('expertise') ?? '').trim() || null,
      bio:           String(fd.get('bio')       ?? '').trim() || null,
      linkedin:      String(fd.get('linkedin')  ?? '').trim() || null,
      facebook:      String(fd.get('facebook')  ?? '').trim() || null,
      twitter:       String(fd.get('twitter')   ?? '').trim() || null,
      profilePicUrl: picUrl || null,
    };

    try {
      const res  = await fetch('/api/judge/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error');
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  const saving = status === 'saving';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl glass p-7 sm:p-10">

      <ProfilePicUpload value={picUrl} onChange={setPicUrl} disabled={saving} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name">
          <input value={judge.first_name} readOnly className={`${inputBase} cursor-not-allowed opacity-50`} />
        </Field>
        <Field label="Last name">
          <input value={judge.last_name} readOnly className={`${inputBase} cursor-not-allowed opacity-50`} />
        </Field>
        <Field label="Email">
          <input value={judge.email} readOnly className={`${inputBase} cursor-not-allowed opacity-50 col-span-full`} />
        </Field>
        <Field label="Phone number">
          <input name="phone" type="tel" defaultValue={judge.phone ?? ''} placeholder="07000 000000" className={inputBase} />
        </Field>
        <Field label="Company">
          <input name="company" type="text" defaultValue={judge.company ?? ''} placeholder="Your company" className={inputBase} />
        </Field>
        <Field label="Job title">
          <input name="jobTitle" type="text" defaultValue={judge.job_title ?? ''} placeholder="CEO, Director…" className={inputBase} />
        </Field>
      </div>

      <Field label="Area of expertise">
        <input name="expertise" type="text" defaultValue={judge.expertise ?? ''} placeholder="e.g. Technology, Finance…" className={inputBase} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="LinkedIn profile URL">
          <input name="linkedin" type="url" defaultValue={judge.linkedin ?? ''} placeholder="https://linkedin.com/in/yourname" className={inputBase} />
        </Field>
        <Field label="Facebook profile URL">
          <input name="facebook" type="url" defaultValue={judge.facebook ?? ''} placeholder="https://facebook.com/yourname" className={inputBase} />
        </Field>
        <Field label="Twitter / X profile URL">
          <input name="twitter" type="url" defaultValue={judge.twitter ?? ''} placeholder="https://x.com/yourhandle" className={inputBase} />
        </Field>
      </div>

      <Field label="Bio / Why you judge">
        <textarea name="bio" rows={4} defaultValue={judge.bio ?? ''} placeholder="About you…" className={`${inputBase} resize-none`} />
      </Field>

      {status === 'error' && <p className="text-sm text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-ink shadow-gold disabled:opacity-60"
      >
        {saving              ? <Loader2 className="h-4 w-4 animate-spin" /> :
         status === 'saved'  ? <CheckCircle2 className="h-4 w-4" /> :
                               <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : status === 'saved' ? 'Saved!' : 'Save Changes'}
      </button>
    </form>
  );
}
