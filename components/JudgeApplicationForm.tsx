'use client';

import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { CheckCircle2, Loader2, Send, AlertCircle, Camera, X } from 'lucide-react';

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={`ml-auto text-xs tabular-nums ${over ? 'text-red-400' : 'text-white/30'}`}>
      {value.length} / {max}
    </span>
  );
}
import Image from 'next/image';

const inputBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/50">
        {label}{required && <span className="text-gold">*</span>}
        {hint}
      </span>
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
        {/* Avatar preview */}
        <div className="relative h-20 w-20 flex-shrink-0">
          {value ? (
            <>
              <Image
                src={value}
                alt="Profile photo"
                fill
                className="rounded-full object-cover ring-2 ring-gold/30"
              />
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

        {/* Upload controls */}
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

export function JudgeApplicationForm() {
  const [status,         setStatus]         = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [error,          setError]          = useState('');
  const [picUrl,         setPicUrl]         = useState('');
  const [shortSummary,   setShortSummary]   = useState('');
  const [profileSummary, setProfileSummary] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setError('');

    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName:      String(fd.get('firstName')      ?? '').trim(),
      lastName:       String(fd.get('lastName')       ?? '').trim(),
      email:          String(fd.get('email')          ?? '').trim(),
      phone:          String(fd.get('phone')          ?? '').trim(),
      workPhone:      String(fd.get('workPhone')      ?? '').trim(),
      company:        String(fd.get('company')        ?? '').trim(),
      jobTitle:       String(fd.get('jobTitle')       ?? '').trim(),
      expertise:      String(fd.get('expertise')      ?? '').trim(),
      shortSummary:   String(fd.get('shortSummary')   ?? '').trim(),
      profileSummary: String(fd.get('profileSummary') ?? '').trim(),
      bio:            String(fd.get('bio')            ?? '').trim(),
      linkedin:       String(fd.get('linkedin')       ?? '').trim(),
      facebook:       String(fd.get('facebook')       ?? '').trim(),
      twitter:        String(fd.get('twitter')        ?? '').trim(),
      agreedToTerms:  fd.get('agreedToTerms') === 'on',
      profilePicUrl:  picUrl,
    };

    try {
      const res  = await fetch('/api/judge/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl glass-gold p-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient">
          <CheckCircle2 className="h-8 w-8 text-ink" />
        </span>
        <h3 className="mt-6 font-display text-2xl font-semibold text-white">Application Received</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
          Thank you for applying to become a judge. Our team will review your application
          and be in touch within 3–5 business days.
        </p>
      </div>
    );
  }

  const submitting = status === 'submitting';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl glass p-7 sm:p-10">

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" required>
          <input name="firstName" type="text" required placeholder="Jane" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Last name" required>
          <input name="lastName" type="text" required placeholder="Smith" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Email address" required>
          <input name="email" type="email" required placeholder="jane@company.com" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Phone number">
          <input name="phone" type="tel" placeholder="07000 000000" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Work Phone">
          <input name="workPhone" type="tel" placeholder="+44 20 0000 0000" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Company / Organisation">
          <input name="company" type="text" placeholder="Your company" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Job title">
          <input name="jobTitle" type="text" placeholder="CEO, Director, Manager…" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Short Summary" required hint={<CharCount value={shortSummary} max={150} />}>
          <textarea
            name="shortSummary"
            required
            rows={2}
            maxLength={150}
            value={shortSummary}
            onChange={e => setShortSummary(e.target.value)}
            placeholder="A brief one-line description of your expertise and background…"
            className={`${inputBase} resize-none`}
            disabled={submitting}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="LinkedIn profile URL">
          <input name="linkedin" type="url" placeholder="https://linkedin.com/in/yourname" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Facebook profile URL">
          <input name="facebook" type="url" placeholder="https://facebook.com/yourname" className={inputBase} disabled={submitting} />
        </Field>
        <Field label="Twitter / X profile URL">
          <input name="twitter" type="url" placeholder="https://x.com/yourhandle" className={inputBase} disabled={submitting} />
        </Field>
      </div>

      <Field label="Profile Summary" hint={<CharCount value={profileSummary} max={1000} />}>
        <textarea
          name="profileSummary"
          rows={5}
          maxLength={1000}
          value={profileSummary}
          onChange={e => setProfileSummary(e.target.value)}
          placeholder="Tell us about your professional background, achievements, and areas of expertise…"
          className={`${inputBase} resize-none`}
          disabled={submitting}
        />
      </Field>

      <Field label="Why do you want to be a judge?" required>
        <textarea
          name="bio"
          required
          rows={4}
          maxLength={1000}
          placeholder="Tell us about your background and why you'd make a great judge…"
          className={`${inputBase} resize-none`}
          disabled={submitting}
        />
      </Field>

      {/* Profile photo — above T&C */}
      <ProfilePicUpload value={picUrl} onChange={setPicUrl} disabled={submitting} />

      <label className="flex cursor-pointer items-start gap-3">
        <input
          name="agreedToTerms"
          type="checkbox"
          required
          disabled={submitting}
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-white/20 bg-white/5 accent-gold"
        />
        <span className="text-sm text-white/70">
          I agree to the{' '}
          <a href="/judge-terms" target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2 hover:text-gold/80">
            Judge Terms and Conditions
          </a>
          <span className="ml-1 text-gold">*</span>
        </span>
      </label>

      {status === 'error' && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="group inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient py-4 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
      <p className="text-center text-xs text-white/35">
        We typically respond within 3–5 business days.
      </p>
    </form>
  );
}
