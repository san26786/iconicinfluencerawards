"use client";

// "My Awards Profile" — the full editable profile from the legacy form.
// Reused in two places:
//   • visitor editing their own profile        → endpoint="/api/profile"
//   • organiser editing someone else's profile → endpoint="/api/organiser/users/[id]"
// Both endpoints accept the same JSON ProfileData via PUT. Files are uploaded
// to Vercel Blob (see setFile) and the profile JSON stores only the URL.

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Download, Loader2, Save } from "lucide-react";
import { emptyProfile, type FileRef, type ProfileData } from "@/lib/profile";

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40";

const INDUSTRIES = [
  "Business",
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "Retail",
  "Hospitality",
  "Marketing & Media",
  "Construction",
  "Legal",
  "Manufacturing",
  "Charity & Non-profit",
  "Other",
];

// Per-type caps (kept in sync with /api/profile/upload). Pictures/logos are
// images; CV/company profile are documents.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB
const IMAGE_KEYS = new Set(["profilePicture", "companyLogo"]);
const fmtMb = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`;

export function ProfileForm({
  initial,
  email,
  endpoint,
  redirectTo,
}: {
  initial: ProfileData;
  email: string;
  endpoint: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [f, setF] = useState<ProfileData>({ ...emptyProfile, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const set =
    (k: keyof ProfileData) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setSaved(false);
      setF((s) => ({ ...s, [k]: e.target.value }));
    };

  const setFile = async (k: keyof ProfileData, file: File | null) => {
    setSaved(false);
    setError("");
    if (!file) {
      setF((s) => ({ ...s, [k]: null }));
      return;
    }
    const limit = IMAGE_KEYS.has(k as string) ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
    if (file.size > limit) {
      setError(`“${file.name}” is too large — maximum ${fmtMb(limit)}.`);
      return;
    }
    setUploadingKey(k as string);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          (data as { error?: string }).error || "Could not upload that file.",
        );
        return;
      }
      setF((s) => ({
        ...s,
        [k]: { name: file.name, type: file.type, url: data.url },
      }));
    } catch {
      setError("Could not upload that file — please try again.");
    } finally {
      setUploadingKey(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          (data as { error?: string }).error || "Could not save your profile.",
        );
        return;
      }
      setSaved(true);
      if (redirectTo) {
        router.push(redirectTo);
        return;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {saved && (
        <p className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-3 text-sm text-white/85">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-gold" />
          Your profile has been saved.
        </p>
      )}

      <Section n="01" title="Personal Details">
        <Grid>
          <Field label="First name">
            <input
              className={inputBase}
              value={f.firstName}
              onChange={set("firstName")}
            />
          </Field>
          <Field label="Last name">
            <input
              className={inputBase}
              value={f.lastName}
              onChange={set("lastName")}
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              className={inputBase}
              value={f.dob}
              onChange={set("dob")}
            />
          </Field>
          <Field label="Gender">
            <select
              className={inputBase}
              value={f.gender}
              onChange={set("gender")}
            >
              <option value="" className="bg-ink text-white">
                Select…
              </option>
              <option value="male" className="bg-ink text-white">
                Male
              </option>
              <option value="female" className="bg-ink text-white">
                Female
              </option>
              <option value="other" className="bg-ink text-white">
                Other / prefer not to say
              </option>
            </select>
          </Field>
          <Field label="Phone number">
            <input
              className={inputBase}
              value={f.phone}
              onChange={set("phone")}
            />
          </Field>
          <Field label="Mobile number">
            <input
              className={inputBase}
              value={f.mobile}
              onChange={set("mobile")}
            />
          </Field>
          <Field label="Email (your login)" full>
            <input
              className={`${inputBase} opacity-60`}
              value={email}
              readOnly
              disabled
            />
          </Field>
          <Field label="Correspondence address" full>
            <input
              className={inputBase}
              value={f.address}
              onChange={set("address")}
            />
          </Field>
          <Field label="City">
            <input
              className={inputBase}
              value={f.city}
              onChange={set("city")}
            />
          </Field>
          <Field label="County">
            <input
              className={inputBase}
              value={f.county}
              onChange={set("county")}
            />
          </Field>
          <Field label="Post code">
            <input
              className={inputBase}
              value={f.postCode}
              onChange={set("postCode")}
            />
          </Field>
        </Grid>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FileField
            label="Profile picture"
            accept="image/*"
            value={f.profilePicture}
            onPick={(file) => setFile("profilePicture", file)}
            onClear={() => setFile("profilePicture", null)}
            preview="image"
            uploading={uploadingKey === "profilePicture"}
          />
          <FileField
            label="Your CV"
            accept=".pdf,.doc,.docx"
            value={f.cv}
            onPick={(file) => setFile("cv", file)}
            onClear={() => setFile("cv", null)}
            uploading={uploadingKey === "cv"}
          />
        </div>
      </Section>

      <Section n="02" title="Work Information">
        <Grid>
          <Field label="Which industry is your business in?">
            <select
              className={inputBase}
              value={f.industry}
              onChange={set("industry")}
            >
              <option value="" className="bg-ink text-white">
                Select…
              </option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i} className="bg-ink text-white">
                  {i}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Job title">
            <input
              className={inputBase}
              value={f.jobTitle}
              onChange={set("jobTitle")}
            />
          </Field>
          <Field label="Organisation name">
            <input
              className={inputBase}
              value={f.orgName}
              onChange={set("orgName")}
            />
          </Field>
          <Field label="Organisation phone number">
            <input
              className={inputBase}
              value={f.orgPhone}
              onChange={set("orgPhone")}
            />
          </Field>
          <Field label="Website" full>
            <input
              className={inputBase}
              value={f.website}
              onChange={set("website")}
              placeholder="https://…"
            />
          </Field>
          <Field label="Organisation address" full>
            <input
              className={inputBase}
              value={f.orgAddress}
              onChange={set("orgAddress")}
            />
          </Field>
          <Field label="City">
            <input
              className={inputBase}
              value={f.orgCity}
              onChange={set("orgCity")}
            />
          </Field>
          <Field label="Post code">
            <input
              className={inputBase}
              value={f.orgPostCode}
              onChange={set("orgPostCode")}
            />
          </Field>
          <Field label="County">
            <input
              className={inputBase}
              value={f.orgCounty}
              onChange={set("orgCounty")}
            />
          </Field>
        </Grid>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FileField
            label="Company logo"
            accept="image/*"
            value={f.companyLogo}
            onPick={(file) => setFile("companyLogo", file)}
            onClear={() => setFile("companyLogo", null)}
            preview="image"
            uploading={uploadingKey === "companyLogo"}
          />
          <FileField
            label="Company profile"
            accept=".pdf,.doc,.docx"
            value={f.companyProfile}
            onPick={(file) => setFile("companyProfile", file)}
            onClear={() => setFile("companyProfile", null)}
            uploading={uploadingKey === "companyProfile"}
          />
        </div>
      </Section>

      <Section n="03" title="Social Media Profile Links">
        <Grid>
          <Field label="Facebook">
            <input
              className={inputBase}
              value={f.facebook}
              onChange={set("facebook")}
            />
          </Field>
          <Field label="Twitter / X">
            <input
              className={inputBase}
              value={f.twitter}
              onChange={set("twitter")}
            />
          </Field>
          <Field label="LinkedIn">
            <input
              className={inputBase}
              value={f.linkedin}
              onChange={set("linkedin")}
            />
          </Field>
          <Field label="Instagram">
            <input
              className={inputBase}
              value={f.instagram}
              onChange={set("instagram")}
            />
          </Field>
        </Grid>
      </Section>

      <Section n="04" title="Your golden words">
        <div className="space-y-5">
          <Field label="How do you feel after receiving your nomination?">
            <textarea
              rows={4}
              className={inputBase}
              value={f.wordsNominated}
              onChange={set("wordsNominated")}
            />
          </Field>
          <Field label="Your thank-you message to your nominator">
            <textarea
              rows={4}
              className={inputBase}
              value={f.wordsThankYou}
              onChange={set("wordsThankYou")}
            />
          </Field>
          <Field label="A few words about your feeling as a finalist">
            <textarea
              rows={4}
              className={inputBase}
              value={f.wordsFinalist}
              onChange={set("wordsFinalist")}
            />
          </Field>
          <Field label="Your golden words as a winner">
            <textarea
              rows={4}
              className={inputBase}
              value={f.wordsWinner}
              onChange={set("wordsWinner")}
            />
          </Field>
        </div>
      </Section>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="submit"
          disabled={saving || uploadingKey !== null}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3.5 text-sm font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Save className="h-4 w-4" />
          {saving
            ? "Saving…"
            : uploadingKey !== null
              ? "Uploading…"
              : "Save profile"}
        </button>
      </div>
    </form>
  );
}

/* ── Building blocks ──────────────────────────────────────────────────── */

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl glass p-6 sm:p-8">
      <header className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient text-xs font-semibold text-ink shadow-gold-sm">
          {n}
        </span>
        <h2 className="font-display text-lg font-semibold text-white sm:text-xl">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function FileField({
  label,
  accept,
  value,
  onPick,
  onClear,
  preview,
  uploading,
}: {
  label: string;
  accept: string;
  value: FileRef;
  onPick: (file: File | null) => void;
  onClear: () => void;
  preview?: "image";
  uploading?: boolean;
}) {
  // New uploads carry `url`; older profiles carry a base64 `dataUrl`.
  const src = value?.url ?? value?.dataUrl;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">
        {label}
      </span>
      {value && src && (
        <div className="mb-3 flex items-center gap-3">
          {preview === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={value.name}
              className="h-14 w-14 rounded-lg object-cover ring-1 ring-white/10"
            />
          ) : null}
          <a
            href={src}
            download={value.name}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gold underline-offset-4 hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            {value.name}
          </a>
          <button
            type="button"
            onClick={onClear}
            className="ml-auto text-xs font-semibold text-white/45 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      )}
      {uploading && (
        <p className="mb-2 flex items-center gap-1.5 text-xs text-white/60">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" /> Uploading…
        </p>
      )}
      <input
        type="file"
        accept={accept}
        disabled={uploading}
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20 disabled:opacity-50"
      />
    </div>
  );
}
