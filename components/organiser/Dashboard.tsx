"use client";

// Organiser dashboard body: a tab switcher between Registered Users and
// submitted Nominations. Both datasets are fetched server-side (see
// app/organiser/page.tsx) and passed in as plain serialisable props.
//
// The Nominations view supports search + filters, show/hide columns
// (persisted to localStorage), category pills with "show more", and
// client-side pagination. Each row links to the View / Edit detail page.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Power,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

export type VisitorItem = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  registered: string;
};

export type NominationItem = {
  id: number;
  nominee: string;
  nomineeEmail: string | null;
  nomineeMobile: string | null;
  anonymous: boolean;
  selfNominate: boolean;
  categories: string[];
  howHeard: string | null;
  nominator: string;
  nominatorEmail: string | null;
  businessName: string | null;
  businessLocation: string | null;
  businessCategory: string | null;
  submitted: string;
};

type Tab = "users" | "nominations";

export function OrganiserDashboard({
  visitors,
  nominations,
}: {
  visitors: VisitorItem[];
  nominations: NominationItem[];
}) {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="mt-8">
      <div className="inline-flex rounded-full glass p-1">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Registered Users ({visitors.length})
        </TabButton>
        <TabButton
          active={tab === "nominations"}
          onClick={() => setTab("nominations")}
        >
          Nominations ({nominations.length})
        </TabButton>
      </div>

      <div className="mt-5">
        {tab === "users" ? (
          <RegisteredUsersManager visitors={visitors} />
        ) : (
          <NominationsManager nominations={nominations} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-gold-gradient text-ink shadow-gold-sm"
          : "text-white/70 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Registered users ─────────────────────────────────────────────────── */

type StatusFilter = "all" | "active" | "inactive";

// What the confirmation modal is asking the organiser to confirm.
type ConfirmState = { ids: number[]; active: boolean } | null;
// Lightweight result banner (success or error), optionally with a link to copy.
type Toast = { kind: "ok" | "err"; msg: string; link?: string } | null;

function RegisteredUsersManager({ visitors }: { visitors: VisitorItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [pwUser, setPwUser] = useState<VisitorItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visitors.filter((v) => {
      if (statusFilter === "active" && !v.active) return false;
      if (statusFilter === "inactive" && v.active) return false;
      if (q) {
        const hay = [v.name, v.email, v.phone].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visitors, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);

  const pageIds = slice.map((v) => v.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleOne = (id: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = () =>
    setSelected((s) => {
      const next = new Set(s);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  const clearSelection = () => setSelected(new Set());

  // Activate / deactivate one or many. Called only after modal confirmation.
  const applyStatus = async (ids: number[], active: boolean) => {
    setBusy(true);
    try {
      const res = await fetch("/api/organiser/users/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ kind: "err", msg: data.error || "Could not update users." });
        return;
      }
      setToast({
        kind: "ok",
        msg: `${data.updated} ${data.updated === 1 ? "user" : "users"} marked ${active ? "active" : "inactive"}.`,
      });
      clearSelection();
      setConfirm(null);
      router.refresh();
    } catch {
      setToast({ kind: "err", msg: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async (v: VisitorItem) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/organiser/users/${v.id}/send-reset`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ kind: "err", msg: data.error || "Could not send the reset link." });
        return;
      }
      setToast({ kind: "ok", msg: data.message, link: data.resetUrl });
    } catch {
      setToast({ kind: "err", msg: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  };

  const setPassword = async (id: number, password: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/organiser/users/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: data.error || "Could not update the password." };
      }
      setPwUser(null);
      setToast({ kind: "ok", msg: "Password updated." });
      return { ok: true };
    } catch {
      return { error: "Network error — please try again." };
    } finally {
      setBusy(false);
    }
  };

  if (visitors.length === 0) {
    return <EmptyState icon={Users} text="No users have registered yet." />;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            toast.kind === "ok"
              ? "border-gold/30 bg-gold/[0.06] text-white/85"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {toast.kind === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
          ) : (
            <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p>{toast.msg}</p>
            {toast.link && (
              <a
                href={toast.link}
                className="mt-1 block break-all text-xs text-gold underline-offset-4 hover:underline"
              >
                {toast.link}
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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl glass p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none"
          />
        </div>
        <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as StatusFilter)}>
          <option value="all" className="bg-ink text-white">
            All statuses
          </option>
          <option value="active" className="bg-ink text-white">
            Active only
          </option>
          <option value="inactive" className="bg-ink text-white">
            Inactive only
          </option>
        </FilterSelect>
      </div>

      {/* Bulk action toolbar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gold/30 bg-gold/[0.06] px-4 py-3">
          <span className="text-sm font-semibold text-white">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setConfirm({ ids: [...selected], active: true })}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-gold/50"
            >
              <Power className="h-3.5 w-3.5 text-gold" />
              Mark active
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ ids: [...selected], active: false })}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
            >
              <Ban className="h-3.5 w-3.5" />
              Mark inactive
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <p className="px-1 text-xs text-white/45">
        Showing {slice.length} of {filtered.length}
        {filtered.length !== visitors.length && ` (filtered from ${visitors.length})`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} text="No users match your filters." />
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl glass">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-white/45">
                    <th className="px-5 py-4">
                      <Checkbox checked={allOnPageSelected} onChange={togglePage} label="Select all on page" />
                    </th>
                    <th className="px-5 py-4 font-semibold">Name</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Phone</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Registered</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((v) => (
                    <tr
                      key={v.id}
                      className="border-b border-white/[0.06] last:border-0 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-4">
                        <Checkbox
                          checked={selected.has(v.id)}
                          onChange={() => toggleOne(v.id)}
                          label={`Select ${v.name}`}
                        />
                      </td>
                      <td className="px-5 py-4 font-medium text-white">{v.name}</td>
                      <td className="px-5 py-4 text-white/75">{v.email}</td>
                      <td className="px-5 py-4 text-white/60">{v.phone || "—"}</td>
                      <td className="px-5 py-4">
                        <StatusBadge active={v.active} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-white/60">{v.registered}</td>
                      <td className="px-5 py-4">
                        <RowActions
                          user={v}
                          busy={busy}
                          onSetPassword={() => setPwUser(v)}
                          onSendReset={() => sendReset(v)}
                          onToggleActive={() => setConfirm({ ids: [v.id], active: !v.active })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Pagination
            page={current}
            totalPages={totalPages}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </>
      )}

      {confirm && (
        <ConfirmModal
          state={confirm}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => applyStatus(confirm.ids, confirm.active)}
        />
      )}
      {pwUser && (
        <SetPasswordModal
          user={pwUser}
          busy={busy}
          onCancel={() => setPwUser(null)}
          onSubmit={(pw) => setPassword(pwUser.id, pw)}
        />
      )}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        active
          ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
          : "border-white/15 bg-white/[0.04] text-white/50"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-white/40"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Checkbox({
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
      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
        checked ? "border-transparent bg-gold-gradient" : "border-white/30 hover:border-gold/50"
      }`}
    >
      {checked && <span className="h-2 w-2 rounded-sm bg-ink" />}
    </button>
  );
}

// Inline (always-visible) row actions — no dropdown to dig into.
function RowActions({
  user,
  busy,
  onSetPassword,
  onSendReset,
  onToggleActive,
}: {
  user: VisitorItem;
  busy: boolean;
  onSetPassword: () => void;
  onSendReset: () => void;
  onToggleActive: () => void;
}) {
  const iconBtn =
    "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-40";
  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/organiser/users/${user.id}`}
        title="View / edit profile"
        aria-label="View / edit profile"
        className={iconBtn}
      >
        <Eye className="h-4 w-4" />
      </Link>
      <button type="button" title="Set password" aria-label="Set password" className={iconBtn} disabled={busy} onClick={onSetPassword}>
        <KeyRound className="h-4 w-4" />
      </button>
      <button type="button" title="Send reset email" aria-label="Send reset email" className={iconBtn} disabled={busy} onClick={onSendReset}>
        <Mail className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={user.active ? "Mark inactive" : "Mark active"}
        aria-label={user.active ? "Mark inactive" : "Mark active"}
        disabled={busy}
        onClick={onToggleActive}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
          user.active
            ? "border-red-400/40 text-red-300 hover:bg-red-500/10"
            : "border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10"
        }`}
      >
        {user.active ? <Ban className="h-4 w-4" /> : <Power className="h-4 w-4" />}
      </button>
    </div>
  );
}

/* ── Modals ───────────────────────────────────────────────────────────── */

function ModalShell({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      onMouseDown={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-ink/95 shadow-glass"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-white/40 transition-colors hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({
  state,
  busy,
  onCancel,
  onConfirm,
}: {
  state: { ids: number[]; active: boolean };
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const n = state.ids.length;
  const noun = n === 1 ? "this user" : `these ${n} users`;
  const deactivating = !state.active;

  return (
    <ModalShell title={deactivating ? "Deactivate accounts" : "Activate accounts"} onCancel={onCancel}>
      <div className="flex gap-3">
        <span
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
            deactivating ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300"
          }`}
        >
          {deactivating ? <Ban className="h-5 w-5" /> : <Power className="h-5 w-5" />}
        </span>
        <p className="text-sm leading-relaxed text-white/75">
          {deactivating ? (
            <>
              Are you sure you want to mark <strong className="text-white">{noun}</strong> as
              inactive? They will be <strong className="text-white">unable to log in</strong> until
              reactivated.
            </>
          ) : (
            <>
              Mark <strong className="text-white">{noun}</strong> as active? They will be able to
              log in again.
            </>
          )}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/40 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
            deactivating
              ? "bg-red-500 text-white shadow-[0_8px_24px_-8px_rgba(239,68,68,0.6)]"
              : "bg-gold-gradient text-ink shadow-gold"
          }`}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {deactivating ? "Deactivate" : "Activate"}
        </button>
      </div>
    </ModalShell>
  );
}

function SetPasswordModal({
  user,
  busy,
  onCancel,
  onSubmit,
}: {
  user: VisitorItem;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (password: string) => Promise<{ ok?: boolean; error?: string } | void>;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setError("");
    const result = await onSubmit(password);
    if (result && "error" in result && result.error) setError(result.error);
  };

  const field =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40";

  return (
    <ModalShell title="Set a new password" onCancel={onCancel}>
      <p className="mb-4 text-sm text-white/60">
        Set a new password for <strong className="text-white">{user.name}</strong> ({user.email}).
        They can sign in with it immediately.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 characters)"
          className={field}
        />
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className={field}
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
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/40 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Set password
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ── Nominations ──────────────────────────────────────────────────────── */

type ColKey =
  | "nominee"
  | "nomineeEmail"
  | "nomineeMobile"
  | "business"
  | "location"
  | "sector"
  | "nominator"
  | "nominatorEmail"
  | "categories"
  | "type"
  | "howHeard"
  | "submitted";

const COLUMNS: { key: ColKey; label: string }[] = [
  { key: "nominee", label: "Nominee" },
  { key: "nomineeEmail", label: "Nominee email" },
  { key: "nomineeMobile", label: "Nominee mobile" },
  { key: "business", label: "Business" },
  { key: "location", label: "Location" },
  { key: "sector", label: "Sector" },
  { key: "nominator", label: "Nominator" },
  { key: "nominatorEmail", label: "Nominator email" },
  { key: "categories", label: "Categories" },
  { key: "type", label: "Type" },
  { key: "howHeard", label: "Heard via" },
  { key: "submitted", label: "Submitted" },
];

const DEFAULT_VISIBLE: ColKey[] = [
  "nominee",
  "nomineeEmail",
  "business",
  "categories",
  "type",
  "submitted",
];

const COLS_STORAGE_KEY = "sea_nom_columns_v1";
const PAGE_SIZES = [10, 25, 50];

type TypeFilter = "all" | "self" | "others";
type AnonFilter = "all" | "anon" | "named";

function NominationsManager({
  nominations,
}: {
  nominations: NominationItem[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [anonFilter, setAnonFilter] = useState<AnonFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [visible, setVisible] = useState<ColKey[]>(DEFAULT_VISIBLE);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const handleDelete = async () => {
    if (deleteId === null) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/organiser/nominations/${deleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ kind: "err", msg: data.error || "Could not delete nomination." });
        return;
      }
      setToast({ kind: "ok", msg: "Nomination deleted." });
      setDeleteId(null);
      router.refresh();
    } catch {
      setToast({ kind: "err", msg: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  };

  // Load + persist the organiser's column choices.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLS_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr))
          setVisible(arr.filter((k) => COLUMNS.some((c) => c.key === k)));
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(COLS_STORAGE_KEY, JSON.stringify(visible));
    } catch {
      /* ignore */
    }
  }, [visible]);

  // Unique categories across all nominations, for the category filter.
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    nominations.forEach((n) => n.categories.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [nominations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return nominations.filter((n) => {
      if (typeFilter === "self" && !n.selfNominate) return false;
      if (typeFilter === "others" && n.selfNominate) return false;
      if (anonFilter === "anon" && !n.anonymous) return false;
      if (anonFilter === "named" && n.anonymous) return false;
      if (categoryFilter && !n.categories.includes(categoryFilter))
        return false;
      if (q) {
        const hay = [
          n.nominee,
          n.nomineeEmail,
          n.nominator,
          n.nominatorEmail,
          n.businessName,
          n.businessLocation,
          n.businessCategory,
          ...n.categories,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [nominations, search, typeFilter, anonFilter, categoryFilter]);

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, anonFilter, categoryFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const slice = filtered.slice((current - 1) * pageSize, current * pageSize);

  const visibleCols = COLUMNS.filter((c) => visible.includes(c.key));

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            toast.kind === "ok"
              ? "border-gold/30 bg-gold/[0.06] text-white/85"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {toast.kind === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
          ) : (
            <Ban className="mt-0.5 h-4 w-4 flex-shrink-0" />
          )}
          <p className="flex-1">{toast.msg}</p>
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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl glass p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nominee, business, email…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none"
          />
        </div>

        <FilterSelect
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
        >
          <option value="all" className="bg-ink text-white">
            All nominations
          </option>
          <option value="self" className="bg-ink text-white">
            Self-nominations
          </option>
          <option value="others" className="bg-ink text-white">
            On behalf of others
          </option>
        </FilterSelect>

        <FilterSelect
          value={anonFilter}
          onChange={(v) => setAnonFilter(v as AnonFilter)}
        >
          <option value="all" className="bg-ink text-white">
            Anonymous &amp; named
          </option>
          <option value="anon" className="bg-ink text-white">
            Anonymous only
          </option>
          <option value="named" className="bg-ink text-white">
            Named only
          </option>
        </FilterSelect>

        <FilterSelect value={categoryFilter} onChange={setCategoryFilter}>
          <option value="" className="bg-ink text-white">
            All categories
          </option>
          {allCategories.map((c) => (
            <option key={c} value={c} className="bg-ink text-white">
              {c}
            </option>
          ))}
        </FilterSelect>

        <ColumnsMenu
          visible={visible}
          onToggle={(k) =>
            setVisible((v) =>
              v.includes(k) ? v.filter((x) => x !== k) : [...v, k],
            )
          }
        />
      </div>

      <p className="px-1 text-xs text-white/45">
        Showing {slice.length} of {filtered.length}
        {filtered.length !== nominations.length &&
          ` (filtered from ${nominations.length})`}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          text={
            nominations.length === 0
              ? "No nominations have been submitted yet."
              : "No nominations match your filters."
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl glass">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-[0.65rem] uppercase tracking-wider text-white/45">
                    {visibleCols.map((c) => (
                      <th key={c.key} className="px-5 py-4 font-semibold">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map((n) => (
                    <tr
                      key={n.id}
                      className="border-b border-white/[0.06] last:border-0 align-top transition-colors hover:bg-white/[0.02]"
                    >
                      {visibleCols.map((c) => (
                        <td key={c.key} className="px-5 py-4">
                          <Cell col={c.key} n={n} />
                        </td>
                      ))}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <ActionLink
                            href={`/organiser/nominations/${n.id}`}
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </ActionLink>
                          <ActionLink
                            href={`/organiser/nominations/${n.id}/edit`}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </ActionLink>
                          <button
                            type="button"
                            title="Delete"
                            aria-label="Delete nomination"
                            onClick={() => setDeleteId(n.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/40 text-red-300 transition-colors hover:bg-red-500/10"
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

          <Pagination
            page={current}
            totalPages={totalPages}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={setPageSize}
          />
        </>
      )}

      {deleteId !== null && (
        <ModalShell title="Delete nomination" onCancel={() => setDeleteId(null)}>
          <div className="flex gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-300">
              <Trash2 className="h-5 w-5" />
            </span>
            <p className="text-sm leading-relaxed text-white/75">
              Are you sure you want to permanently delete this nomination? This action{" "}
              <strong className="text-white">cannot be undone</strong>.
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteId(null)}
              disabled={busy}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/40 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(239,68,68,0.6)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function Cell({ col, n }: { col: ColKey; n: NominationItem }) {
  switch (col) {
    case "nominee":
      return <span className="font-medium text-white">{n.nominee}</span>;
    case "nomineeEmail":
      return <Muted v={n.nomineeEmail} />;
    case "nomineeMobile":
      return <Muted v={n.nomineeMobile} />;
    case "business":
      return <span className="text-white/75">{n.businessName || "—"}</span>;
    case "location":
      return <Muted v={n.businessLocation} />;
    case "sector":
      return <Muted v={n.businessCategory} />;
    case "nominator":
      return <span className="text-white/75">{n.nominator}</span>;
    case "nominatorEmail":
      return <Muted v={n.nominatorEmail} />;
    case "categories":
      return <CategoryPills categories={n.categories} />;
    case "type":
      return (
        <span className="flex flex-wrap gap-1.5">
          <MiniTag>{n.selfNominate ? "Self" : "For others"}</MiniTag>
          {n.anonymous && <MiniTag>Anonymous</MiniTag>}
        </span>
      );
    case "howHeard":
      return <Muted v={n.howHeard} />;
    case "submitted":
      return (
        <span className="whitespace-nowrap text-white/60">{n.submitted}</span>
      );
    default:
      return null;
  }
}

function Muted({ v }: { v: string | null }) {
  return <span className="text-white/60">{v || "—"}</span>;
}

export function CategoryPills({
  categories,
  max = 3,
}: {
  categories: string[];
  max?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!categories.length) return <span className="text-white/40">—</span>;

  const shown = expanded ? categories : categories.slice(0, max);
  const hidden = categories.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((c) => (
        <span
          key={c}
          className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs font-medium text-white"
        >
          <Sparkles className="h-3 w-3 text-gold" />
          {c}
        </span>
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full border border-white/15 px-2.5 py-1 text-xs font-semibold text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
        >
          +{hidden} more
        </button>
      )}
      {expanded && categories.length > max && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="rounded-full px-2 py-1 text-xs font-semibold text-gold hover:underline"
        >
          show less
        </button>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-3 pr-9 text-sm text-white focus:border-gold/50 focus:outline-none [&_option]:bg-ink [&_option]:text-white"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
    </div>
  );
}

function ColumnsMenu({
  visible,
  onToggle,
}: {
  visible: ColKey[];
  onToggle: (k: ColKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80 transition-colors hover:border-gold/40 hover:text-white"
      >
        <SlidersHorizontal className="h-4 w-4 text-gold" />
        Columns
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-white/10 bg-ink/95 p-2 shadow-glass backdrop-blur-md">
          {COLUMNS.map((c) => {
            const on = visible.includes(c.key);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onToggle(c.key)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition-colors hover:bg-white/[0.04]"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    on
                      ? "border-transparent bg-gold-gradient"
                      : "border-white/30"
                  }`}
                >
                  {on && <span className="h-1.5 w-1.5 rounded-sm bg-ink" />}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <div className="flex items-center gap-2 text-xs text-white/55">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-white focus:border-gold/50 focus:outline-none"
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
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-gold/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-gold/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={title}
      aria-label={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
    >
      {children}
    </Link>
  );
}

function MiniTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white/55">
      {children}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="rounded-3xl glass px-6 py-14 text-center">
      <Icon className="mx-auto h-6 w-6 text-white/30" />
      <p className="mt-3 text-sm text-white/55">{text}</p>
    </div>
  );
}
