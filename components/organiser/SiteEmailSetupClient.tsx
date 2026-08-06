'use client';

// This site's own mailbox — distinct from the platform-wide default above.
// Configuring this lets THIS site send email from its own domain (proper
// SPF/DKIM alignment) instead of riding the shared platform mailbox.

import { useState, useEffect } from 'react';
import { Save, Send, CheckCircle, XCircle, Loader2, Globe } from 'lucide-react';

type SiteSettings = {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_secure: boolean;
  email_from: string;
  email_reply_to: string;
  has_password: boolean;
  configured: boolean;
};

export function SiteEmailSetupClient() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState({
    smtp_host: '',
    smtp_port: 465,
    smtp_user: '',
    smtp_pass: '',
    smtp_secure: true,
    email_from: '',
    email_reply_to: '',
  });
  const [saving, setSaving]   = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo]   = useState('');
  const [msg, setMsg]         = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/organiser/site-email')
      .then(r => r.json())
      .then((d: SiteSettings) => {
        setSettings(d);
        setForm(f => ({
          ...f,
          smtp_host:      d.smtp_host      || '',
          smtp_port:      d.smtp_port      || 465,
          smtp_user:      d.smtp_user      || '',
          smtp_secure:    d.smtp_secure    ?? true,
          email_from:     d.email_from     || '',
          email_reply_to: d.email_reply_to || '',
        }));
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const body: Record<string, unknown> = { ...form };
      if (!form.smtp_pass) delete body.smtp_pass;
      const r = await fetch('/api/organiser/site-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (d.ok) {
        setMsg({ ok: true, text: 'This site’s mailbox has been saved.' });
        setSettings(s => s ? { ...s, ...form, has_password: !!form.smtp_pass || !!s.has_password, configured: !!form.smtp_host && !!form.smtp_user } : s);
        setForm(f => ({ ...f, smtp_pass: '' }));
      } else {
        setMsg({ ok: false, text: d.error ?? 'Save failed.' });
      }
    } catch (e) {
      setMsg({ ok: false, text: String(e) });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    if (!testTo) return;
    setTesting(true); setMsg(null);
    try {
      const siteRes = await fetch('/api/organiser/site-id').then(r => r.json()).catch(() => null);
      const r = await fetch('/api/organiser/email-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testTo, siteId: siteRes?.siteId }),
      });
      const d = await r.json();
      setMsg(d.ok
        ? { ok: true,  text: `Test email sent to ${testTo} via ${d.provider}` }
        : { ok: false, text: d.error ?? 'Test failed.' });
    } catch (e) {
      setMsg({ ok: false, text: String(e) });
    } finally {
      setTesting(false);
    }
  }

  const inp = 'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-gold/40 focus:outline-none';
  const lbl = 'block text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5';

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-3xl glass p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gold" />
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">This Site&apos;s Own Mailbox</h2>
          {settings && (
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
              settings.configured ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/8 text-white/40'
            }`}>
              {settings.configured ? 'Configured' : 'Using platform default'}
            </span>
          )}
        </div>
        <p className="text-xs text-white/40 -mt-2">
          Optional. When set, this site sends its own transactional and campaign emails from
          this mailbox instead of the shared platform mailbox above — so recipients see this
          site&apos;s own domain in the From: address.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={lbl}>SMTP Host</label>
            <input className={inp} placeholder="mail.yoursitedomain.com"
              value={form.smtp_host} onChange={e => setForm(f => ({ ...f, smtp_host: e.target.value }))} />
          </div>
          <div>
            <label className={lbl}>Port</label>
            <input className={inp} type="number" placeholder="465"
              value={form.smtp_port} onChange={e => setForm(f => ({ ...f, smtp_port: Number(e.target.value) }))} />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 cursor-pointer pb-2.5">
              <input type="checkbox" checked={form.smtp_secure}
                onChange={e => setForm(f => ({ ...f, smtp_secure: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 accent-gold" />
              <span className="text-sm text-white/60">SSL/Secure (port 465)</span>
            </label>
          </div>
          <div>
            <label className={lbl}>SMTP Username (email)</label>
            <input className={inp} placeholder="organiser@yoursitedomain.com"
              value={form.smtp_user} onChange={e => setForm(f => ({ ...f, smtp_user: e.target.value }))} />
          </div>
          <div>
            <label className={lbl}>Password {settings?.has_password && <span className="text-emerald-400 normal-case">(saved)</span>}</label>
            <input className={inp} type="password" placeholder={settings?.has_password ? '••••••• (leave blank to keep)' : 'Enter password'}
              value={form.smtp_pass} onChange={e => setForm(f => ({ ...f, smtp_pass: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={lbl}>From Address</label>
            <input className={inp} placeholder="Your Site Name <organiser@yoursitedomain.com>"
              value={form.email_from} onChange={e => setForm(f => ({ ...f, email_from: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className={lbl}>Reply-To (optional)</label>
            <input className={inp} placeholder="organiser@yoursitedomain.com"
              value={form.email_reply_to} onChange={e => setForm(f => ({ ...f, email_reply_to: e.target.value }))} />
          </div>
        </div>

        {msg && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${msg.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'}`}>
            {msg.ok ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <XCircle className="h-4 w-4 flex-shrink-0" />}
            {msg.text}
          </div>
        )}

        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gold-gradient px-6 py-2.5 text-sm font-semibold text-ink disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save This Site&apos;s Mailbox
        </button>
      </div>

      <div className="rounded-3xl glass p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">Send Test Email</h2>
        <div className="flex gap-3">
          <input className={`${inp} flex-1`} type="email" placeholder="your@email.com"
            value={testTo} onChange={e => setTestTo(e.target.value)} />
          <button onClick={sendTest} disabled={testing || !testTo}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-white/70 hover:border-gold/30 hover:text-white disabled:opacity-40 transition-colors">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Test
          </button>
        </div>
        <p className="text-xs text-white/30">
          Sends via whichever mailbox is active for this site right now — this site&apos;s own
          (if configured above) or the platform default.
        </p>
      </div>
    </div>
  );
}
