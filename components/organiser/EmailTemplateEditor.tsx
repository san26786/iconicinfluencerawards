'use client';

// Visual email designer. Build the email from stacked BLOCKS (heading, text,
// button, image, divider, spacer) with inline controls, reordering and a LIVE
// preview — or drop to a raw-HTML "Code" view for full control. Variables
// ({{firstName}} …) insert at the caret of the focused field and resolve
// per-recipient at send time. The block structure is saved alongside the
// rendered HTML so it can be re-edited later.

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowDown, ArrowUp, Blocks, CheckCircle2, Code2, Loader2, Plus, Save, Trash2,
} from 'lucide-react';
import { renderTemplate, TEMPLATE_VARIABLES, type TemplateVars } from '@/lib/email/template';
import { BLOCK_TYPES, defaultBlocks, newBlock, renderBlocks, type Block } from '@/lib/email/blocks';
import { ConfirmDialog } from '@/components/organiser/ConfirmDialog';

type Initial = {
  id?: number;
  name: string;
  subject: string;
  html: string;
  description: string;
  isSystem?: boolean;
  design?: Block[];
};

const SAMPLE: Record<string, string> = {
  firstName: 'Alex', lastName: 'Morgan', fullName: 'Alex Morgan',
  email: 'alex.morgan@example.com', company: 'Acme Ltd', phone: '+44 20 1234 5678',
};
const field =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

let uid = 0;
const makeId = () => `b${Date.now().toString(36)}${uid++}`;

export function EmailTemplateEditor({
  initial,
  brand,
}: {
  initial: Initial;
  brand: { siteName: string; siteUrl: string; year: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [subject, setSubject] = useState(initial.subject);
  const [blocks, setBlocks] = useState<Block[]>(initial.design?.length ? initial.design : defaultBlocks);
  const [rawHtml, setRawHtml] = useState(initial.html);
  const [mode, setMode] = useState<'design' | 'code'>(initial.design?.length ? 'design' : 'code');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Generic "last focused field" so the variable chips can insert anywhere.
  const active = useRef<{ el: HTMLInputElement | HTMLTextAreaElement; set: (v: string) => void } | null>(null);
  const reg = (set: (v: string) => void) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      active.current = { el: e.currentTarget, set };
    },
  });
  const dirty = () => setSaved(false);

  const sampleVars: TemplateVars = { ...SAMPLE, siteName: brand.siteName, siteUrl: brand.siteUrl, year: brand.year };
  const html = mode === 'design' ? renderBlocks(blocks) : rawHtml;
  const previewHtml = renderTemplate(html, sampleVars);
  const previewSubject = renderTemplate(subject, sampleVars);

  const insertVar = (key: string) => {
    const a = active.current;
    const token = `{{${key}}}`;
    if (!a) { setSubject((s) => s + token); dirty(); return; }
    const el = a.el;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    a.set(el.value.slice(0, start) + token + el.value.slice(end));
    dirty();
  };

  const patch = (id: string, p: Partial<Block>) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...p } as Block) : b)));
  const move = (i: number, dir: -1 | 1) =>
    setBlocks((bs) => {
      const j = i + dir;
      if (j < 0 || j >= bs.length) return bs;
      const next = [...bs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const remove = (id: string) => setBlocks((bs) => bs.filter((b) => b.id !== id));
  const add = (type: Block['type']) => setBlocks((bs) => [...bs, newBlock(type, makeId())]);

  const switchMode = (m: 'design' | 'code') => {
    if (m === mode) return;
    if (m === 'code') setRawHtml(renderBlocks(blocks)); // reflect current design as editable HTML
    setMode(m);
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const body = JSON.stringify({
        name, subject, description,
        html: mode === 'design' ? renderBlocks(blocks) : rawHtml,
        design: mode === 'design' ? blocks : null,
      });
      const res = initial.id
        ? await fetch(`/api/organiser/email-templates/${initial.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
        : await fetch('/api/organiser/email-templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Could not save the template.'); return; }
      setSaved(true);
      if (!initial.id && data.id) router.push(`/organiser/email-templates/${data.id}`);
      else router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!initial.id || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/organiser/email-templates/${initial.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/organiser/email-templates');
      else setError('Could not delete the template.');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => router.push('/organiser/email-templates')} className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-gold">
          <ArrowLeft className="h-4 w-4" /> All templates
        </button>
        <div className="flex items-center gap-2">
          {/* Design / Code toggle */}
          <div className="inline-flex rounded-full glass p-1">
            <ModeBtn active={mode === 'design'} onClick={() => switchMode('design')} icon={<Blocks className="h-3.5 w-3.5" />}>Design</ModeBtn>
            <ModeBtn active={mode === 'code'} onClick={() => switchMode('code')} icon={<Code2 className="h-3.5 w-3.5" />}>Code</ModeBtn>
          </div>
          {initial.id && !initial.isSystem && (
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-red-400/40 px-4 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          )}
          <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-ink shadow-gold disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </div>

      {saved && <p className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-3 text-sm text-white/85"><CheckCircle2 className="h-4 w-4 text-gold" /> Template saved.</p>}
      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete email template?"
        message={<>The template <strong className="text-white">{name}</strong> will be hidden from the organiser UI. Its database record will be retained.</>}
        busy={busy}
        onConfirm={del}
        onCancel={() => setConfirmDelete(false)}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Editor column */}
        <div className="space-y-4 rounded-3xl glass p-5 sm:p-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Template name</span>
            <input className={field} value={name} onChange={(e) => { setName(e.target.value); dirty(); }} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Description (internal)</span>
            <input className={field} value={description} onChange={(e) => { setDescription(e.target.value); dirty(); }} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Subject</span>
            <input className={field} value={subject} onChange={(e) => { setSubject(e.target.value); dirty(); }} {...reg(setSubject)} />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">Insert variable</span>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button key={v.key} type="button" onClick={() => insertVar(v.key)} title={`Insert {{${v.key}}}`} className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/75 transition-colors hover:border-gold/50 hover:text-gold">
                  {v.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[0.7rem] text-white/40">CSV-imported columns also work as <code className="text-white/60">{'{{column}}'}</code> variables. Inserts into the last field you clicked.</p>
          </div>

          {mode === 'design' ? (
            <div className="space-y-3">
              <span className="block text-xs font-semibold uppercase tracking-wider text-white/55">Blocks</span>
              {blocks.map((b, i) => (
                <BlockCard key={b.id} block={b} index={i} count={blocks.length} reg={reg} patch={patch} move={move} remove={remove} dirty={dirty} />
              ))}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {BLOCK_TYPES.map((t) => (
                  <button key={t.type} type="button" onClick={() => { add(t.type); dirty(); }} className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/75 transition-colors hover:border-gold/50 hover:text-gold">
                    <Plus className="h-3.5 w-3.5" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55">HTML body</span>
              <textarea rows={18} className={`${field} font-mono text-xs leading-relaxed`} value={rawHtml} onChange={(e) => { setRawHtml(e.target.value); dirty(); }} {...reg(setRawHtml)} />
            </label>
          )}
        </div>

        {/* Live preview */}
        <div className="space-y-3 rounded-3xl glass p-5 sm:p-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/55">Live preview</span>
            <p className="mt-1 text-sm text-white/80"><span className="text-white/45">Subject:</span> {previewSubject}</p>
          </div>
          <iframe title="Template preview" srcDoc={previewHtml} className="h-[560px] w-full rounded-xl border border-white/10 bg-white" />
        </div>
      </div>
    </div>
  );
}

function ModeBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${active ? 'bg-gold-gradient text-ink' : 'text-white/70 hover:text-white'}`}>
      {icon} {children}
    </button>
  );
}

function BlockCard({
  block: b, index: i, count, reg, patch, move, remove, dirty,
}: {
  block: Block;
  index: number;
  count: number;
  reg: (set: (v: string) => void) => { onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void };
  patch: (id: string, p: Partial<Block>) => void;
  move: (i: number, dir: -1 | 1) => void;
  remove: (id: string) => void;
  dirty: () => void;
}) {
  const f = 'w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-gold/50 focus:outline-none';
  const upd = (p: Partial<Block>) => { patch(b.id, p); dirty(); };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-gold">{b.type}</span>
        <div className="flex items-center gap-1">
          <IconBtn label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn label="Move down" onClick={() => move(i, 1)} disabled={i === count - 1}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
          <IconBtn label="Delete block" onClick={() => { remove(b.id); dirty(); }} danger><Trash2 className="h-3.5 w-3.5" /></IconBtn>
        </div>
      </div>

      {(b.type === 'heading' || b.type === 'text') && (
        <div className="space-y-2">
          <textarea rows={b.type === 'text' ? 3 : 2} className={f} value={b.text} onChange={(e) => upd({ text: e.target.value })} {...reg((v) => upd({ text: v }))} />
          <AlignSelect value={b.align || 'left'} onChange={(a) => upd({ align: a })} />
        </div>
      )}
      {b.type === 'button' && (
        <div className="space-y-2">
          <input className={f} placeholder="Button label" value={b.label} onChange={(e) => upd({ label: e.target.value })} {...reg((v) => upd({ label: v }))} />
          <input className={f} placeholder="Link URL" value={b.url} onChange={(e) => upd({ url: e.target.value })} {...reg((v) => upd({ url: v }))} />
          <AlignSelect value={b.align || 'left'} onChange={(a) => upd({ align: a })} />
        </div>
      )}
      {b.type === 'image' && (
        <div className="space-y-2">
          <input className={f} placeholder="Image URL (https://…)" value={b.url} onChange={(e) => upd({ url: e.target.value })} {...reg((v) => upd({ url: v }))} />
          <div className="grid grid-cols-2 gap-2">
            <input className={f} placeholder="Alt text" value={b.alt || ''} onChange={(e) => upd({ alt: e.target.value })} {...reg((v) => upd({ alt: v }))} />
            <input type="number" className={f} placeholder="Width (px)" value={b.width || 560} onChange={(e) => upd({ width: Number(e.target.value) })} />
          </div>
        </div>
      )}
      {b.type === 'spacer' && (
        <input type="number" className={f} placeholder="Height (px)" value={b.height || 24} onChange={(e) => upd({ height: Number(e.target.value) })} />
      )}
      {b.type === 'divider' && <p className="text-xs text-white/40">A horizontal divider line.</p>}
    </div>
  );
}

function AlignSelect({ value, onChange }: { value: 'left' | 'center'; onChange: (a: 'left' | 'center') => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as 'left' | 'center')} className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-xs text-white focus:border-gold/50 focus:outline-none [&_option]:bg-ink">
      <option value="left">Align left</option>
      <option value="center">Align center</option>
    </select>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} disabled={disabled}
      className={`inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 transition-colors disabled:opacity-30 ${danger ? 'text-red-300 hover:bg-red-500/10' : 'text-white/60 hover:border-gold/40 hover:text-gold'}`}>
      {children}
    </button>
  );
}
