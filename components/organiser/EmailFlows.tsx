"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Save,
  Trash2,
  Users,
  Workflow,
} from "lucide-react";
import { ConfirmDialog } from "@/components/organiser/ConfirmDialog";

export type FlowTemplate = { id: number; name: string };

export type FlowStats = {
  runs: number;
  activeRuns: number;
  sent: number;
  total: number;
};

export type FlowStep = {
  id?: number;
  position: number;
  name: string;
  templateId: number | null;
  delayMinutes: number;
  delayFrom: "initial" | "previous";
  audience?: {
    engagement?: string;
    potentialUsers?: {
      search?: string;
      title?: string;
      position?: string;
      gender?: string;
      company?: string;
      source?: string;
      noCategories?: boolean;
    };
    skipAlreadyReminded?: boolean;
    skipNominated?: boolean;
  };
  enabled: boolean;
};

export type FlowEditorFlow = {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  respectSendWindow: boolean;
  steps: FlowStep[];
};

const field =
  "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none [&_option]:bg-ink";

const engagementOptions = [
  ["opened_or_clicked", "Opened or clicked"],
  ["clicked", "Clicked"],
  ["opened", "Opened"],
  ["not_opened", "Not opened"],
  ["any", "Any sent recipient"],
];

const emptyStep = (position: number, templateId: number | null): FlowStep => ({
  position,
  name: `Step ${position}`,
  templateId,
  delayMinutes: 240,
  delayFrom: position === 1 ? "initial" : "previous",
  audience: {
    engagement: "opened_or_clicked",
    potentialUsers: {},
    skipAlreadyReminded: true,
    skipNominated: true,
  },
  // Steps are created disabled — the organiser enables each one deliberately.
  enabled: false,
});

// Minutes → a short readable duration, e.g. 240 → "4h", 1440 → "1d", 1500 → "1d 1h".
function humanDelay(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const r = m % 60;
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (r || parts.length === 0) parts.push(`${r}m`);
  return parts.join(" ");
}

function normalize(flow: FlowEditorFlow): FlowEditorFlow {
  return {
    ...flow,
    respectSendWindow: flow.respectSendWindow !== false,
    steps: flow.steps.map((s, i) => ({
      ...s,
      position: i + 1,
      templateId: s.templateId == null ? null : Number(s.templateId),
      delayFrom: s.delayFrom === "previous" ? "previous" : "initial",
      audience: {
        engagement: s.audience?.engagement ?? "opened_or_clicked",
        potentialUsers: s.audience?.potentialUsers ?? {},
        skipAlreadyReminded: s.audience?.skipAlreadyReminded ?? false,
        skipNominated: s.audience?.skipNominated ?? false,
      },
    })),
  };
}

export function EmailFlows({
  flows,
  templates,
  stats = {},
  initialCounts = {},
}: {
  flows: FlowEditorFlow[];
  templates: FlowTemplate[];
  stats?: Record<number, FlowStats>;
  initialCounts?: Record<number, Record<number, number>>;
}) {
  const router = useRouter();
  const [items, setItems] = useState(flows.map(normalize));
  const [busy, setBusy] = useState<number | "new" | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FlowEditorFlow | null>(null);
  // Match counts keyed [flowId][stepPosition]; seeded from the server, then
  // refreshed from each save's response.
  const [counts, setCounts] = useState<Record<number, Record<number, number>>>(initialCounts);
  const firstTemplateId = templates[0]?.id ?? null;

  const updateFlow = (id: number, patch: Partial<FlowEditorFlow>) =>
    setItems((all) => all.map((f) => (f.id === id ? normalize({ ...f, ...patch }) : f)));

  const updateStep = (flowId: number, index: number, patch: Partial<FlowStep>) =>
    setItems((all) =>
      all.map((f) => {
        if (f.id !== flowId) return f;
        const steps = f.steps.map((s, i) => (i === index ? { ...s, ...patch } : s));
        return normalize({ ...f, steps });
      }),
    );

  const updatePu = (
    flowId: number,
    index: number,
    patch: NonNullable<FlowStep["audience"]>["potentialUsers"],
  ) =>
    setItems((all) =>
      all.map((f) => {
        if (f.id !== flowId) return f;
        const steps = f.steps.map((s, i) =>
          i === index
            ? {
                ...s,
                audience: {
                  ...(s.audience ?? {}),
                  potentialUsers: { ...(s.audience?.potentialUsers ?? {}), ...patch },
                },
              }
            : s,
        );
        return normalize({ ...f, steps });
      }),
    );

  const createFlow = async () => {
    setBusy("new");
    setToast(null);
    try {
      const res = await fetch("/api/organiser/email-flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New reminder flow", enabled: false }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ ok: false, msg: data.error || "Could not create flow." });
        return;
      }
      const flow: FlowEditorFlow = normalize({
        id: data.id,
        name: "New reminder flow",
        description: "",
        enabled: false,
        respectSendWindow: true,
        steps: [emptyStep(1, firstTemplateId)],
      });
      setItems((all) => [flow, ...all]);
      setToast({ ok: true, msg: "Flow created. Add a template, then save it." });
    } finally {
      setBusy(null);
    }
  };

  const saveFlow = async (flow: FlowEditorFlow) => {
    setBusy(flow.id);
    setToast(null);
    try {
      const res = await fetch(`/api/organiser/email-flows/${flow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalize(flow)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ ok: false, msg: data.error || "Could not save flow." });
        return;
      }
      // Refresh this flow's per-step match counts from the save response.
      if (Array.isArray(data.counts)) {
        const next: Record<number, number> = {};
        for (const c of data.counts as { position: number; matchCount: number }[]) {
          next[c.position] = c.matchCount;
        }
        setCounts((all) => ({ ...all, [flow.id]: next }));
      }
      setToast({ ok: true, msg: "Flow saved." });
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const deleteFlow = async (id: number) => {
    setBusy(id);
    setToast(null);
    try {
      const res = await fetch(`/api/organiser/email-flows/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setToast({ ok: false, msg: "Could not delete flow." });
        return;
      }
      setItems((all) => all.filter((f) => f.id !== id));
      setToast({ ok: true, msg: "Flow deleted." });
    } finally {
      setBusy(null);
      setPendingDelete(null);
    }
  };

  return (
    <div className="mt-8 space-y-5">
      {toast && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            toast.ok
              ? "border-gold/30 bg-gold/[0.06] text-white/85"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {toast.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-gold" /> : null}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={createFlow}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-60"
        >
          {busy === "new" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          New flow
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl glass px-6 py-14 text-center">
          <Workflow className="mx-auto h-7 w-7 text-white/30" />
          <p className="mt-3 text-sm text-white/55">No reminder flows yet.</p>
        </div>
      ) : (
        items.map((flow) => (
          <FlowCard
            key={flow.id}
            flow={flow}
            templates={templates}
            busy={busy === flow.id}
            stats={stats[flow.id]}
            counts={counts[flow.id] ?? {}}
            onPatch={(patch) => updateFlow(flow.id, patch)}
            onStep={(index, patch) => updateStep(flow.id, index, patch)}
            onPu={(index, patch) => updatePu(flow.id, index, patch)}
            onAddStep={() =>
              updateFlow(flow.id, {
                steps: [...flow.steps, emptyStep(flow.steps.length + 1, firstTemplateId)],
              })
            }
            onRemoveStep={(index) =>
              updateFlow(flow.id, {
                steps: flow.steps.filter((_, i) => i !== index),
              })
            }
            onMoveStep={(index, dir) => {
              const next = [...flow.steps];
              const to = index + dir;
              if (to < 0 || to >= next.length) return;
              [next[index], next[to]] = [next[to], next[index]];
              updateFlow(flow.id, { steps: next });
            }}
            onSave={() => saveFlow(flow)}
            onDelete={() => setPendingDelete(flow)}
          />
        ))
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete email flow?"
        message={<>The flow <strong className="text-white">{pendingDelete?.name}</strong> will be hidden from the organiser UI. Existing campaign records will remain in the database.</>}
        busy={pendingDelete !== null && busy === pendingDelete.id}
        onConfirm={() => pendingDelete && deleteFlow(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function FlowCard({
  flow,
  templates,
  busy,
  stats,
  counts,
  onPatch,
  onStep,
  onPu,
  onAddStep,
  onRemoveStep,
  onMoveStep,
  onSave,
  onDelete,
}: {
  flow: FlowEditorFlow;
  templates: FlowTemplate[];
  busy: boolean;
  stats?: FlowStats;
  counts: Record<number, number>;
  onPatch: (patch: Partial<FlowEditorFlow>) => void;
  onStep: (index: number, patch: Partial<FlowStep>) => void;
  onPu: (index: number, patch: NonNullable<FlowStep["audience"]>["potentialUsers"]) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onMoveStep: (index: number, dir: -1 | 1) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <section className="rounded-3xl glass p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid min-w-[260px] flex-1 gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
              Flow name
            </span>
            <input className={field} value={flow.name} onChange={(e) => onPatch({ name: e.target.value })} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
              Description
            </span>
            <input
              className={field}
              value={flow.description}
              onChange={(e) => onPatch({ description: e.target.value })}
            />
          </label>
        </div>
        <label className="mt-7 flex items-center gap-2 text-sm font-semibold text-white/75">
          <input
            type="checkbox"
            checked={flow.enabled}
            onChange={(e) => onPatch({ enabled: e.target.checked })}
            className="h-4 w-4 accent-[#caa24a]"
          />
          Flow available
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-white/75">
        <input
          type="checkbox"
          checked={flow.respectSendWindow}
          onChange={(e) => onPatch({ respectSendWindow: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-[#caa24a]"
        />
        <span>
          <span className="flex items-center gap-1.5 font-semibold">
            <Clock className="h-3.5 w-3.5 text-gold" /> Only send during office hours
          </span>
          <span className="mt-0.5 block text-xs text-white/45">
            Confine this flow&apos;s reminders to the daily send window set in Send Queue settings, even if 24/7 sending is on.
          </span>
        </span>
      </label>

      {stats && stats.runs > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/65">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <Workflow className="h-3.5 w-3.5 text-gold" />
            {stats.runs} campaign{stats.runs === 1 ? "" : "s"} attached
            {stats.activeRuns > 0 ? ` · ${stats.activeRuns} active` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-gold" />
            {stats.sent.toLocaleString()} / {stats.total.toLocaleString()} reminder emails sent
          </span>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {flow.steps.map((step, index) => (
          <StepCard
            key={step.id ?? `new-${index}`}
            step={step}
            index={index}
            count={flow.steps.length}
            matchCount={counts[index + 1]}
            templates={templates}
            onPatch={(patch) => onStep(index, patch)}
            onPu={(patch) => onPu(index, patch)}
            onRemove={() => onRemoveStep(index)}
            onMove={(dir) => onMoveStep(index, dir)}
          />
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
        <button
          type="button"
          onClick={onAddStep}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:border-gold/40 hover:text-white"
        >
          <Plus className="h-4 w-4 text-gold" /> Add step
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold text-ink shadow-gold disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save flow
          </button>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  count,
  matchCount,
  templates,
  onPatch,
  onPu,
  onRemove,
  onMove,
}: {
  step: FlowStep;
  index: number;
  count: number;
  matchCount?: number;
  templates: FlowTemplate[];
  onPatch: (patch: Partial<FlowStep>) => void;
  onPu: (patch: NonNullable<FlowStep["audience"]>["potentialUsers"]) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const pu = step.audience?.potentialUsers ?? {};
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-sm font-bold text-ink">
            {index + 1}
          </span>
          <input
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white focus:border-gold/50 focus:outline-none"
            value={step.name}
            onChange={(e) => onPatch({ name: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn label="Remove step" danger onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Labeled label="Template">
          <select
            className={field}
            value={step.templateId ?? ""}
            onChange={(e) => onPatch({ templateId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Choose template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Labeled>
        <Labeled label={`Delay minutes (= ${humanDelay(step.delayMinutes)})`}>
          <input
            type="number"
            min={1}
            max={43200}
            className={field}
            value={step.delayMinutes}
            onChange={(e) => onPatch({ delayMinutes: Number(e.target.value) })}
          />
          <span className="mt-1 block text-[0.65rem] text-white/40">
            e.g. 240 = 4h, 1440 = 24h. Max 43200 (30 days).
          </span>
        </Labeled>
        <Labeled label="Delay from">
          <select
            className={field}
            value={step.delayFrom}
            onChange={(e) => onPatch({ delayFrom: e.target.value as FlowStep["delayFrom"] })}
          >
            <option value="initial">Initial campaign</option>
            <option value="previous">Previous reminder</option>
          </select>
        </Labeled>
        <Labeled label="Engagement">
          <select
            className={field}
            value={step.audience?.engagement ?? "opened_or_clicked"}
            onChange={(e) =>
              onPatch({ audience: { ...(step.audience ?? {}), engagement: e.target.value } })
            }
          >
            {engagementOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Labeled>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/55">
            Potential User filters
          </p>
          {matchCount !== undefined && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1 text-xs font-semibold text-white/80"
              title="Potential users matching these attribute filters. The live audience also narrows by engagement and the per-recipient delay against the source campaign."
            >
              <Users className="h-3.5 w-3.5 text-gold" />
              ≈ {matchCount.toLocaleString()} match these filters
            </span>
          )}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MiniInput label="Search" value={pu.search} onChange={(search) => onPu({ search })} />
          <MiniInput label="Title" value={pu.title} onChange={(title) => onPu({ title })} />
          <MiniInput label="Position" value={pu.position} onChange={(position) => onPu({ position })} />
          <MiniInput label="Gender" value={pu.gender} onChange={(gender) => onPu({ gender })} />
          <MiniInput label="Company" value={pu.company} onChange={(company) => onPu({ company })} />
          <MiniInput label="Source" value={pu.source} onChange={(source) => onPu({ source })} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-white/75">
          <input
            type="checkbox"
            checked={!!pu.noCategories}
            onChange={(e) => onPu({ noCategories: e.target.checked })}
            className="h-4 w-4 accent-[#caa24a]"
          />
          Without assigned categories only
        </label>
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/55">
          Safety checks
        </p>
        <div className="mt-3 space-y-2.5">
          <label className="flex items-start gap-2 text-sm text-white/75">
            <input
              type="checkbox"
              checked={step.audience?.skipAlreadyReminded ?? false}
              onChange={(e) =>
                onPatch({ audience: { ...(step.audience ?? {}), skipAlreadyReminded: e.target.checked } })
              }
              className="mt-0.5 h-4 w-4 accent-[#caa24a]"
            />
            <span>
              Don&apos;t send if a reminder was already sent to this address
              <span className="mt-0.5 block text-xs text-white/45">
                Skips anyone who already received (or is queued for) a reminder in this flow — no double reminders.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-white/75">
            <input
              type="checkbox"
              checked={step.audience?.skipNominated ?? false}
              onChange={(e) =>
                onPatch({ audience: { ...(step.audience ?? {}), skipNominated: e.target.checked } })
              }
              className="mt-0.5 h-4 w-4 accent-[#caa24a]"
            />
            <span>
              Don&apos;t send if they&apos;ve already submitted a nomination
              <span className="mt-0.5 block text-xs text-white/45">
                Skips any address already named on a nomination (as nominee or nominator).
              </span>
            </span>
          </label>
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-white/75">
        <input
          type="checkbox"
          checked={step.enabled}
          onChange={(e) => onPatch({ enabled: e.target.checked })}
          className="h-4 w-4 accent-[#caa24a]"
        />
        Step enabled
      </label>
    </article>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function MiniInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label>
      <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-wider text-white/45">
        {label}
      </span>
      <input
        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function IconBtn({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 transition-colors disabled:opacity-30 ${
        danger
          ? "text-red-300 hover:bg-red-500/10"
          : "text-white/60 hover:border-gold/40 hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}
