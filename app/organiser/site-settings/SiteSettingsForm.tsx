'use client';

import { useState } from 'react';
import {
  CalendarDays, Phone, Share2, Palette, FileText,
  Save, CheckCircle2, AlertCircle, Eye, Loader2, Upload,
} from 'lucide-react';
import type { SiteData } from '@/lib/site';
import { compressImage, postUpload } from '@/lib/imageCompress';

// ── Colour helpers ────────────────────────────────────────────────────────────
function rgbToHex(rgb: string): string {
  const parts = rgb.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '#000000';
  return '#' + parts.map((n) => Math.min(255, n).toString(16).padStart(2, '0')).join('');
}
function hexToRgb(hex: string): string {
  if (hex.length < 7) return '0 0 0';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

// Strip to "YYYY-MM-DDTHH:MM" for datetime-local inputs.
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 16);
}

// ── Shared input styles ───────────────────────────────────────────────────────
const input =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';
const label =
  'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50';
const fieldset = 'grid gap-5 sm:grid-cols-2';

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={label}>{title}</span>
      {children}
    </label>
  );
}

// ── Tab definition ────────────────────────────────────────────────────────────
type TabId = 'event' | 'contact' | 'social' | 'branding' | 'content';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'event',    label: 'Event',    icon: CalendarDays },
  { id: 'contact',  label: 'Contact',  icon: Phone        },
  { id: 'social',   label: 'Social',   icon: Share2       },
  { id: 'branding', label: 'Branding', icon: Palette      },
  { id: 'content',  label: 'Content',  icon: FileText     },
];

const THEME_FIELDS: { key: keyof SiteData; label: string }[] = [
  { key: 'theme_primary',   label: 'Primary'        },
  { key: 'theme_light',     label: 'Light / Accent' },
  { key: 'theme_deep',      label: 'Deep'           },
  { key: 'theme_50',        label: 'Tint 50'        },
  { key: 'theme_bg',        label: 'Background'     },
  { key: 'theme_bg_slate',  label: 'BG Slate'       },
  { key: 'theme_bg_warm',   label: 'BG Warm'        },
  { key: 'theme_bg_darkest',label: 'BG Darkest'     },
];

const DISPLAY_FONTS = [
  { value: 'playfair',  label: 'Playfair Display',   sample: 'Classic Serif'        },
  { value: 'cormorant', label: 'Cormorant Garamond',  sample: 'Luxury Elegant'       },
  { value: 'lora',      label: 'Lora',                sample: 'Warm Traditional'     },
] as const;

const BODY_FONTS = [
  { value: 'inter',   label: 'Inter',   sample: 'Clean & Modern'          },
  { value: 'nunito',  label: 'Nunito',  sample: 'Friendly & Approachable' },
] as const;

// ── Main component ────────────────────────────────────────────────────────────
export function SiteSettingsForm({ site }: { site: SiteData }) {

  // Initialise form from site data
  const [form, setForm] = useState({
    name:                  site.name,
    tagline:               site.tagline ?? '',
    year:                  site.year,
    legal:                 site.legal ?? '',
    event_date:            site.event_date ?? '',
    event_date_long:       site.event_date_long ?? '',
    event_date_iso:        toDatetimeLocal(site.event_date_iso),
    event_deadline_iso:    toDatetimeLocal(site.event_deadline_iso),
    event_deadline_label:  site.event_deadline_label ?? '',
    event_city:            site.event_city ?? '',
    venue:                 site.venue ?? '',
    venue_short:           site.venue_short ?? '',
    ceremonies_count:      String(site.ceremonies_count),
    email:                 site.email ?? '',
    phone_display:         site.phone_display ?? '',
    phone_href:            site.phone_href ?? '',
    company:               site.company ?? '',
    address:               site.address ?? '',
    official_site:         site.official_site ?? '',
    social_facebook:       site.social_facebook ?? '',
    social_instagram:      site.social_instagram ?? '',
    social_linkedin:       site.social_linkedin ?? '',
    social_x:              site.social_x ?? '',
    theme_primary:         rgbToHex(site.theme_primary),
    theme_light:           rgbToHex(site.theme_light),
    theme_deep:            rgbToHex(site.theme_deep),
    theme_50:              rgbToHex(site.theme_50),
    theme_bg:              rgbToHex(site.theme_bg),
    theme_bg_slate:        rgbToHex(site.theme_bg_slate),
    theme_bg_warm:         rgbToHex(site.theme_bg_warm),
    theme_bg_darkest:      rgbToHex(site.theme_bg_darkest),
    hero_image_id:         site.hero_image_id ?? '',
    hero_video_url:        site.hero_video_url ?? '',
    categories:            JSON.stringify(site.categories ?? [], null, 2),
    ga_id:                 site.ga_id ?? '',
    is_active:             site.is_active,
    logo_url:              site.logo_url ?? '',
    logo_url_light:        site.logo_url_light ?? '',
    font_display:          site.font_display ?? 'playfair',
    font_body:             site.font_body ?? 'inter',
  });

  const [tab, setTab]         = useState<TabId>('event');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const [imgError, setImgError] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const heroUrl = form.hero_image_id
    ? (form.hero_image_id.startsWith('/') || form.hero_image_id.startsWith('http') || form.hero_image_id.startsWith('data:')
        ? form.hero_image_id
        : `https://images.unsplash.com/${form.hero_image_id}?auto=format&fit=crop&w=600&q=60`)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      // Build payload — convert colour hex back to RGB triplets, and parse categories JSON
      const payload: Record<string, unknown> = {
        ...form,
        ceremonies_count: Number(form.ceremonies_count),
        is_active: form.is_active,
      };
      // Colours → RGB triplets
      for (const { key } of THEME_FIELDS) {
        payload[key] = hexToRgb(form[key as keyof typeof form] as string);
      }
      // Categories JSON
      try {
        payload.categories = JSON.parse(form.categories);
      } catch {
        throw new Error('Categories field contains invalid JSON.');
      }

      const res = await fetch('/api/organiser/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed.');
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>

      {/* Tab bar */}
      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map(({ id, label: lbl, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === id
                ? 'bg-gold-gradient text-ink shadow-gold-sm'
                : 'glass text-white/70 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4" />
            {lbl}
          </button>
        ))}
      </div>

      {/* ── EVENT ─────────────────────────────────────────────────────────── */}
      {tab === 'event' && (
        <div className="space-y-6">
          <div className={fieldset}>
            <Field title="Site name">
              <input className={input} value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field title="Year">
              <input className={input} value={form.year} maxLength={4} onChange={(e) => set('year', e.target.value)} />
            </Field>
          </div>
          <Field title="Tagline">
            <textarea className={`${input} resize-none`} rows={2} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </Field>
          <div className={fieldset}>
            <Field title="Date (short) e.g. 23–24 Feb 2027">
              <input className={input} value={form.event_date} onChange={(e) => set('event_date', e.target.value)} />
            </Field>
            <Field title="Date (long) e.g. Tue–Wed, 23–24 Feb 2027">
              <input className={input} value={form.event_date_long} onChange={(e) => set('event_date_long', e.target.value)} />
            </Field>
          </div>
          <div className={fieldset}>
            <Field title="Ceremony date & time (ISO)">
              <input type="datetime-local" className={input} value={form.event_date_iso} onChange={(e) => set('event_date_iso', e.target.value)} />
            </Field>
            <Field title="Nomination deadline (ISO)">
              <input type="datetime-local" className={input} value={form.event_deadline_iso} onChange={(e) => set('event_deadline_iso', e.target.value)} />
            </Field>
          </div>
          <div className={fieldset}>
            <Field title="Deadline label e.g. 22 February 2027">
              <input className={input} value={form.event_deadline_label} onChange={(e) => set('event_deadline_label', e.target.value)} />
            </Field>
            <Field title="City">
              <input className={input} value={form.event_city} onChange={(e) => set('event_city', e.target.value)} />
            </Field>
          </div>
          <div className={fieldset}>
            <Field title="Venue (full address)">
              <input className={input} value={form.venue} onChange={(e) => set('venue', e.target.value)} />
            </Field>
            <Field title="Venue short name">
              <input className={input} value={form.venue_short} onChange={(e) => set('venue_short', e.target.value)} />
            </Field>
          </div>
          <Field title="Number of ceremonies">
            <input type="number" min={1} className={`${input} w-32`} value={form.ceremonies_count} onChange={(e) => set('ceremonies_count', e.target.value)} />
          </Field>
        </div>
      )}

      {/* ── CONTACT ───────────────────────────────────────────────────────── */}
      {tab === 'contact' && (
        <div className="space-y-6">
          <div className={fieldset}>
            <Field title="Email">
              <input type="email" className={input} value={form.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field title="Phone (display) e.g. +44 20 3451 7166">
              <input className={input} value={form.phone_display} onChange={(e) => set('phone_display', e.target.value)} />
            </Field>
          </div>
          <div className={fieldset}>
            <Field title="Phone (href) e.g. tel:+442034517166">
              <input className={input} value={form.phone_href} onChange={(e) => set('phone_href', e.target.value)} />
            </Field>
            <Field title="Company name">
              <input className={input} value={form.company} onChange={(e) => set('company', e.target.value)} />
            </Field>
          </div>
          <Field title="Office address">
            <textarea className={`${input} resize-none`} rows={3} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field title="Official website URL">
            <input type="url" className={input} placeholder="https://" value={form.official_site} onChange={(e) => set('official_site', e.target.value)} />
          </Field>
        </div>
      )}

      {/* ── SOCIAL ────────────────────────────────────────────────────────── */}
      {tab === 'social' && (
        <div className="space-y-6">
          {(
            [
              ['social_facebook',  'Facebook URL'],
              ['social_instagram', 'Instagram URL'],
              ['social_linkedin',  'LinkedIn URL'],
              ['social_x',        'X (Twitter) URL'],
            ] as [keyof typeof form, string][]
          ).map(([key, title]) => (
            <Field key={key} title={title}>
              <input type="url" className={input} placeholder="https://" value={form[key] as string} onChange={(e) => set(key, e.target.value)} />
            </Field>
          ))}
        </div>
      )}

      {/* ── BRANDING ──────────────────────────────────────────────────────── */}
      {tab === 'branding' && (
        <div className="space-y-8">
          {/* Logo */}
          <div>
            <span className={`${label} mb-3`}>Site logo (dark mode)</span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-3">
                <input
                  className={input}
                  placeholder="https://... paste URL or upload below"
                  value={form.logo_url}
                  onChange={(e) => set('logo_url', e.target.value)}
                />
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-gold/40 hover:text-white">
                    <Upload className="h-3.5 w-3.5" />
                    Upload image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          // Downscale in the browser first — see lib/imageCompress.
                          const small = await compressImage(file, { maxDimension: 900 });
                          set('logo_url', await postUpload('/api/organiser/logo-upload', small));
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Upload failed');
                        }
                      }}
                    />
                  </label>
                  <p className="mt-1.5 text-xs text-white/30">PNG, JPG, WEBP or SVG — large images are resized automatically</p>
                </div>
              </div>
              {form.logo_url && (
                <div className="flex h-28 w-48 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logo_url} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Light-mode logo */}
          <div>
            <span className={`${label} mb-3`}>Site logo (light mode — optional)</span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-3">
                <input
                  className={input}
                  placeholder="Leave blank to reuse the dark-mode logo"
                  value={form.logo_url_light}
                  onChange={(e) => set('logo_url_light', e.target.value)}
                />
                <p className="text-xs text-white/35">
                  For logos whose text only reads well on a white background. When set, this
                  version is shown while the site is in light mode.
                </p>
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-gold/40 hover:text-white">
                    <Upload className="h-3.5 w-3.5" />
                    Upload image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const small = await compressImage(file, { maxDimension: 900 });
                          set('logo_url_light', await postUpload('/api/organiser/logo-upload', small));
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Upload failed');
                        }
                      }}
                    />
                  </label>
                  {form.logo_url_light && (
                    <button type="button" onClick={() => set('logo_url_light', '')}
                      className="ml-3 text-xs font-semibold text-white/40 transition hover:text-red-400">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {form.logo_url_light && (
                // Previewed on white, since that's the background it's meant for.
                <div className="flex h-28 w-48 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logo_url_light} alt="Light-mode logo preview" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Fonts */}
          <div>
            <span className={`${label} mb-4`}>Typography</span>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Display / Heading font
                </span>
                <div className="space-y-2">
                  {DISPLAY_FONTS.map((f) => (
                    <label key={f.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                      form.font_display === f.value
                        ? 'border-gold/40 bg-gold/[0.07]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}>
                      <input
                        type="radio"
                        name="font_display"
                        value={f.value}
                        checked={form.font_display === f.value}
                        onChange={() => set('font_display', f.value)}
                        className="sr-only"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-white">{f.label}</span>
                        <span className="text-xs text-white/45">{f.sample}</span>
                      </span>
                      {form.font_display === f.value && (
                        <span className="h-2 w-2 rounded-full bg-gold" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                  Body / Paragraph font
                </span>
                <div className="space-y-2">
                  {BODY_FONTS.map((f) => (
                    <label key={f.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                      form.font_body === f.value
                        ? 'border-gold/40 bg-gold/[0.07]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}>
                      <input
                        type="radio"
                        name="font_body"
                        value={f.value}
                        checked={form.font_body === f.value}
                        onChange={() => set('font_body', f.value)}
                        className="sr-only"
                      />
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-white">{f.label}</span>
                        <span className="text-xs text-white/45">{f.sample}</span>
                      </span>
                      {form.font_body === f.value && (
                        <span className="h-2 w-2 rounded-full bg-gold" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div>
            <span className={`${label} mb-3`}>Hero image</span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-3">
                <input
                  className={input}
                  placeholder="photo-1470229722913-7c0e2dbbafd3 or https://... or upload below"
                  value={form.hero_image_id}
                  onChange={(e) => { set('hero_image_id', e.target.value); setImgError(false); }}
                />
                <p className="text-xs text-white/35">
                  Paste an Unsplash photo ID (e.g.{' '}
                  <span className="font-mono text-white/50">unsplash.com/photos/photo-xxxx</span>
                  ), a direct image URL, or upload your own photo below.
                </p>
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-gold/40 hover:text-white">
                    <Upload className="h-3.5 w-3.5" />
                    Upload image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          // Downscale in the browser first — see lib/imageCompress.
                          const small = await compressImage(file, { maxDimension: 2400 });
                          set('hero_image_id', await postUpload('/api/organiser/hero-upload', small));
                          setImgError(false);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Upload failed');
                        }
                      }}
                    />
                  </label>
                  <p className="mt-1.5 text-xs text-white/30">PNG, JPG or WEBP — large photos are resized automatically</p>
                </div>
              </div>
              {heroUrl && (
                <div className="relative h-28 w-48 flex-shrink-0 overflow-hidden rounded-xl border border-white/10">
                  {imgError ? (
                    <div className="flex h-full items-center justify-center text-xs text-white/40">
                      Invalid ID
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={heroUrl}
                      alt="Hero preview"
                      className="h-full w-full object-cover"
                      onError={() => setImgError(true)}
                    />
                  )}
                  <div className="absolute bottom-1.5 right-1.5 rounded-full bg-black/50 p-1">
                    <Eye className="h-3 w-3 text-white/70" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hero video */}
          <div>
            <span className={`${label} mb-3`}>Hero video (optional — replaces the image above)</span>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex-1 space-y-3">
                <input
                  className={input}
                  placeholder="https://... direct video URL, or upload below"
                  value={form.hero_video_url}
                  onChange={(e) => set('hero_video_url', e.target.value)}
                />
                <p className="text-xs text-white/35">
                  When set, this video plays as the hero background instead of the image. Leave blank to use the image.
                </p>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-gold/40 hover:text-white">
                    {videoUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {videoUploading ? 'Uploading…' : 'Upload video'}
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="sr-only"
                      disabled={videoUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setVideoUploading(true);
                        try {
                          // Upload straight from the browser to Blob storage —
                          // a serverless function body caps at ~4.5MB, so a video
                          // routed through the server would fail silently.
                          const { upload } = await import('@vercel/blob/client');
                          const blob = await upload(file.name, file, {
                            access: 'public',
                            handleUploadUrl: '/api/organiser/hero-video-upload',
                          });
                          set('hero_video_url', blob.url);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : 'Upload failed');
                        } finally {
                          setVideoUploading(false);
                        }
                      }}
                    />
                  </label>
                  {form.hero_video_url && (
                    <button type="button" onClick={() => set('hero_video_url', '')}
                      className="text-xs font-semibold text-white/40 hover:text-red-400 transition">
                      Remove video
                    </button>
                  )}
                </div>
                <p className="text-xs text-white/30">MP4, WEBM or MOV · max 100 MB</p>
              </div>
              {form.hero_video_url && (
                <div className="h-28 w-48 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                  <video src={form.hero_video_url} muted loop autoPlay className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Theme colours */}
          <div>
            <span className={`${label} mb-4`}>Theme colours</span>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {THEME_FIELDS.map(({ key, label: clabel }) => (
                <div key={key}>
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                    {clabel}
                  </span>
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                    <input
                      type="color"
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => set(key as keyof typeof form, e.target.value)}
                      className="h-7 w-7 flex-shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="font-mono text-xs text-white/60">
                      {form[key as keyof typeof form]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/35">
              Colours are stored as RGB triplets and applied via CSS variables — changes take effect on next page load.
            </p>
          </div>
        </div>
      )}

      {/* ── CONTENT ───────────────────────────────────────────────────────── */}
      {tab === 'content' && (
        <div className="space-y-6">
          <div className={fieldset}>
            <Field title="Google Analytics ID (GA4)">
              <input className={input} placeholder="G-XXXXXXXXXX" value={form.ga_id} onChange={(e) => set('ga_id', e.target.value)} />
            </Field>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => set('is_active', e.target.checked)}
                  className="h-4 w-4 accent-gold"
                />
                <span className="text-sm font-semibold text-white">Site is active</span>
              </label>
            </div>
          </div>
          <Field title="Legal / copyright text">
            <textarea className={`${input} resize-none`} rows={2} value={form.legal} onChange={(e) => set('legal', e.target.value)} />
          </Field>
          <Field title="Award categories (JSON array)">
            <textarea
              className={`${input} resize-y font-mono text-xs`}
              rows={12}
              value={form.categories}
              onChange={(e) => set('categories', e.target.value)}
              spellCheck={false}
            />
            <p className="mt-1.5 text-xs text-white/35">Must be valid JSON. Each item: {"{ \"id\": \"...\", \"name\": \"...\", \"description\": \"...\" }"}</p>
          </Field>
        </div>
      )}

      {/* ── Footer / save bar ─────────────────────────────────────────────── */}
      <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {saved && (
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Saved successfully
            </span>
          )}
          {error && (
            <span className="flex items-center gap-2 text-sm font-semibold text-red-400">
              <AlertCircle className="h-4 w-4" /> {error}
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={saving || videoUploading}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gold-gradient px-8 py-3 text-sm font-semibold tracking-wide text-ink shadow-gold transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {saving || videoUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="relative z-10">{videoUploading ? 'Video uploading…' : saving ? 'Saving…' : 'Save Changes'}</span>
        </button>
      </div>

    </form>
  );
}
