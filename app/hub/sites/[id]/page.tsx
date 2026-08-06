'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Loader2, ExternalLink, Upload } from 'lucide-react';
import Link from 'next/link';
import { compressImage, postUpload } from '@/lib/imageCompress';

const input = 'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';
const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50';

type SiteSettings = {
  id: number; domain: string; name: string; slug: string; year: string;
  tagline: string | null; email: string | null; phone_display: string | null;
  company: string | null; address: string | null; official_site: string | null;
  event_date: string | null; event_date_long: string | null; venue: string | null;
  event_city: string | null; social_facebook: string | null; social_instagram: string | null;
  social_linkedin: string | null; social_x: string | null;
  theme_primary: string; theme_light: string; theme_deep: string;
  theme_50: string; theme_bg: string; theme_bg_slate: string;
  theme_bg_warm: string; theme_bg_darkest: string;
  logo_url: string | null; logo_url_light: string | null; is_active: boolean; design_variant: string;
  font_display: string | null; font_body: string | null; hero_image_id: string | null;
  hero_video_url: string | null;
};

const DISPLAY_FONTS = [
  { value: 'playfair',  label: 'Playfair Display',  sample: 'Classic Serif'    },
  { value: 'cormorant', label: 'Cormorant Garamond', sample: 'Luxury Elegant'   },
  { value: 'lora',      label: 'Lora',               sample: 'Warm Traditional' },
] as const;

const BODY_FONTS = [
  { value: 'inter',  label: 'Inter',  sample: 'Clean & Modern'          },
  { value: 'nunito', label: 'Nunito', sample: 'Friendly & Approachable' },
] as const;

function rgbToHex(rgb: string | null): string {
  if (!rgb) return '#000000';
  const parts = rgb.trim().split(/\s+/).map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return '#000000';
  return '#' + parts.map((n) => Math.min(255, n).toString(16).padStart(2, '0')).join('');
}
function hexToRgb(hex: string): string {
  if (hex.length < 7) return '0 0 0';
  return `${parseInt(hex.slice(1,3),16)} ${parseInt(hex.slice(3,5),16)} ${parseInt(hex.slice(5,7),16)}`;
}

type TabId = 'event' | 'contact' | 'social' | 'branding';
const TABS: { id: TabId; label: string }[] = [
  { id: 'event',    label: 'Event'    },
  { id: 'contact',  label: 'Contact'  },
  { id: 'social',   label: 'Social'   },
  { id: 'branding', label: 'Branding' },
];

export default function HubSiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [site, setSite] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [tab, setTab] = useState<TabId>('event');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);

  useEffect(() => {
    fetch(`/api/hub/sites/${id}/settings`)
      .then(r => r.json())
      .then(d => {
        setSite(d.site);
        setForm({
          name: d.site.name ?? '',
          tagline: d.site.tagline ?? '',
          year: d.site.year ?? '',
          email: d.site.email ?? '',
          phone_display: d.site.phone_display ?? '',
          company: d.site.company ?? '',
          address: d.site.address ?? '',
          official_site: d.site.official_site ?? '',
          event_date: d.site.event_date ?? '',
          event_date_long: d.site.event_date_long ?? '',
          venue: d.site.venue ?? '',
          event_city: d.site.event_city ?? '',
          social_facebook: d.site.social_facebook ?? '',
          social_instagram: d.site.social_instagram ?? '',
          social_linkedin: d.site.social_linkedin ?? '',
          social_x: d.site.social_x ?? '',
          logo_url: d.site.logo_url ?? '',
          logo_url_light: d.site.logo_url_light ?? '',
          hero_image_id: d.site.hero_image_id ?? '',
          hero_video_url: d.site.hero_video_url ?? '',
          font_display: d.site.font_display ?? 'playfair',
          font_body: d.site.font_body ?? 'inter',
          design_variant: d.site.design_variant ?? 'luxury',
          is_active: d.site.is_active ?? true,
          theme_primary:    rgbToHex(d.site.theme_primary),
          theme_light:      rgbToHex(d.site.theme_light),
          theme_deep:       rgbToHex(d.site.theme_deep),
          theme_50:         rgbToHex(d.site.theme_50),
          theme_bg:         rgbToHex(d.site.theme_bg),
          theme_bg_slate:   rgbToHex(d.site.theme_bg_slate),
          theme_bg_warm:    rgbToHex(d.site.theme_bg_warm),
          theme_bg_darkest: rgbToHex(d.site.theme_bg_darkest),
        });
        setLoading(false);
      })
      .catch(() => { setError('Failed to load site.'); setLoading(false); });
  }, [id]);

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);
    try {
      const payload: Record<string, string | boolean | null> = { ...form as Record<string, string | boolean> };
      // Convert hex back to rgb for theme fields
      ['theme_primary','theme_light','theme_deep','theme_50','theme_bg','theme_bg_slate','theme_bg_warm','theme_bg_darkest'].forEach(k => {
        if (typeof payload[k] === 'string') payload[k] = hexToRgb(payload[k] as string);
      });
      const res = await fetch(`/api/hub/sites/${id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>
  );

  if (!site) return (
    <div className="container-luxe section-pad py-12 text-white/50">Site not found.</div>
  );

  return (
    <div className="container-luxe section-pad py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <Link href="/hub/sites" className="mb-3 flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sites
          </Link>
          <h1 className="font-display text-3xl font-semibold text-white">{site.name}</h1>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-sm text-white/40">{site.domain}</span>
            <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-gold/70 hover:text-gold transition">
              <ExternalLink className="h-3 w-3" /> Visit site
            </a>
            <a href={`https://${site.domain}/organiser`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white transition">
              <ExternalLink className="h-3 w-3" /> Organiser panel
            </a>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || videoUploading}
          className="flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-60">
          {saving || videoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {videoUploading ? 'Video uploading…' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> Saved successfully
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === t.id ? 'bg-gold-gradient text-ink' : 'border border-white/10 text-white/60 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl glass p-6 space-y-5">

        {tab === 'event' && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className={label}>Site Name</span>
                <input className={input} value={form.name as string} onChange={e => set('name', e.target.value)} /></label>
              <label className="block"><span className={label}>Year</span>
                <input className={input} value={form.year as string} onChange={e => set('year', e.target.value)} /></label>
            </div>
            <label className="block"><span className={label}>Tagline</span>
              <input className={input} value={form.tagline as string} onChange={e => set('tagline', e.target.value)} /></label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className={label}>Event Date (Short)</span>
                <input className={input} placeholder="e.g. 23–24 Feb 2027" value={form.event_date as string} onChange={e => set('event_date', e.target.value)} /></label>
              <label className="block"><span className={label}>Event Date (Long)</span>
                <input className={input} placeholder="e.g. Tue–Wed, 23–24 Feb 2027" value={form.event_date_long as string} onChange={e => set('event_date_long', e.target.value)} /></label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className={label}>City</span>
                <input className={input} value={form.event_city as string} onChange={e => set('event_city', e.target.value)} /></label>
              <label className="block"><span className={label}>Venue</span>
                <input className={input} value={form.venue as string} onChange={e => set('venue', e.target.value)} /></label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className={label}>Design Variant</span>
                <select className={input} value={form.design_variant as string} onChange={e => set('design_variant', e.target.value)}>
                  <option value="luxury">Luxury</option>
                  <option value="sport">Sport</option>
                  <option value="corporate">Corporate</option>
                </select>
              </label>
              <label className="block"><span className={label}>Status</span>
                <select className={input} value={form.is_active ? 'true' : 'false'} onChange={e => set('is_active', e.target.value === 'true')}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>
            </div>
          </>
        )}

        {tab === 'contact' && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block"><span className={label}>Contact Email</span>
                <input className={input} value={form.email as string} onChange={e => set('email', e.target.value)} /></label>
              <label className="block"><span className={label}>Phone</span>
                <input className={input} value={form.phone_display as string} onChange={e => set('phone_display', e.target.value)} /></label>
            </div>
            <label className="block"><span className={label}>Company / Organiser</span>
              <input className={input} value={form.company as string} onChange={e => set('company', e.target.value)} /></label>
            <label className="block"><span className={label}>Address</span>
              <input className={input} value={form.address as string} onChange={e => set('address', e.target.value)} /></label>
            <label className="block"><span className={label}>Official Website</span>
              <input className={input} value={form.official_site as string} onChange={e => set('official_site', e.target.value)} /></label>
          </>
        )}

        {tab === 'social' && (
          <>
            {[
              { key: 'social_facebook',  label: 'Facebook URL'  },
              { key: 'social_instagram', label: 'Instagram URL' },
              { key: 'social_linkedin',  label: 'LinkedIn URL'  },
              { key: 'social_x',         label: 'X (Twitter) URL' },
            ].map(f => (
              <label key={f.key} className="block"><span className={label}>{f.label}</span>
                <input className={input} value={form[f.key] as string} onChange={e => set(f.key, e.target.value)} />
              </label>
            ))}
          </>
        )}

        {tab === 'branding' && (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <span className={label}>Logo URL (dark mode)</span>
                <input className={input} placeholder="https://... or /filename.png" value={form.logo_url as string} onChange={e => set('logo_url', e.target.value)} />
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-gold/40 hover:text-white">
                  <Upload className="h-3.5 w-3.5" />
                  Upload image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const small = await compressImage(file, { maxDimension: 900 });
                        set('logo_url', await postUpload('/api/organiser/logo-upload', small));
                      } catch (err) {
                        alert(err instanceof Error ? err.message : 'Upload failed');
                      }
                    }}
                  />
                </label>
              </div>
              <div>
                <span className={label}>Logo URL (light mode — optional)</span>
                <input className={input} placeholder="Leave blank to reuse the dark-mode logo" value={form.logo_url_light as string} onChange={e => set('logo_url_light', e.target.value)} />
                <div className="mt-2 flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-gold/40 hover:text-white">
                    <Upload className="h-3.5 w-3.5" />
                    Upload image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="sr-only"
                      onChange={async e => {
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
                      className="text-xs font-semibold text-white/40 transition hover:text-red-400">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              {form.logo_url && (
                <div className="flex h-20 w-36 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logo_url as string} alt="Logo preview (dark mode)" className="max-h-full max-w-full object-contain" />
                </div>
              )}
              {form.logo_url_light && (
                <div className="flex h-20 w-36 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.logo_url_light as string} alt="Logo preview (light mode)" className="max-h-full max-w-full object-contain" />
                </div>
              )}
            </div>

            {/* Typography */}
            <div>
              <span className={`${label} mb-3 block`}>Typography</span>
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
                        {form.font_display === f.value && <span className="h-2 w-2 rounded-full bg-gold" />}
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
                        {form.font_body === f.value && <span className="h-2 w-2 rounded-full bg-gold" />}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div>
              <span className={`${label} mb-3 block`}>Hero image</span>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-3">
                  <input
                    className={input}
                    placeholder="Unsplash photo ID, https://... URL, or upload below"
                    value={form.hero_image_id as string}
                    onChange={e => set('hero_image_id', e.target.value)}
                  />
                  <div>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/70 transition hover:border-gold/40 hover:text-white">
                      <Upload className="h-3.5 w-3.5" />
                      Upload image
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            // Downscale in the browser first — see lib/imageCompress.
                            const small = await compressImage(file, { maxDimension: 2400 });
                            set('hero_image_id', await postUpload('/api/organiser/hero-upload', small));
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Upload failed');
                          }
                        }}
                      />
                    </label>
                    <p className="mt-1.5 text-xs text-white/30">PNG, JPG or WEBP — large photos are resized automatically</p>
                  </div>
                </div>
                {form.hero_image_id && (
                  <div className="h-28 w-48 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        (form.hero_image_id as string).startsWith('/') ||
                        (form.hero_image_id as string).startsWith('http') ||
                        (form.hero_image_id as string).startsWith('data:')
                          ? (form.hero_image_id as string)
                          : `https://images.unsplash.com/${form.hero_image_id}?auto=format&fit=crop&w=400&q=60`
                      }
                      alt="Hero preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Hero video */}
            <div>
              <span className={`${label} mb-3 block`}>Hero video (optional — replaces the image above)</span>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex-1 space-y-3">
                  <input
                    className={input}
                    placeholder="https://... direct video URL, or upload below"
                    value={form.hero_video_url as string}
                    onChange={e => set('hero_video_url', e.target.value)}
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
                        onChange={async e => {
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
                    <video src={form.hero_video_url as string} muted loop autoPlay className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { key: 'theme_primary',    label: 'Primary'     },
                { key: 'theme_light',      label: 'Accent'      },
                { key: 'theme_deep',       label: 'Deep'        },
                { key: 'theme_bg',         label: 'Background'  },
                { key: 'theme_bg_slate',   label: 'BG Slate'    },
                { key: 'theme_bg_warm',    label: 'BG Warm'     },
                { key: 'theme_bg_darkest', label: 'BG Darkest'  },
                { key: 'theme_50',         label: 'Tint 50'     },
              ].map(f => (
                <label key={f.key} className="block">
                  <span className={label}>{f.label}</span>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form[f.key] as string} onChange={e => set(f.key, e.target.value)}
                      className="h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent p-0.5" />
                    <input className={`${input} font-mono text-xs`} value={form[f.key] as string} onChange={e => set(f.key, e.target.value)} />
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
