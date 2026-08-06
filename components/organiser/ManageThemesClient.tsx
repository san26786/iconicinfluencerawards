"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Database,
  GripVertical,
  Upload,
  ImageOff,
} from "lucide-react";

const ICON_OPTIONS: IconName[] = [
  "Sparkles","Trophy","Star","Crown","Megaphone","Users","TrendingUp",
  "Rocket","Smile","UtensilsCrossed","Lightbulb","HeartHandshake",
  "Building2","Home","Leaf","Store","Handshake","Newspaper","Globe",
  "UserPlus","PartyPopper","DoorOpen","FileText","Scale","ListChecks",
  "BadgeCheck",
];

type SiteOption = { id: number; name: string; domain: string };

type Theme = {
  id: number;
  name: string;
  theme: string | null;
  tagline: string | null;
  description: string | null;
  icon: string;
  logo_url: string | null;
  href: string | null;
  is_hidden: boolean;
  display_order: number;
  linked_site_id: number | null;
  linked_site_ids: number[] | null;
};

type FormValues = {
  name: string;
  theme: string;
  tagline: string;
  description: string;
  icon: string;
  logo_url: string;
  href: string;
  is_hidden: boolean;
  display_order: string;
  linked_site_ids: number[];
};

const emptyForm = (): FormValues => ({
  name: "",
  theme: "",
  tagline: "",
  description: "",
  icon: "Sparkles",
  logo_url: "",
  href: "",
  is_hidden: false,
  display_order: "0",
  linked_site_ids: [],
});

function themeToForm(t: Theme): FormValues {
  return {
    name: t.name,
    theme: t.theme ?? "",
    tagline: t.tagline ?? "",
    description: t.description ?? "",
    icon: t.icon,
    logo_url: t.logo_url ?? "",
    href: t.href ?? "",
    is_hidden: t.is_hidden,
    display_order: String(t.display_order),
    linked_site_ids: t.linked_site_ids ?? (t.linked_site_id ? [t.linked_site_id] : []),
  };
}

async function apiFetch(url: string, method: string, body?: object) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text); } catch {
    throw new Error(res.ok ? 'Unexpected server response' : `Server error (${res.status})`);
  }
  if (!res.ok) throw new Error((data.error as string) ?? `Request failed (${res.status})`);
  return data;
}

export function ManageThemesClient({ initial, sites = [] }: { initial: Theme[]; sites?: SiteOption[] }) {
  const [themes, setThemes] = useState<Theme[]>(initial);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(t: Theme) {
    setEditingId(t.id);
    setForm(themeToForm(t));
    setError(null);
  }

  function startNew() {
    setEditingId("new");
    setForm(emptyForm());
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function field(key: keyof FormValues, value: string | boolean | number[]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        display_order: parseInt(form.display_order, 10) || 0,
        theme: form.theme || null,
        tagline: form.tagline || null,
        description: form.description || null,
        logo_url: form.logo_url || null,
        href: form.href || null,
      };
      const enriched = {
        ...payload,
        linked_site_ids: form.linked_site_ids,
        linked_site_id: form.linked_site_ids[0] ?? null,
      };
      if (editingId === "new") {
        const data = await apiFetch("/api/organiser/themes", "POST", enriched);
        setThemes((prev) => [...prev, data.theme as Theme]);
      } else {
        const data = await apiFetch(`/api/organiser/themes/${editingId}`, "PUT", enriched);
        setThemes((prev) => prev.map((t) => (t.id === editingId ? data.theme as Theme : t)));
      }
      setEditingId(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error saving");
    } finally {
      setSaving(false);
    }
  }

  async function toggleHidden(t: Theme) {
    try {
      const data = await apiFetch(`/api/organiser/themes/${t.id}`, "PUT", { is_hidden: !t.is_hidden });
      setThemes((prev) => prev.map((x) => (x.id === t.id ? data.theme as Theme : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error updating");
    }
  }

  async function deleteTheme(id: number) {
    if (!confirm("Delete this theme? This cannot be undone.")) return;
    try {
      await apiFetch(`/api/organiser/themes/${id}`, "DELETE");
      setThemes((prev) => prev.filter((t) => t.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error deleting");
    }
  }

  async function seedDefaults() {
    if (!confirm("Seed the default themes from content.ts? Existing themes will not be overwritten.")) return;
    setSeeding(true);
    setError(null);
    try {
      const data = await apiFetch("/api/organiser/themes", "POST", { action: "seed" });
      setThemes(data.themes as Theme[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error seeding");
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/55">
          {themes.length} theme{themes.length !== 1 ? "s" : ""} · hidden themes are excluded from the public /themes page
        </p>
        <div className="flex gap-3">
          {themes.length === 0 && (
            <button
              onClick={seedDefaults}
              disabled={seeding}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-gold/40 hover:text-white disabled:opacity-50"
            >
              <Database className="h-4 w-4" />
              {seeding ? "Seeding…" : "Seed Defaults"}
            </button>
          )}
          <button
            onClick={startNew}
            disabled={editingId !== null}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-2 text-sm font-semibold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Theme
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* New theme form */}
      {editingId === "new" && (
        <div className="rounded-2xl border border-gold/25 bg-gold/5 p-6">
          <h3 className="mb-5 font-display text-lg font-semibold text-white">New Theme</h3>
          <ThemeForm form={form} field={field} saving={saving} error={error} onSave={save} onCancel={cancelEdit} sites={sites} />
        </div>
      )}

      {/* Theme list */}
      {themes.length === 0 && editingId !== "new" ? (
        <div className="rounded-2xl glass p-12 text-center">
          <p className="text-white/40">No themes yet. Add one manually or seed the defaults.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {themes.map((t) => (
            <div key={t.id} className={`rounded-2xl glass p-5 transition ${t.is_hidden ? "opacity-50" : ""}`}>
              {editingId === t.id ? (
                <>
                  <h3 className="mb-5 font-display text-lg font-semibold text-white">Edit Theme</h3>
                  <ThemeForm form={form} field={field} saving={saving} error={error} onSave={save} onCancel={cancelEdit} sites={sites} />
                </>
              ) : (
                <div className="flex items-start gap-4">
                  <GripVertical className="mt-0.5 h-5 w-5 shrink-0 text-white/20" />
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gold/25 bg-gold/10 text-gold">
                    {t.logo_url ? (
                      <img src={t.logo_url} alt={t.name} className="h-8 w-8 object-contain" />
                    ) : (
                      <Icon name={t.icon as IconName} className="h-5 w-5" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gold">{t.theme ?? "—"}</span>
                      <span className="text-xs text-white/30">·</span>
                      <span className="font-display font-semibold text-white">{t.name}</span>
                      {t.is_hidden && (
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">Hidden</span>
                      )}
                    </div>
                    {t.tagline && <p className="mt-0.5 text-sm text-gold/70">{t.tagline}</p>}
                    {t.description && <p className="mt-1 text-sm leading-relaxed text-white/50 line-clamp-2">{t.description}</p>}
                    {t.href && (
                      <a href={t.href} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-white/30 hover:text-gold/60">
                        {t.href}
                      </a>
                    )}
                    {((t.linked_site_ids && t.linked_site_ids.length > 0) || t.linked_site_id) && (
                      <p className="mt-1 text-xs text-gold/50">
                        → categories also on:{' '}
                        {(t.linked_site_ids && t.linked_site_ids.length > 0
                          ? t.linked_site_ids
                          : t.linked_site_id ? [t.linked_site_id] : []
                        ).map(sid => sites.find(s => s.id === sid)?.name ?? `site #${sid}`).join(', ')}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-white/25">Order: {t.display_order}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => toggleHidden(t)}
                      title={t.is_hidden ? "Show on public page" : "Hide from public page"}
                      className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                    >
                      {t.is_hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => startEdit(t)}
                      disabled={editingId !== null}
                      className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteTheme(t.id)}
                      className="rounded-lg p-2 text-white/40 transition hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThemeForm({
  form,
  field,
  saving,
  error,
  onSave,
  onCancel,
  sites,
}: {
  form: FormValues;
  field: (key: keyof FormValues, value: string | boolean | number[]) => void;
  saving: boolean;
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  sites: SiteOption[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Name *</span>
          <input
            value={form.name}
            onChange={(e) => field("name", e.target.value)}
            placeholder="e.g. Agency Excellence Awards"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Theme Category</span>
          <input
            value={form.theme}
            onChange={(e) => field("theme", e.target.value)}
            placeholder="e.g. Women in Business"
            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Tagline</span>
        <input
          value={form.tagline}
          onChange={(e) => field("tagline", e.target.value)}
          placeholder="e.g. Championing women in business"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Description</span>
        <textarea
          value={form.description}
          onChange={(e) => field("description", e.target.value)}
          rows={3}
          placeholder="Brief description shown on the themes page…"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Link URL</span>
        <input
          value={form.href}
          onChange={(e) => field("href", e.target.value)}
          placeholder="https://…"
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none"
        />
      </label>

      <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
            Linked Sites <span className="normal-case text-white/30">(categories also show on)</span>
          </span>
          {sites.length === 0 ? (
            <p className="text-xs text-white/30">No other active sites found.</p>
          ) : (
            <>
              {/* Quick-select buttons */}
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => field("linked_site_ids", [])}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                    form.linked_site_ids.length === 0
                      ? "border-gold/40 bg-gold/15 text-gold"
                      : "border-white/10 text-white/45 hover:text-white hover:border-white/25"
                  }`}
                >
                  This site only
                </button>
                <button
                  type="button"
                  onClick={() => field("linked_site_ids", sites.map(s => s.id))}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
                    form.linked_site_ids.length === sites.length
                      ? "border-gold/40 bg-gold/15 text-gold"
                      : "border-white/10 text-white/45 hover:text-white hover:border-white/25"
                  }`}
                >
                  All Sites
                </button>
              </div>
              {/* Per-site checkboxes */}
              <div className="space-y-2 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
                {sites.map(s => {
                  const checked = form.linked_site_ids.includes(s.id);
                  return (
                    <label key={s.id} className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? form.linked_site_ids.filter(id => id !== s.id)
                            : [...form.linked_site_ids, s.id];
                          field("linked_site_ids", next);
                        }}
                        className="h-4 w-4 rounded border-white/20 accent-gold"
                      />
                      <span className="flex-1 text-sm text-white/75">{s.name}</span>
                      <span className="text-xs text-white/25">{s.domain}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
      </div>

      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
          Theme Logo{" "}
          <span className="normal-case font-normal text-white/30">
            (optional — replaces icon on public page)
          </span>
        </span>
        <LogoUploader value={form.logo_url} onChange={(url) => field("logo_url", url)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/50">
            Icon{" "}
            <span className="normal-case font-normal text-white/30">
              (shown when no logo uploaded)
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            {ICON_OPTIONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => field("icon", ic)}
                title={ic}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                  form.icon === ic
                    ? "border-gold bg-gold/20 text-gold"
                    : "border-white/15 bg-white/5 text-white/50 hover:border-gold/30 hover:text-white/80"
                }`}
              >
                <Icon name={ic} className="h-4 w-4" />
              </button>
            ))}
          </div>
        </label>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-white/50">Display Order</span>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) => field("display_order", e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-gold/40 focus:outline-none"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_hidden}
              onChange={(e) => field("is_hidden", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 accent-gold"
            />
            <span className="text-sm text-white/70">Hide from public /themes page</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={onSave}
          disabled={saving || !form.name.trim()}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold-sm transition hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Theme"}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

function LogoUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="space-y-2">
      {value && (
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <img
            src={value}
            alt="Theme logo preview"
            className="h-12 w-12 rounded-lg border border-white/10 object-contain bg-white/5 p-1"
          />
          <p className="min-w-0 flex-1 truncate text-xs text-gold/60">Logo will show on the public themes page</p>
          <button
            type="button"
            onClick={() => onChange("")}
            title="Remove logo"
            className="flex-shrink-0 rounded-lg p-1.5 text-white/30 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <ImageOff className="h-4 w-4" />
          </button>
        </div>
      )}
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste logo image URL (e.g. from imgbb.com or Cloudinary)"
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-gold/40 focus:outline-none"
      />
      <p className="text-xs text-white/30">Upload your image to <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="text-gold/50 hover:text-gold">imgbb.com</a> (free) and paste the direct image URL here.</p>
    </div>
  );
}
