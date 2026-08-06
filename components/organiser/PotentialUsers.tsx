"use client";

// Organiser "Potential Users": CRUD + CSV import + filters/pagination, plus the
// "select recipients → pick a template → preview one record → queue send" flow.
// Listing is fetched from the API (server-side paginated/filtered); mutations
// call the API then reload() to re-fetch the current page.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Search,
  Send,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserPlus,
  X,
} from "lucide-react";
import { AWARD_CATEGORIES } from "@/lib/content";
import { renderTemplate, varsForPotentialUser } from "@/lib/email/template";
import { ImportWizard } from "./ImportWizard";

export type FieldDef = { key: string; label: string };

export type PotentialUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  title: string;
  position: string;
  gender: string;
  phone: string;
  custom: Record<string, unknown>;
  source: string;
  created: string;
  assignedCategories: string[];
};
export type TemplateOption = {
  id: number;
  name: string;
  subject: string;
  html: string;
};
export type FlowOption = {
  id: number;
  name: string;
  description: string;
  stepCount: number;
};
type Brand = { siteName: string; siteUrl: string; year: string };

const PAGE_SIZES = [10, 25, 50];
const input =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40";

type Toast = { kind: "ok" | "err"; msg: string; href?: string } | null;
type EditState = (Partial<PotentialUser> & { id?: number }) | null;

export function PotentialUsers({
  templates,
  flows,
  brand,
  fieldDefs,
}: {
  templates: TemplateOption[];
  flows: FlowOption[];
  brand: Brand;
  fieldDefs: FieldDef[];
}) {
  const colRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [templateId, setTemplateId] = useState<number | "">(
    templates[0]?.id ?? "",
  );
  const [flowId, setFlowId] = useState<number | "">("");

  const [edit, setEdit] = useState<EditState>(null);
  const [deleteUser, setDeleteUser] = useState<PotentialUser | null>(null);
  const [viewUser, setViewUser] = useState<PotentialUser | null>(null);
  const [preview, setPreview] = useState(false);
  const [wizard, setWizard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  // Which custom fields are shown as table columns.
  const [visibleCustom, setVisibleCustom] = useState<string[]>([]);
  const [colMenu, setColMenu] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCategories, setAssignCategories] = useState<string[]>([]);
  const [assignError, setAssignError] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignProgress, setAssignProgress] = useState(0);
  // Filter state
  const [filterTitle, setFilterTitle] = useState<string>("");
  const [filterPosition, setFilterPosition] = useState<string>("");
  const [filterGender, setFilterGender] = useState<string>("");
  const [filterCompany, setFilterCompany] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");
  const [filterNoCategories, setFilterNoCategories] = useState(false);
  const [filterMenu, setFilterMenu] = useState(false);
  // Select-all scope prompt (current page vs all matching the filter).
  const [scopeAsk, setScopeAsk] = useState(false);

  // Server-driven data: the current page of rows + the total matching count,
  // plus the distinct filter values (facets). Everything loads from the API so
  // the table is fast no matter how large the list is.
  const [rows, setRows] = useState<PotentialUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectingAll, setSelectingAll] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [facets, setFacets] = useState<{
    titles: string[];
    positions: string[];
    genders: string[];
    companies: string[];
    sources: string[];
  }>({ titles: [], positions: [], genders: [], companies: [], sources: [] });
  const reload = () => setReloadKey((k) => k + 1);

  const visibleCustomDefs = fieldDefs.filter((d) =>
    visibleCustom.includes(d.key),
  );

  // Filter dropdown values come from the server (distinct over the whole table).
  const uniqueTitles = facets.titles;
  const uniquePositions = facets.positions;
  const uniqueGenders = facets.genders;
  const uniqueCompanies = facets.companies;
  const uniqueSources = facets.sources;

  const filterActive = Boolean(
    debouncedSearch.trim() ||
      filterTitle ||
      filterPosition ||
      filterGender ||
      filterCompany ||
      filterSource ||
      filterNoCategories,
  );

  // The shared query string sent to the list + ids endpoints.
  const filterParams = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedSearch.trim()) p.set("search", debouncedSearch.trim());
    if (filterTitle) p.set("title", filterTitle);
    if (filterPosition) p.set("position", filterPosition);
    if (filterGender) p.set("gender", filterGender);
    if (filterCompany) p.set("company", filterCompany);
    if (filterSource) p.set("source", filterSource);
    if (filterNoCategories) p.set("noCategories", "1");
    return p.toString();
  }, [
    debouncedSearch,
    filterTitle,
    filterPosition,
    filterGender,
    filterCompany,
    filterSource,
    filterNoCategories,
  ]);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever the filter set or page size changes.
  useEffect(() => setPage(1), [filterParams, pageSize]);

  // Load filter dropdown values (once, and after the data changes).
  useEffect(() => {
    let alive = true;
    fetch("/api/organiser/potential-users/facets")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setFacets({
          titles: d.titles ?? [],
          positions: d.positions ?? [],
          genders: d.genders ?? [],
          companies: d.companies ?? [],
          sources: d.sources ?? [],
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  // Fetch the current page whenever paging/filters/reload change.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const p = new URLSearchParams(filterParams);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    fetch(`/api/organiser/potential-users/list?${p.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setRows(Array.isArray(d.rows) ? d.rows : []);
        setTotal(Number(d.total) || 0);
      })
      .catch(() => {
        if (alive) {
          setRows([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [filterParams, page, pageSize, reloadKey]);

  // Close the columns dropdown on outside click.
  useEffect(() => {
    if (!colMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (!colRef.current?.contains(e.target as Node)) setColMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [colMenu]);

  // Close the filters dropdown on outside click.
  useEffect(() => {
    if (!filterMenu) return;
    const onDoc = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [filterMenu]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const pageIds = rows.map((u) => u.id);
  const allOnPage =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  // If a deletion/filter shrinks the result set below the current page, step back.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const selectThisPage = () =>
    setSelected((s) => {
      const n = new Set(s);
      pageIds.forEach((i) => n.add(i));
      return n;
    });
  // Select every record matching the current filter — fetch the matching IDs
  // from the server (just integers) rather than holding all rows in the browser.
  const selectAllMatching = async () => {
    setSelectingAll(true);
    try {
      const res = await fetch(
        `/api/organiser/potential-users/ids${filterParams ? `?${filterParams}` : ""}`,
      );
      const d = await res.json().catch(() => ({ ids: [] }));
      setSelected(new Set<number>(Array.isArray(d.ids) ? d.ids : []));
    } finally {
      setSelectingAll(false);
    }
  };
  // Header checkbox: deselect the page if it's fully selected; otherwise, when
  // there's more than one page of (possibly filtered) results, ask whether to
  // select just this page or everything that matches — else just take the page.
  const togglePage = () => {
    if (allOnPage) {
      setSelected((s) => {
        const n = new Set(s);
        pageIds.forEach((i) => n.delete(i));
        return n;
      });
      return;
    }
    if (total > pageIds.length) {
      setScopeAsk(true);
      return;
    }
    selectThisPage();
  };

  const selectedUsers = rows.filter((u) => selected.has(u.id));
  const chosenTemplate = templates.find((t) => t.id === templateId);
  // Categories grouped by theme so the assign modal shows which award each
  // category belongs to (the flat list was confusing to pick from).
  const categoryGroups = useMemo(
    () =>
      AWARD_CATEGORIES.map((g) => ({
        id: g.id,
        name: g.name,
        blurb: g.blurb,
        categories: [...g.popular, ...g.prime, ...g.more],
      })),
    [],
  );

  /* ── mutations ───────────────────────────────────────────────────────── */
  const saveUser = async (u: Partial<PotentialUser> & { id?: number }) => {
    setBusy(true);
    try {
      const url = u.id
        ? `/api/organiser/potential-users/${u.id}`
        : "/api/organiser/potential-users";
      const res = await fetch(url, {
        method: u.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(u),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.error || "Could not save." };
      setEdit(null);
      setToast({
        kind: "ok",
        msg: u.id ? "Potential user updated." : "Potential user added.",
      });
      reload();
      return { ok: true };
    } catch {
      return { error: "Network error." };
    } finally {
      setBusy(false);
    }
  };

  const removeUser = async (id: number) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/organiser/potential-users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setToast({ kind: "err", msg: "Could not delete." });
        return;
      }
      setDeleteUser(null);
      setSelected((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      setToast({ kind: "ok", msg: "Potential user deleted." });
      reload();
    } finally {
      setBusy(false);
    }
  };

  const queueSend = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/organiser/email-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          recipientIds: [...selected],
          ...(flowId ? { flowId } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({
          kind: "err",
          msg: data.error || "Could not queue the send.",
        });
        return;
      }
      setPreview(false);
      setSelected(new Set());
      setToast({
        kind: "ok",
        msg: `Queued ${data.total} email${data.total === 1 ? "" : "s"} (1 per ${data.intervalSeconds}s, ${data.batchSize} at a time).`,
        href: "/organiser/email-jobs",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${toast.kind === "ok" ? "border-gold/30 bg-gold/[0.06] text-white/85" : "border-red-500/30 bg-red-500/10 text-red-200"}`}
        >
          {toast.kind === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
          ) : (
            <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p>{toast.msg}</p>
            {toast.href && (
              <a
                href={toast.href}
                className="mt-1 inline-block text-xs text-gold underline-offset-4 hover:underline"
              >
                View the send queue →
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-white/40 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl glass p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, company…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => setEdit({})}
          className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-ink shadow-gold-sm"
        >
          <UserPlus className="h-4 w-4" /> Add user
        </button>
        <button
          type="button"
          onClick={() => setWizard(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 transition-colors hover:border-gold/40 hover:text-white"
        >
          <Upload className="h-4 w-4 text-gold" /> Import CSV
        </button>
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterMenu((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 transition-colors hover:border-gold/40 hover:text-white"
          >
            <SlidersHorizontal className="h-4 w-4 text-gold" /> Filters
          </button>
          {filterMenu && (
            <div className="absolute left-0 z-20 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-white/10 bg-ink/95 p-3 shadow-glass backdrop-blur-md space-y-3">
              {(filterTitle ||
                filterPosition ||
                filterGender ||
                filterCompany ||
                filterSource ||
                filterNoCategories) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterTitle("");
                    setFilterPosition("");
                    setFilterGender("");
                    setFilterCompany("");
                    setFilterSource("");
                    setFilterNoCategories(false);
                  }}
                  className="w-full rounded-lg border border-gold/30 bg-gold/[0.06] px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/10"
                >
                  Clear all filters
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterNoCategories((v) => !v)}
                className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  filterNoCategories
                    ? "border-gold/50 bg-gold/[0.06] text-white"
                    : "border-white/10 text-white/70 hover:border-white/25"
                }`}
              >
                <span
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
                    filterNoCategories
                      ? "border-transparent bg-gold-gradient"
                      : "border-white/30"
                  }`}
                >
                  {filterNoCategories && (
                    <span className="h-1.5 w-1.5 rounded-sm bg-ink" />
                  )}
                </span>
                Without categories only
              </button>
              {uniqueTitles.length > 0 && (
                <SearchableSelect
                  label="Title"
                  value={filterTitle}
                  options={uniqueTitles}
                  onChange={setFilterTitle}
                />
              )}
              {uniquePositions.length > 0 && (
                <SearchableSelect
                  label="Position"
                  value={filterPosition}
                  options={uniquePositions}
                  onChange={setFilterPosition}
                />
              )}
              {uniqueGenders.length > 0 && (
                <SearchableSelect
                  label="Gender"
                  value={filterGender}
                  options={uniqueGenders}
                  onChange={setFilterGender}
                />
              )}
              {uniqueCompanies.length > 0 && (
                <SearchableSelect
                  label="Company"
                  value={filterCompany}
                  options={uniqueCompanies}
                  onChange={setFilterCompany}
                />
              )}
              {uniqueSources.length > 0 && (
                <SearchableSelect
                  label="Source"
                  value={filterSource}
                  options={uniqueSources}
                  onChange={setFilterSource}
                />
              )}
            </div>
          )}
        </div>
        {fieldDefs.length > 0 && (
          <div ref={colRef} className="relative">
            <button
              type="button"
              onClick={() => setColMenu((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 transition-colors hover:border-gold/40 hover:text-white"
            >
              <SlidersHorizontal className="h-4 w-4 text-gold" /> Fields
            </button>
            {colMenu && (
              <div className="absolute right-0 z-20 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl border border-white/10 bg-ink/95 p-2 shadow-glass backdrop-blur-md">
                <p className="px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">
                  Custom fields
                </p>
                {fieldDefs.map((d) => {
                  const on = visibleCustom.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() =>
                        setVisibleCustom((c) =>
                          on ? c.filter((x) => x !== d.key) : [...c, d.key],
                        )
                      }
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.04]"
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${on ? "border-transparent bg-gold-gradient" : "border-white/30"}`}
                      >
                        {on && (
                          <span className="h-1.5 w-1.5 rounded-sm bg-ink" />
                        )}
                      </span>
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk / send bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] px-4 py-3">
          <span className="text-sm font-semibold text-white">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAssignCategories([]);
                setAssignError("");
                setAssignProgress(0);
                setAssignOpen(true);
              }}
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-gold/40 hover:text-white"
            >
              Assign categories
            </button>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-gold/50 focus:outline-none [&_option]:bg-ink"
            >
              {templates.length === 0 && (
                <option value="">No templates yet</option>
              )}
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!chosenTemplate}
              onClick={() => setPreview(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-ink shadow-gold-sm disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Email selected
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-full px-3 py-2 text-xs font-semibold text-white/60 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <p className="px-1 text-xs text-white/45">
        {loading ? (
          <span className="inline-flex items-center gap-1.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" /> Loading…
          </span>
        ) : (
          <>
            Showing {rows.length} of {total.toLocaleString()}
            {filterActive ? " matching" : ""}
          </>
        )}
      </p>

      {!loading && total === 0 ? (
        <div className="rounded-3xl glass px-6 py-14 text-center">
          <UserPlus className="mx-auto h-6 w-6 text-white/30" />
          <p className="mt-3 text-sm text-white/55">
            {filterActive
              ? "No potential users match your search."
              : "No potential users yet — add one or import a CSV."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl glass">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-white/45">
                    <th className="px-5 py-4">
                      <Check
                        checked={allOnPage}
                        onChange={togglePage}
                        label="Select all on page"
                      />
                    </th>
                    <th className="px-5 py-4 font-semibold">Name</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Company</th>
                    <th className="px-5 py-4 font-semibold">Title</th>
                    <th className="px-5 py-4 font-semibold">Position</th>
                    <th className="px-5 py-4 font-semibold">Gender</th>
                    <th className="px-5 py-4 font-semibold">Phone</th>
                    {visibleCustomDefs.map((d) => (
                      <th key={d.key} className="px-5 py-4 font-semibold">
                        {d.label}
                      </th>
                    ))}
                    <th className="px-5 py-4 font-semibold">Source</th>
                    <th className="px-5 py-4 font-semibold">Categories</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <Check
                          checked={selected.has(u.id)}
                          onChange={() => toggle(u.id)}
                          label={`Select ${u.email}`}
                        />
                      </td>
                      <td className="px-5 py-4 font-medium text-white">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                          "—"}
                      </td>
                      <td className="px-5 py-4 text-white/75">{u.email}</td>
                      <td className="px-5 py-4 text-white/60">
                        {u.company || "—"}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {u.title || "—"}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {u.position || "—"}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {u.gender || "—"}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {u.phone || "—"}
                      </td>
                      {visibleCustomDefs.map((d) => (
                        <td key={d.key} className="px-5 py-4 text-white/60">
                          {String(u.custom?.[d.key] ?? "") || "—"}
                        </td>
                      ))}
                      <td className="px-5 py-4 text-white/50">
                        {u.source || "—"}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {u.assignedCategories.length > 0
                          ? u.assignedCategories.join(", ")
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewUser(u)}
                            title="View details"
                            aria-label="View details"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:border-gold/40 hover:text-gold"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEdit(u)}
                            title="Edit"
                            aria-label="Edit"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:border-gold/40 hover:text-gold"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteUser(u)}
                            title="Delete"
                            aria-label="Delete"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/40 text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-xs text-white/55">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-white focus:border-gold/50 focus:outline-none [&_option]:bg-ink"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <span>
                Page {current} of {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage(current - 1)}
                  disabled={current <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:border-gold/40 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage(current + 1)}
                  disabled={current >= totalPages}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 hover:border-gold/40 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {edit && (
        <UserModal
          initial={edit}
          busy={busy}
          onCancel={() => setEdit(null)}
          onSubmit={saveUser}
        />
      )}
      {viewUser && (
        <Modal
          title="Potential user details"
          onClose={() => setViewUser(null)}
          wide
        >
          <dl className="space-y-3 text-sm">
            <ViewRow
              label="Name"
              value={[viewUser.firstName, viewUser.lastName]
                .filter(Boolean)
                .join(" ")}
            />
            <ViewRow label="Email" value={viewUser.email} />
            <ViewRow label="Title" value={viewUser.title} />
            <ViewRow label="Position" value={viewUser.position} />
            <ViewRow label="Gender" value={viewUser.gender} />
            <ViewRow label="Company" value={viewUser.company} />
            <ViewRow label="Phone" value={viewUser.phone} />
            <ViewRow label="Source" value={viewUser.source} />
            <ViewRow label="Added" value={viewUser.created} />
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="w-40 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-white/45 sm:pt-0.5">
                Assigned categories
              </dt>
              <dd className="text-white/85">
                {viewUser.assignedCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {viewUser.assignedCategories.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-gold/30 bg-gold/[0.06] px-2.5 py-0.5 text-xs text-white/85"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            {Object.keys(viewUser.custom ?? {}).length > 0 && (
              <div className="border-t border-white/10 pt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">
                  Custom fields
                </p>
                <div className="space-y-3">
                  {Object.entries(viewUser.custom ?? {}).map(([k, v]) => (
                    <ViewRow
                      key={k}
                      label={fieldDefs.find((d) => d.key === k)?.label ?? k}
                      value={v == null ? "" : String(v)}
                    />
                  ))}
                </div>
              </div>
            )}
          </dl>
        </Modal>
      )}
      {deleteUser && (
        <Modal
          title="Delete potential user"
          onClose={() => setDeleteUser(null)}
        >
          <p className="text-sm text-white/75">
            Delete <strong className="text-white">{deleteUser.email}</strong>?
            This can't be undone.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteUser(null)}
              disabled={busy}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-white/40 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => removeUser(deleteUser.id)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Delete
            </button>
          </div>
        </Modal>
      )}
      {preview && chosenTemplate && (
        <PreviewModal
          template={chosenTemplate}
          recipient={selectedUsers[0]}
          count={selected.size}
          brand={brand}
          flows={flows}
          flowId={flowId}
          onFlowChange={setFlowId}
          busy={busy}
          onCancel={() => setPreview(false)}
          onConfirm={queueSend}
        />
      )}
      {assignOpen && (
        <Modal
          title="Assign award categories"
          onClose={() => setAssignOpen(false)}
        >
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              Pick at least two award categories — they’re grouped by theme
              below. Each selected person will be assigned a random set of 2–4
              categories drawn from everything you tick here.
            </p>
            <div className="space-y-5">
              {categoryGroups.map((group) => {
                const groupSelected = group.categories.filter((c) =>
                  assignCategories.includes(c),
                ).length;
                const allSelected =
                  groupSelected === group.categories.length &&
                  group.categories.length > 0;
                return (
                  <div key={group.id}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gold">
                          {group.name}
                          {groupSelected > 0 && (
                            <span className="ml-2 text-xs font-normal text-white/45">
                              {groupSelected} selected
                            </span>
                          )}
                        </h4>
                        <p className="truncate text-xs text-white/45">
                          {group.blurb}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setAssignCategories((prev) => {
                            const set = new Set(prev);
                            if (allSelected) {
                              group.categories.forEach((c) => set.delete(c));
                            } else {
                              group.categories.forEach((c) => set.add(c));
                            }
                            return [...set];
                          })
                        }
                        className="flex-shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white/70 transition-colors hover:border-gold/40 hover:text-white"
                      >
                        {allSelected ? "Clear theme" : "Select all"}
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {group.categories.map((category) => {
                        const selectedCat =
                          assignCategories.includes(category);
                        return (
                          <button
                            key={category}
                            type="button"
                            onClick={() =>
                              setAssignCategories((prev) =>
                                prev.includes(category)
                                  ? prev.filter((c) => c !== category)
                                  : [...prev, category],
                              )
                            }
                            className={`rounded-2xl border px-3 py-2 text-left text-sm transition-colors ${
                              selectedCat
                                ? "border-gold bg-gold/10 text-white"
                                : "border-white/10 bg-white/[0.03] text-white/70 hover:border-gold/40 hover:text-white"
                            }`}
                          >
                            {category}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {assignError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
                {assignError}
              </p>
            ) : null}
            {assignBusy && (
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold-gradient transition-all"
                    style={{ width: `${assignProgress}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-white/50">
                  Assigning in batches — {assignProgress}% complete. Keep this
                  open until it finishes.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/50">
                {assignCategories.length} categor
                {assignCategories.length === 1 ? "y" : "ies"} chosen ·{" "}
                {selected.size} recipient{selected.size === 1 ? "" : "s"} will
                each receive a random 2–4.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAssignOpen(false)}
                  disabled={assignBusy}
                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-white/40 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assignCategories.length < 2 || assignBusy}
                  onClick={async () => {
                    setAssignBusy(true);
                    setAssignError("");
                    setAssignProgress(0);
                    // Process in chunks so a 20k-recipient run can't hit the
                    // serverless body/time limit, can report progress, and a
                    // transient blip on one chunk gets one retry before failing.
                    const ids = [...selected];
                    const CHUNK = 1000;
                    let updated = 0;
                    try {
                      for (let i = 0; i < ids.length; i += CHUNK) {
                        const batch = ids.slice(i, i + CHUNK);
                        let ok = false;
                        let lastErr = "";
                        for (let attempt = 0; attempt < 2 && !ok; attempt++) {
                          try {
                            const res = await fetch(
                              "/api/organiser/potential-users/assign-categories",
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  recipientIds: batch,
                                  categories: assignCategories,
                                }),
                              },
                            );
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              lastErr =
                                data.error || "Could not assign categories.";
                              continue;
                            }
                            updated += data.updated ?? batch.length;
                            ok = true;
                          } catch {
                            lastErr = "Network error.";
                          }
                        }
                        if (!ok)
                          throw new Error(
                            lastErr || "Could not assign categories.",
                          );
                        setAssignProgress(
                          Math.round(
                            (Math.min(ids.length, i + batch.length) /
                              ids.length) *
                              100,
                          ),
                        );
                      }
                      setAssignOpen(false);
                      setToast({
                        kind: "ok",
                        msg: `Assigned categories to ${updated} recipient${
                          updated === 1 ? "" : "s"
                        }.`,
                      });
                      reload();
                    } catch (e) {
                      setAssignError(
                        `${
                          e instanceof Error
                            ? e.message
                            : "Could not assign categories."
                        }${updated ? ` (${updated} done before the error — you can retry to finish the rest)` : ""}`,
                      );
                    } finally {
                      setAssignBusy(false);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-60"
                >
                  {assignBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {assignBusy
                    ? `Assigning… ${assignProgress}%`
                    : "Assign randomly"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {scopeAsk && (
        <Modal title="Select records" onClose={() => setScopeAsk(false)}>
          <p className="text-sm text-white/75">
            {filterActive
              ? "A filter is applied. Which records would you like to select?"
              : "Which records would you like to select?"}
          </p>
          <div className="mt-5 space-y-2.5">
            <button
              type="button"
              disabled={selectingAll}
              onClick={async () => {
                await selectAllMatching();
                setScopeAsk(false);
              }}
              className="block w-full rounded-xl border border-gold/40 bg-gold/[0.06] px-4 py-3 text-left hover:border-gold/60 disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                {selectingAll && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-gold" />
                )}
                All {total.toLocaleString()} matching
              </span>
              <span className="mt-0.5 block text-xs text-white/55">
                {filterActive
                  ? "Everything that matches the current filter, across all pages."
                  : "Everything in the list, across all pages."}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                selectThisPage();
                setScopeAsk(false);
              }}
              className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:border-white/30"
            >
              <span className="text-sm font-semibold text-white">
                This page only ({pageIds.length})
              </span>
              <span className="mt-0.5 block text-xs text-white/55">
                Just the {pageIds.length} row{pageIds.length === 1 ? "" : "s"}{" "}
                currently shown.
              </span>
            </button>
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setScopeAsk(false)}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-white/40"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {wizard && (
        <ImportWizard
          onClose={() => {
            setWizard(false);
            reload();
          }}
        />
      )}
    </div>
  );
}

/* ── Small building blocks ─────────────────────────────────────────────── */

// A select box with a built-in search field — for filters that can have many
// options (e.g. Company). Renders its list inline inside the filters panel so
// it doesn't fight the panel's own outside-click handling.
function SearchableSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const ql = q.trim().toLowerCase();
  const list = ql ? options.filter((o) => o.toLowerCase().includes(ql)) : options;
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={ref}>
      <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm focus:border-gold/50 focus:outline-none"
      >
        <span className={value ? "truncate text-white" : "text-white/50"}>
          {value || "— All —"}
        </span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-1 overflow-hidden rounded-lg border border-white/10 bg-ink/95">
          <div className="relative border-b border-white/10">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="w-full bg-transparent py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
          </div>
          <div className="max-h-44 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => pick("")}
              className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-white/[0.05] ${!value ? "text-gold" : "text-white/70"}`}
            >
              — All —
            </button>
            {list.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => pick(o)}
                className={`block w-full truncate px-3 py-1.5 text-left text-sm hover:bg-white/[0.05] ${value === o ? "text-gold" : "text-white/80"}`}
              >
                {o}
              </button>
            ))}
            {list.length === 0 && (
              <p className="px-3 py-2 text-xs text-white/40">No matches</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${checked ? "border-transparent bg-gold-gradient" : "border-white/30 hover:border-gold/50"}`}
    >
      {checked && <span className="h-2 w-2 rounded-sm bg-ink" />}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} overflow-hidden rounded-3xl border border-white/10 bg-ink/95 shadow-glass`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-white">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ViewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-40 flex-shrink-0 text-xs font-semibold uppercase tracking-wider text-white/45 sm:pt-0.5">
        {label}
      </dt>
      <dd className="break-words text-white/85">
        {value && value.trim() ? value : "—"}
      </dd>
    </div>
  );
}

function UserModal({
  initial,
  busy,
  onCancel,
  onSubmit,
}: {
  initial: Partial<PotentialUser> & { id?: number };
  busy: boolean;
  onCancel: () => void;
  onSubmit: (
    u: Partial<PotentialUser> & { id?: number },
  ) => Promise<{ ok?: boolean; error?: string } | void>;
}) {
  const [f, setF] = useState({
    firstName: initial.firstName ?? "",
    lastName: initial.lastName ?? "",
    email: initial.email ?? "",
    company: initial.company ?? "",
    title: initial.title ?? "",
    position: initial.position ?? "",
    gender: initial.gender ?? "",
    phone: initial.phone ?? "",
  });
  const [error, setError] = useState("");
  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email))
      return setError("A valid email is required.");
    setError("");
    // Preserve any imported custom fields on update.
    const res = await onSubmit({
      ...f,
      id: initial.id,
      custom: initial.custom ?? {},
    });
    if (res && "error" in res && res.error) setError(res.error);
  };

  return (
    <Modal
      title={initial.id ? "Edit potential user" : "Add potential user"}
      onClose={onCancel}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <select className={input} value={f.title} onChange={set("title")}>
            <option value="" className="bg-ink text-white">
              — Title —
            </option>
            <option value="Mr" className="bg-ink text-white">
              Mr
            </option>
            <option value="Mrs" className="bg-ink text-white">
              Mrs
            </option>
            <option value="Miss" className="bg-ink text-white">
              Miss
            </option>
            <option value="Ms" className="bg-ink text-white">
              Ms
            </option>
            <option value="Dr" className="bg-ink text-white">
              Dr
            </option>
            <option value="Prof" className="bg-ink text-white">
              Prof
            </option>
            <option value="Sir" className="bg-ink text-white">
              Sir
            </option>
            <option value="Dame" className="bg-ink text-white">
              Dame
            </option>
          </select>
          <input
            className={input}
            placeholder="First name"
            value={f.firstName}
            onChange={set("firstName")}
          />
        </div>
        <input
          className={input}
          placeholder="Last name"
          value={f.lastName}
          onChange={set("lastName")}
        />
        <input
          className={input}
          placeholder="Email *"
          value={f.email}
          onChange={set("email")}
        />
        <input
          className={input}
          placeholder="Company"
          value={f.company}
          onChange={set("company")}
        />
        <input
          className={input}
          placeholder="Position"
          value={f.position}
          onChange={set("position")}
        />
        <select className={input} value={f.gender} onChange={set("gender")}>
          <option value="" className="bg-ink text-white">
            — Gender —
          </option>
          {[
            "Male",
            "Female",
            "Undecided",
            ...(f.gender && !["Male", "Female", "Undecided"].includes(f.gender)
              ? [f.gender]
              : []),
          ].map((g) => (
            <option key={g} value={g} className="bg-ink text-white">
              {g}
            </option>
          ))}
        </select>
        <input
          className={input}
          placeholder="Phone"
          value={f.phone}
          onChange={set("phone")}
        />
        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-white/40 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
            {initial.id ? "Save" : "Add"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PreviewModal({
  template,
  recipient,
  count,
  brand,
  flows,
  flowId,
  onFlowChange,
  busy,
  onCancel,
  onConfirm,
}: {
  template: TemplateOption;
  recipient?: PotentialUser;
  count: number;
  brand: Brand;
  flows: FlowOption[];
  flowId: number | "";
  onFlowChange: (id: number | "") => void;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const vars = recipient
    ? varsForPotentialUser(recipient, brand)
    : { siteName: brand.siteName, siteUrl: brand.siteUrl, year: brand.year };
  const subject = renderTemplate(template.subject, vars);
  const html = renderTemplate(template.html, vars);

  return (
    <Modal title="Preview & confirm" onClose={onCancel} wide>
      <p className="mb-3 text-sm text-white/70">
        Previewing for{" "}
        <strong className="text-white">
          {recipient?.email ?? "the first recipient"}
        </strong>
        . This will be sent to <strong className="text-white">{count}</strong>{" "}
        recipient{count === 1 ? "" : "s"}.
      </p>
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-2 text-xs text-white/55">
          <span className="font-semibold uppercase tracking-wider">
            Subject:
          </span>{" "}
          <span className="text-white/85">{subject}</span>
        </p>
        <iframe
          title="Email preview"
          srcDoc={html}
          className="h-[420px] w-full rounded-lg border border-white/10 bg-white"
        />
      </div>
      {flows.length > 0 && (
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
            Automated reminder flow
          </span>
          <select
            value={flowId}
            onChange={(e) =>
              onFlowChange(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none [&_option]:bg-ink"
          >
            <option value="">No automated reminder</option>
            {flows.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.stepCount} step{f.stepCount === 1 ? "" : "s"})
              </option>
            ))}
          </select>
          {flowId && (
            <span className="mt-1.5 block text-xs text-white/50">
              {flows.find((f) => f.id === flowId)?.description ||
                "Eligible recipients will be enrolled automatically as the flow steps become due."}
            </span>
          )}
        </label>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 hover:border-white/40 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{" "}
          <Send className="h-4 w-4" /> Confirm & queue
        </button>
      </div>
    </Modal>
  );
}
