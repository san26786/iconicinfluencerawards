'use client';

// Client-side auth forms (login / visitor registration / forgot / reset) plus
// a small LogoutButton. All post to the /api/auth/* routes and route the user
// based on the JSON response. Styling mirrors components/RegisterForm.tsx.

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, LogOut } from 'lucide-react';

const inputBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/50 focus:outline-none focus:ring-1 focus:ring-gold/40';

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function Submit({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-3.5 text-sm font-semibold text-ink shadow-gold transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
    >
      {loading ? 'Please wait…' : children}
      {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
    </button>
  );
}

function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </p>
  );
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  return { res, data };
}

/* ── Login ────────────────────────────────────────────────────────────── */

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { res, data } = await postJson('/api/auth/login', { email, password });
      if (!res.ok) {
        setError((data.error as string) || 'Could not sign you in.');
        return;
      }
      const role = (data.user as { role?: string } | undefined)?.role;
      router.push(role === 'organiser' ? '/organiser' : role === 'judge' ? '/judge' : '/account');
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Email" htmlFor="email">
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputBase}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputBase}
        />
      </Field>
      <ErrorNote message={error} />
      <Submit loading={loading}>Sign in</Submit>
    </form>
  );
}

/* ── Visitor registration ─────────────────────────────────────────────── */

export function VisitorRegisterForm() {
  const router = useRouter();
  const [f, setF] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!f.firstName.trim() || !f.lastName.trim()) return setError('Please enter your first and last name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setError('Please enter a valid email address.');
    if (f.password.length < 8) return setError('Password must be at least 8 characters.');
    if (f.password !== f.confirm) return setError('Passwords do not match.');

    setError('');
    setLoading(true);
    try {
      const { res, data } = await postJson('/api/auth/register', {
        firstName: f.firstName,
        lastName: f.lastName,
        email: f.email,
        phone: f.phone,
        password: f.password,
      });
      if (!res.ok) {
        setError((data.error as string) || 'Could not create your account.');
        return;
      }
      router.push('/account');
      router.refresh();
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName">
          <input id="firstName" type="text" value={f.firstName} onChange={set('firstName')} className={inputBase} />
        </Field>
        <Field label="Last name" htmlFor="lastName">
          <input id="lastName" type="text" value={f.lastName} onChange={set('lastName')} className={inputBase} />
        </Field>
      </div>
      <Field label="Email" htmlFor="email">
        <input id="email" type="email" autoComplete="email" value={f.email} onChange={set('email')} className={inputBase} />
      </Field>
      <Field label="Phone (optional)" htmlFor="phone">
        <input id="phone" type="tel" value={f.phone} onChange={set('phone')} className={inputBase} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" htmlFor="password">
          <input id="password" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} className={inputBase} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm">
          <input id="confirm" type="password" autoComplete="new-password" value={f.confirm} onChange={set('confirm')} className={inputBase} />
        </Field>
      </div>
      <ErrorNote message={error} />
      <Submit loading={loading}>Create account</Submit>
    </form>
  );
}

/* ── Forgot password ──────────────────────────────────────────────────── */

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ message: string; resetUrl?: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { res, data } = await postJson('/api/auth/forgot-password', { email });
      if (!res.ok) {
        setError((data.error as string) || 'Something went wrong.');
        return;
      }
      setDone({ message: data.message as string, resetUrl: data.resetUrl as string | undefined });
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/[0.06] px-4 py-3 text-sm text-white/80">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
          {done.message}
        </p>
        {/* Dev-only: email delivery is parked, so the link is shown here for testing. */}
        {done.resetUrl && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/70">
            <p className="mb-1 font-semibold uppercase tracking-wider text-white/45">Reset link (dev only)</p>
            <a href={done.resetUrl} className="break-all text-gold underline-offset-4 hover:underline">
              {done.resetUrl}
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Email" htmlFor="email">
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputBase}
        />
      </Field>
      <ErrorNote message={error} />
      <Submit loading={loading}>Send reset link</Submit>
    </form>
  );
}

/* ── Reset password ───────────────────────────────────────────────────── */

export function ResetPasswordForm({ token }: { token?: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        This reset link is missing its token. Please request a new one.
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setError('');
    setLoading(true);
    try {
      const { res, data } = await postJson('/api/auth/reset-password', { token, password });
      if (!res.ok) {
        setError((data.error as string) || 'Could not reset your password.');
        return;
      }
      setDone(true);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-5">
        <p className="flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/[0.06] px-4 py-3 text-sm text-white/80">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
          Your password has been reset. You can now sign in.
        </p>
        <a
          href="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-gradient py-3.5 text-sm font-semibold text-ink shadow-gold"
        >
          Go to sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="New password" htmlFor="password">
        <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputBase} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirm">
        <input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputBase} />
      </Field>
      <ErrorNote message={error} />
      <Submit loading={loading}>Reset password</Submit>
    </form>
  );
}

/* ── Change password (signed-in) ──────────────────────────────────────── */

export function ChangePasswordForm() {
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNew] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (newPassword !== confirm) return setError('New passwords do not match.');
    setError('');
    setLoading(true);
    try {
      const { res, data } = await postJson('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (!res.ok) {
        setError((data.error as string) || 'Could not change your password.');
        return;
      }
      setDone(true);
      setCurrent('');
      setNew('');
      setConfirm('');
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {done && (
        <p className="flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/[0.06] px-4 py-3 text-sm text-white/80">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
          Your password has been changed.
        </p>
      )}
      <Field label="Current password" htmlFor="currentPassword">
        <input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} className={inputBase} />
      </Field>
      <Field label="New password" htmlFor="newPassword">
        <input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} className={inputBase} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmNew">
        <input id="confirmNew" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputBase} />
      </Field>
      <ErrorNote message={error} />
      <Submit loading={loading}>Change password</Submit>
    </form>
  );
}

/* ── Logout ───────────────────────────────────────────────────────────── */

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-gold/40 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4 text-gold" />
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
