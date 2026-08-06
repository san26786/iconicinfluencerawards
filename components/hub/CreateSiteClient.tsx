"use client";

import { useState } from "react";
import {
  Plus, Save, X, Globe, ExternalLink, CheckCircle2,
  Palette, Settings, ChevronDown, ChevronUp, UserPlus, ImagePlus,
} from "lucide-react";
import { compressImage, postUpload } from "@/lib/imageCompress";

type Site = {
  id: number;
  domain: string;
  name: string;
  slug: string;
  year: string;
  email: string | null;
  company: string | null;
  design_variant: string;
  theme_primary: string;
  theme_light: string;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
};

const LAYOUT_VARIANTS = [
  { value: "luxury",    desc: "Premium, cinematic hero with full-bleed image and golden gradients. Best for prestige awards." },
  { value: "sport",     desc: "Dynamic, energetic layout with bold typography and diagonal accents. Best for active industries." },
  { value: "corporate", desc: "Clean, structured grid with professional tone. Best for business and enterprise awards." },
];

const COLOR_PRESETS = [
  // ── Warm ───────────────────────────────────────────────────────────────────
  {
    label: "Red / Gold",
    swatch: ["#cc1b1b", "#e8b84b"],
    values: {
      theme_primary: "204 27 27", theme_light: "232 184 75", theme_deep: "139 0 0",
      theme_50: "255 245 245", theme_bg: "11 10 14", theme_bg_slate: "20 17 26",
      theme_bg_warm: "26 15 15", theme_bg_darkest: "6 4 8",
    },
  },
  {
    label: "Orange / Amber",
    swatch: ["#ea580c", "#fbbf24"],
    values: {
      theme_primary: "234 88 12", theme_light: "251 191 36", theme_deep: "154 52 18",
      theme_50: "255 247 237", theme_bg: "14 5 0", theme_bg_slate: "22 10 3",
      theme_bg_warm: "26 12 3", theme_bg_darkest: "7 2 0",
    },
  },
  {
    label: "Burgundy / Gold",
    swatch: ["#9f1239", "#e8b84b"],
    values: {
      theme_primary: "159 18 57", theme_light: "232 184 75", theme_deep: "136 19 55",
      theme_50: "255 241 242", theme_bg: "12 3 6", theme_bg_slate: "20 5 10",
      theme_bg_warm: "22 4 8", theme_bg_darkest: "6 1 3",
    },
  },
  {
    label: "Rose / Pink",
    swatch: ["#e11d48", "#f9a8d4"],
    values: {
      theme_primary: "225 29 72", theme_light: "249 168 212", theme_deep: "190 18 60",
      theme_50: "255 241 242", theme_bg: "14 3 6", theme_bg_slate: "22 5 10",
      theme_bg_warm: "24 4 10", theme_bg_darkest: "7 1 3",
    },
  },
  // ── Cool ───────────────────────────────────────────────────────────────────
  {
    label: "Blue",
    swatch: ["#1d4ed8", "#93c5fd"],
    values: {
      theme_primary: "29 78 216", theme_light: "147 197 253", theme_deep: "30 64 175",
      theme_50: "239 246 255", theme_bg: "3 7 18", theme_bg_slate: "7 11 25",
      theme_bg_warm: "5 10 25", theme_bg_darkest: "1 3 12",
    },
  },
  {
    label: "Navy / Silver",
    swatch: ["#1e3a8a", "#94a3b8"],
    values: {
      theme_primary: "30 58 138", theme_light: "148 163 184", theme_deep: "23 37 84",
      theme_50: "239 246 255", theme_bg: "2 3 12", theme_bg_slate: "5 7 18",
      theme_bg_warm: "3 5 18", theme_bg_darkest: "1 2 7",
    },
  },
  {
    label: "Teal / Cyan",
    swatch: ["#0d9488", "#67e8f9"],
    values: {
      theme_primary: "13 148 136", theme_light: "103 232 249", theme_deep: "15 118 110",
      theme_50: "240 253 250", theme_bg: "1 10 9", theme_bg_slate: "3 16 15",
      theme_bg_warm: "2 14 13", theme_bg_darkest: "0 5 4",
    },
  },
  {
    label: "Purple / Gold",
    swatch: ["#6b21a8", "#e8b84b"],
    values: {
      theme_primary: "107 33 168", theme_light: "232 184 75", theme_deep: "88 28 135",
      theme_50: "250 245 255", theme_bg: "7 3 14", theme_bg_slate: "12 5 22",
      theme_bg_warm: "12 5 20", theme_bg_darkest: "3 1 7",
    },
  },
  // ── Nature / Neutral ───────────────────────────────────────────────────────
  {
    label: "Green",
    swatch: ["#15803d", "#86efac"],
    values: {
      theme_primary: "21 128 61", theme_light: "134 239 172", theme_deep: "20 83 45",
      theme_50: "240 253 244", theme_bg: "5 14 7", theme_bg_slate: "10 20 13",
      theme_bg_warm: "8 20 10", theme_bg_darkest: "2 8 3",
    },
  },
  {
    label: "Emerald / White",
    swatch: ["#059669", "#d1fae5"],
    values: {
      theme_primary: "5 150 105", theme_light: "209 250 229", theme_deep: "4 120 87",
      theme_50: "236 253 245", theme_bg: "1 9 6", theme_bg_slate: "2 14 10",
      theme_bg_warm: "2 12 8", theme_bg_darkest: "0 5 3",
    },
  },
  {
    label: "Charcoal / Gold",
    swatch: ["#374151", "#e8b84b"],
    values: {
      theme_primary: "55 65 81", theme_light: "232 184 75", theme_deep: "31 41 55",
      theme_50: "249 250 251", theme_bg: "5 5 7", theme_bg_slate: "9 10 13",
      theme_bg_warm: "8 8 11", theme_bg_darkest: "2 2 4",
    },
  },
  {
    label: "Slate / Silver",
    swatch: ["#475569", "#e2e8f0"],
    values: {
      theme_primary: "71 85 105", theme_light: "226 232 240", theme_deep: "51 65 85",
      theme_50: "248 250 252", theme_bg: "5 6 9", theme_bg_slate: "10 11 15",
      theme_bg_warm: "8 9 12", theme_bg_darkest: "2 3 5",
    },
  },
];

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function apiFetch(url: string, method: string, body?: object) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

export function CreateSiteClient({ initial }: { initial: Site[] }) {
  const [sites, setSites] = useState<Site[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [createdSite, setCreatedSite] = useState<Site | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presetIdx, setPresetIdx] = useState(0);
  const [slugEdited, setSlugEdited] = useState(false);
  const [form, setForm] = useState({
    domain: "",
    name: "",
    slug: "",
    year: "2027",
    email: "",
    company: "",
    design_variant: "luxury",
  });

  function field(key: keyof typeof form, value: string) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !slugEdited) next.slug = toSlug(value);
      return next;
    });
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, ...COLOR_PRESETS[presetIdx].values };
      const data = await apiFetch("/api/hub/sites", "POST", payload);
      setSites((prev) => [...prev, data.site]);
      setCreatedSite(data.site);
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creating site");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({ domain: "", name: "", slug: "", year: "2027", email: "", company: "", design_variant: "luxury" });
    setPresetIdx(0);
    setSlugEdited(false);
    setCreatedSite(null);
    setError(null);
  }

  return (
    <div className="space-y-8">

      {/* Success banner */}
      {createdSite && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
            <div className="flex-1">
              <p className="font-semibold text-green-300">
                Site "{createdSite.name}" created (ID: {createdSite.id})
              </p>
              <p className="mt-1 text-sm text-green-300/70">Next steps to go live:</p>
              <ol className="mt-2 space-y-1 text-sm text-green-300/70 list-decimal list-inside">
                <li>Add <code className="text-green-300">{createdSite.domain}</code> as a domain in Vercel → your project → Domains</li>
                <li>Point DNS: add CNAME record <code className="text-green-300">cname.vercel-dns.com</code></li>
                <li>Visit <code className="text-green-300">https://{createdSite.domain}/organiser/site-settings</code> to complete setup</li>
                <li>Seed themes at <code className="text-green-300">https://{createdSite.domain}/organiser/themes</code></li>
              </ol>
            </div>
            <button onClick={resetForm} className="text-green-400/50 hover:text-green-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Existing sites */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-white">
            {sites.length} Active Site{sites.length !== 1 ? "s" : ""}
          </h2>
          <button
            onClick={() => { setShowForm(true); resetForm(); }}
            disabled={showForm}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Site
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((s) => (
            <SiteCard
              key={s.id}
              site={s}
              onUpdate={(updated) => setSites((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
            />
          ))}
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl border border-gold/25 bg-gold/5 p-6 lg:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-white">Create New Site</h2>
            <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Domain + Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Domain *</span>
                <input
                  value={form.domain}
                  onChange={(e) => field("domain", e.target.value)}
                  placeholder="myawards.com"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                />
                <p className="mt-1 text-xs text-white/30">Without www — e.g. propertyexcellenceawards.org</p>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Site Name *</span>
                <input
                  value={form.name}
                  onChange={(e) => field("name", e.target.value)}
                  placeholder="My Business Awards"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                />
              </label>
            </div>

            {/* Slug + Year */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Slug *</span>
                <input
                  value={form.slug}
                  onChange={(e) => { setSlugEdited(true); field("slug", e.target.value); }}
                  placeholder="my-business-awards"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                />
                <p className="mt-1 text-xs text-white/30">Auto-generated from name, must be unique</p>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Award Year</span>
                <input
                  value={form.year}
                  onChange={(e) => field("year", e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
                />
              </label>
            </div>

            {/* Email + Company */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Contact Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => field("email", e.target.value)}
                  placeholder="hello@myawards.com"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Organising Company</span>
                <input
                  value={form.company}
                  onChange={(e) => field("company", e.target.value)}
                  placeholder="B2B Growth Hub Limited"
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
                />
              </label>
            </div>

            {/* Design variant */}
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                <Settings className="inline h-3 w-3 mr-1" />Hero Layout
              </span>
              <div className="grid gap-3 sm:grid-cols-3">
                {LAYOUT_VARIANTS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => field("design_variant", v.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      form.design_variant === v.value
                        ? "border-gold bg-gold/10 text-white"
                        : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span className={`text-sm font-semibold capitalize ${form.design_variant === v.value ? "text-gold" : ""}`}>
                      {v.value}
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-white/40">{v.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Color scheme */}
            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
                <Palette className="inline h-3 w-3 mr-1" />Colour Scheme
              </span>
              {[
                { group: "Warm", range: [0, 4] },
                { group: "Cool", range: [4, 8] },
                { group: "Nature / Neutral", range: [8, 12] },
              ].map(({ group, range }) => (
                <div key={group} className="mb-3">
                  <p className="mb-2 text-xs text-white/30">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.slice(range[0], range[1]).map((p, offset) => {
                      const i = range[0] + offset;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setPresetIdx(i)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                            presetIdx === i
                              ? "border-gold bg-gold/10 text-white"
                              : "border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          <span className="flex gap-1">
                            {p.swatch.map((c) => (
                              <span key={c} className="h-3.5 w-3.5 rounded-full border border-white/10" style={{ background: c }} />
                            ))}
                          </span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="mt-1 text-xs text-white/30">
                Fine-tune colours after creation in Organiser → Site Settings → Branding
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={submit}
                disabled={saving || !form.domain.trim() || !form.name.trim() || !form.slug.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Creating…" : "Create Site"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SiteCard({ site, onUpdate }: { site: Site; onUpdate: (updated: Site) => void }) {
  const [editingDomain, setEditingDomain] = useState(false);
  const [domainValue, setDomainValue] = useState(site.domain);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ email: `organiser@${site.domain}`, password: '', first_name: '', last_name: '' });
  const [userSaving, setUserSaving] = useState(false);
  const [userMsg, setUserMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(site.logo_url ?? null);

  const primary = site.theme_primary.split(" ").map(Number);
  const light   = site.theme_light.split(" ").map(Number);
  const primaryHex = `rgb(${primary.join(",")})`;
  const lightHex   = `rgb(${light.join(",")})`;

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      // Downscale in the browser first — see lib/imageCompress.
      const small = await compressImage(file, { maxDimension: 900 });
      const url = await postUpload('/api/organiser/logo-upload', small);
      const updated = await apiFetch(`/api/hub/sites/${site.id}`, 'PUT', { logo_url: url });
      onUpdate(updated.site);
      setLogoPreview(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Logo upload failed');
    } finally {
      setLogoUploading(false);
    }
  }

  async function createUser() {
    setUserSaving(true);
    setUserMsg(null);
    try {
      await apiFetch('/api/hub/reset-organiser', 'POST', { email: userForm.email, password: userForm.password });
      setUserMsg({ ok: true, text: `Organiser account created for ${userForm.email}` });
      setShowUserForm(false);
    } catch (e) {
      setUserMsg({ ok: false, text: e instanceof Error ? e.message : 'Error' });
    } finally {
      setUserSaving(false);
    }
  }

  async function saveDomain() {
    if (!domainValue.trim() || domainValue === site.domain) { setEditingDomain(false); return; }
    setSaving(true);
    setErr(null);
    try {
      const data = await apiFetch(`/api/hub/sites/${site.id}`, "PUT", { domain: domainValue.trim() });
      onUpdate(data.site);
      setEditingDomain(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="group rounded-2xl glass p-5 transition hover:-translate-y-0.5 hover:border-white/20">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex gap-1.5">
          <span className="h-4 w-4 rounded-full border border-white/10" style={{ background: primaryHex }} />
          <span className="h-4 w-4 rounded-full border border-white/10" style={{ background: lightHex }} />
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
          site.is_active ? "bg-green-500/15 text-green-400" : "bg-white/10 text-white/40"
        }`}>
          {site.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Logo */}
      <div className="mb-3 flex items-center gap-3">
        {logoPreview ? (
          <img src={logoPreview} alt="logo" className="h-10 w-auto max-w-[80px] object-contain rounded" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded border border-white/10 bg-white/5">
            <ImagePlus className="h-4 w-4 text-white/20" />
          </div>
        )}
        <label className="cursor-pointer rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/50 transition hover:border-gold/40 hover:text-gold">
          {logoUploading ? 'Uploading…' : 'Upload Logo'}
          <input type="file" accept="image/*" className="hidden" disabled={logoUploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
        </label>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{site.design_variant}</p>
      <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-white">{site.name}</h3>

      {/* Domain — inline editable */}
      {editingDomain ? (
        <div className="mt-2 space-y-1">
          <input
            value={domainValue}
            onChange={(e) => setDomainValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveDomain(); if (e.key === "Escape") setEditingDomain(false); }}
            className="w-full rounded-lg border border-gold/40 bg-white/5 px-3 py-1.5 text-xs text-white focus:outline-none"
            autoFocus
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2">
            <button onClick={saveDomain} disabled={saving} className="rounded-lg bg-gold-gradient px-3 py-1 text-xs font-semibold text-ink disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => { setEditingDomain(false); setDomainValue(site.domain); }} className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white/60 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditingDomain(true)}
          title="Click to edit domain"
          className="mt-1 flex items-center gap-1 text-xs text-white/40 hover:text-gold/70 transition"
        >
          <Globe className="h-3 w-3" />
          {site.domain}
          <span className="ml-1 opacity-0 group-hover:opacity-100 text-white/25 transition">(edit)</span>
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a href={`https://${site.domain}/organiser`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:border-gold/40 hover:text-gold">
          <ExternalLink className="h-3 w-3" /> Organiser
        </a>
        <a href={`https://${site.domain}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:border-white/30 hover:text-white">
          <Globe className="h-3 w-3" /> Public site
        </a>
        <a href={`/hub/sites/${site.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-gold/20">
          <Settings className="h-3 w-3" /> Edit Settings
        </a>
        <button onClick={() => { setShowUserForm(v => !v); setUserMsg(null); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20">
          <UserPlus className="h-3 w-3" /> Create Login
        </button>
      </div>

      {/* Success/error message */}
      {userMsg && (
        <p className={`mt-2 text-xs ${userMsg.ok ? 'text-green-400' : 'text-red-400'}`}>{userMsg.text}</p>
      )}

      {/* Create organiser account form */}
      {showUserForm && (
        <div className="mt-3 space-y-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-300/60">Create Organiser Account</p>
          <input value={userForm.first_name} onChange={e => setUserForm(f => ({ ...f, first_name: e.target.value }))}
            placeholder="First name" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none" />
          <input value={userForm.last_name} onChange={e => setUserForm(f => ({ ...f, last_name: e.target.value }))}
            placeholder="Last name" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none" />
          <input value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Email" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none" />
          <input type="password" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Password (min 8 chars)" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none" />
          <div className="flex gap-2 pt-1">
            <button onClick={createUser} disabled={userSaving || !userForm.email || userForm.password.length < 8}
              className="rounded-lg bg-gold-gradient px-4 py-1.5 text-xs font-bold text-ink disabled:opacity-50">
              {userSaving ? 'Creating…' : 'Create Account'}
            </button>
            <button onClick={() => setShowUserForm(false)} className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white/50 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
