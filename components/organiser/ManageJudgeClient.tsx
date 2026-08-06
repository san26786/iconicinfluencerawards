'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Loader2, Linkedin, Phone, Briefcase, Award,
  ChevronDownIcon, Trash2, Users, RotateCcw, Send,
} from 'lucide-react';

type Judge = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  expertise: string | null;
  bio: string | null;
  linkedin: string | null;
  status: string;
  appliedAt: string;
  approvedAt: string | null;
};

function StatusTabs({ active }: { active: string }) {
  const tabs = [
    { value: 'pending',  label: 'Pending'  },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];
  return (
    <div className="mt-6 flex gap-2">
      {tabs.map((t) => (
        <Link
          key={t.value}
          href={`/organiser/manage-judge?status=${t.value}`}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            active === t.value
              ? 'bg-gold-gradient text-ink shadow-gold-sm'
              : 'glass text-white/75 hover:border-gold/40 hover:text-white'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

function ActionMenu({ judge, onAction, onDelete }: {
  judge: Judge;
  onAction: (id: number, action: 'approve' | 'reject' | 'pending' | 'resend') => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open,  setOpen]  = useState(false);
  const [busy,  setBusy]  = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function run(action: 'approve' | 'reject' | 'pending' | 'resend') {
    setBusy(action); setOpen(false);
    await onAction(judge.id, action);
    setBusy(null);
  }

  async function handleDelete() {
    if (!confirm(`Delete ${judge.name}'s application? This cannot be undone.`)) return;
    setBusy('delete'); setOpen(false);
    await onDelete(judge.id);
    setBusy(null);
  }

  const items = [
    judge.status !== 'approved' && {
      label: 'Approve',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />,
      onClick: () => run('approve'),
      className: 'text-green-300 hover:bg-green-500/10',
    },
    judge.status !== 'rejected' && {
      label: judge.status === 'approved' ? 'Mark as Rejected' : 'Reject',
      icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
      onClick: () => run('reject'),
      className: 'text-red-300 hover:bg-red-500/10',
    },
    judge.status === 'approved' && {
      label: 'Resend Credentials',
      icon: <Send className="h-3.5 w-3.5 text-blue-400" />,
      onClick: () => run('resend'),
      className: 'text-blue-300 hover:bg-blue-500/10',
    },
    judge.status === 'approved' && {
      label: 'Mark as Pending',
      icon: <RotateCcw className="h-3.5 w-3.5 text-white/50" />,
      onClick: () => run('pending'),
      className: 'text-white/60 hover:bg-white/5',
    },
    judge.linkedin && {
      label: 'View LinkedIn Profile',
      icon: <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />,
      href: judge.linkedin,
      className: 'text-white/70 hover:bg-white/5',
    },
    {
      label: 'Allocate Applicants',
      icon: <Users className="h-3.5 w-3.5 text-gold/70" />,
      href: `/organiser/manage-judge/${judge.id}/allocate`,
      className: 'text-white/70 hover:bg-white/5',
    },
    { divider: true },
    {
      label: 'Delete Application',
      icon: <Trash2 className="h-3.5 w-3.5 text-red-400" />,
      onClick: handleDelete,
      className: 'text-red-300 hover:bg-red-500/10',
    },
  ].filter(Boolean) as (
    | { label: string; icon: React.ReactNode; onClick?: () => void; href?: string; className: string; divider?: undefined }
    | { divider: true }
  )[];

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!!busy}
        className="inline-flex items-center gap-1.5 rounded-full bg-gold-gradient px-3 py-1.5 text-xs font-bold text-ink shadow-gold transition-all hover:-translate-y-0.5 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
        ACTION
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0b14] shadow-2xl">
          {items.map((item, i) => {
            if ('divider' in item && item.divider) {
              return <div key={i} className="my-1 border-t border-white/8" />;
            }
            const cls = `flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-semibold transition-colors ${item.className}`;
            if (item.href) {
              return (
                <a key={i} href={item.href} target="_blank" rel="noopener noreferrer" className={cls} onClick={() => setOpen(false)}>
                  {item.icon} {item.label}
                </a>
              );
            }
            return (
              <button key={i} onClick={item.onClick} className={cls}>
                {item.icon} {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JudgeRow({ judge, onAction, onDelete }: {
  judge: Judge;
  onAction: (id: number, action: 'approve' | 'reject' | 'pending' | 'resend') => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [gone,     setGone]     = useState(false);
  const [doneMsg,  setDoneMsg]  = useState('');

  async function handleAction(id: number, action: 'approve' | 'reject' | 'pending' | 'resend') {
    await onAction(id, action);
    const msg =
      action === 'approve' ? `${judge.name} approved — login credentials sent.` :
      action === 'resend'  ? `Credentials resent to ${judge.name}.` :
      action === 'pending' ? `${judge.name} moved back to pending.` :
      `${judge.name} application rejected.`;
    setDoneMsg(msg);
    if (action !== 'resend') setGone(true);
  }

  async function handleDelete(id: number) {
    await onDelete(id);
    setGone(true);
    setDoneMsg(`${judge.name} deleted.`);
  }

  if (gone) {
    return (
      <div className="flex items-center gap-3 rounded-2xl glass px-5 py-4 text-sm text-white/60">
        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-white/30" />
        {doneMsg}
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass">
      <div className="flex flex-wrap items-start gap-4 px-5 py-4">
        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-white">{judge.name}</p>
            <span className={`rounded-full px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide ${
              judge.status === 'approved' ? 'bg-green-500/15 text-green-300'
              : judge.status === 'rejected' ? 'bg-red-500/15 text-red-300'
              : 'bg-white/8 text-white/50'
            }`}>
              {judge.status}
            </span>
          </div>
          <p className="text-sm text-white/55">{judge.email}</p>
          {judge.company && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/45">
              <Briefcase className="h-3 w-3" />
              {judge.jobTitle ? `${judge.jobTitle}, ` : ''}{judge.company}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <ActionMenu judge={judge} onAction={handleAction} onDelete={handleDelete} />
          <button
            onClick={() => setExpanded((e) => !e)}
            className="rounded-full p-1.5 text-white/40 transition-colors hover:text-white"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/5 px-5 py-4 space-y-3">
          {judge.expertise && (
            <div className="flex items-start gap-2 text-sm">
              <Award className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
              <span className="text-white/75"><strong className="text-white/90">Expertise:</strong> {judge.expertise}</span>
            </div>
          )}
          {judge.phone && (
            <div className="flex items-center gap-2 text-sm text-white/75">
              <Phone className="h-4 w-4 flex-shrink-0 text-white/35" />
              {judge.phone}
            </div>
          )}
          {judge.linkedin && (
            <div className="flex items-center gap-2 text-sm">
              <Linkedin className="h-4 w-4 flex-shrink-0 text-white/35" />
              <a href={judge.linkedin} target="_blank" rel="noopener noreferrer" className="text-gold/80 hover:text-gold truncate">
                {judge.linkedin}
              </a>
            </div>
          )}
          {judge.bio && (
            <div className="text-sm text-white/65 whitespace-pre-line leading-relaxed border-t border-white/5 pt-3">
              {judge.bio}
            </div>
          )}
          <p className="text-xs text-white/30">Applied {judge.appliedAt}</p>
        </div>
      )}
    </div>
  );
}

export function ManageJudgeClient({ judges: initial, activeStatus }: { judges: Judge[]; activeStatus: string }) {
  const [judges, setJudges] = useState(initial);

  async function handleAction(id: number, action: 'approve' | 'reject' | 'pending' | 'resend') {
    await fetch(`/api/organiser/judges/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
  }

  async function handleDelete(id: number) {
    await fetch(`/api/organiser/judges/${id}`, { method: 'DELETE' });
    setJudges((js) => js.filter((j) => j.id !== id));
  }

  return (
    <div>
      <StatusTabs active={activeStatus} />
      <div className="mt-6 space-y-3">
        {judges.length === 0 ? (
          <p className="py-8 text-center text-sm text-white/35">No {activeStatus} applications.</p>
        ) : (
          judges.map((j) => (
            <JudgeRow key={j.id} judge={j} onAction={handleAction} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
