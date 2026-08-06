// Read-only nomination view, laid out in the same sections as the public
// nomination form. The "Edit" button links to the dedicated edit page, which
// reuses the real RegisterForm (see app/organiser/nominations/[id]/edit).

import Link from 'next/link';
import { ArrowLeft, FileText, Link2, Pencil, Video } from 'lucide-react';
import { CategoryPills } from './Dashboard';
import type { ReactNode } from 'react';

export type NominationFull = {
  id: number;
  site: string | null;
  submitted: string;
  awardCategories: string[];
  selfNominate: boolean;
  anonymous: boolean;
  nomineeFirstName: string | null;
  nomineeLastName: string | null;
  nomineeEmail: string | null;
  nomineeMobile: string | null;
  nomineeWorkPhone: string | null;
  nomineeOrganisation: string | null;
  nomineePostCode: string | null;
  openingStatement: string | null;
  linkedIn: string | null;
  howHeard: string | null;
  nominatorFirstName: string | null;
  nominatorLastName: string | null;
  nominatorEmail: string | null;
  nominatorMobile: string | null;
  nominatorWorkPhone: string | null;
  businessName: string | null;
  businessLocation: string | null;
  businessCategory: string | null;
  supporting: {
    documents?: { name?: string; url?: string }[];
    videos?: { name?: string; url?: string }[];
    videoLink?: string;
  } | null;
  agreedToTerms: boolean;
};

export function NominationDetail({ nomination: n }: { nomination: NominationFull }) {
  const sup = n.supporting;
  const hasSupporting =
    !!sup && ((sup.documents?.length ?? 0) > 0 || (sup.videos?.length ?? 0) > 0 || !!sup.videoLink);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/organiser"
            className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
            Nomination #{n.id}
          </h1>
          <p className="mt-1 text-sm text-white/55">Submitted {n.submitted}</p>
        </div>
        <Link
          href={`/organiser/nominations/${n.id}/edit`}
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold transition-transform hover:-translate-y-0.5"
        >
          <Pencil className="h-4 w-4" />
          Edit nomination
        </Link>
      </div>

      <Section n="01" title="Award Categories">
        <CategoryPills categories={n.awardCategories} max={100} />
      </Section>

      <Section
        n="02"
        title="Nominee Information"
        right={
          <div className="flex flex-wrap gap-2">
            <Flag label="Self-nomination" value={n.selfNominate} />
            <Flag label="Anonymous" value={n.anonymous} />
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Read label="First name" value={n.nomineeFirstName} />
          <Read label="Last name" value={n.nomineeLastName} />
          <Read label="Email" value={n.nomineeEmail} />
          <Read label="Mobile" value={n.nomineeMobile} />
          <Read label="Work phone" value={n.nomineeWorkPhone} />
          <Read label="Organisation" value={n.nomineeOrganisation} />
          <Read label="Post code" value={n.nomineePostCode} />
          <Read label="How they heard" value={n.howHeard} />
          <Read label="LinkedIn" value={n.linkedIn} link className="sm:col-span-2" />
          <Read label="Opening statement / reason" value={n.openingStatement} className="sm:col-span-2" />
        </div>
      </Section>

      <Section n="03" title="Supporting Material">
        {hasSupporting ? (
          <div className="flex flex-col gap-1.5 text-sm text-white/75">
            {sup!.documents?.map((d, i) =>
              d.url ? (
                <a
                  key={`doc-${i}`}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold underline-offset-4 hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {d.name || 'Document'}
                </a>
              ) : (
                <span key={`doc-${i}`} className="inline-flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-gold" />
                  {d.name || 'Document'}
                </span>
              ),
            )}
            {sup!.videos?.map((vi, i) =>
              vi.url ? (
                <a
                  key={`vid-${i}`}
                  href={vi.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gold underline-offset-4 hover:underline"
                >
                  <Video className="h-3.5 w-3.5" />
                  {vi.name || 'Video'}
                </a>
              ) : (
                <span key={`vid-${i}`} className="inline-flex items-center gap-2">
                  <Video className="h-3.5 w-3.5 text-gold" />
                  {vi.name || 'Video'}
                </span>
              ),
            )}
            {sup!.videoLink && (
              <a
                href={sup!.videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-gold underline-offset-4 hover:underline"
              >
                <Link2 className="h-3.5 w-3.5" />
                {sup!.videoLink}
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-white/45">No supporting material was attached.</p>
        )}
      </Section>

      <Section n="04" title="Nominator (Your Information)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Read label="First name" value={n.nominatorFirstName} />
          <Read label="Last name" value={n.nominatorLastName} />
          <Read label="Email" value={n.nominatorEmail} />
          <Read label="Mobile" value={n.nominatorMobile} />
          <Read label="Work phone" value={n.nominatorWorkPhone} />
          <Read label="Business name" value={n.businessName} />
          <Read label="Business location" value={n.businessLocation} />
          <Read label="Business category" value={n.businessCategory} />
        </div>
        <p className="mt-4 text-xs text-white/40">
          Terms agreed: {n.agreedToTerms ? 'Yes' : 'No'}
        </p>
      </Section>
    </div>
  );
}

/* ── Building blocks ──────────────────────────────────────────────────── */

function Section({
  n,
  title,
  right,
  children,
}: {
  n: string;
  title: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl glass p-6 sm:p-8">
      <header className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-gradient text-xs font-semibold text-ink shadow-gold-sm">
            {n}
          </span>
          <h2 className="font-display text-lg font-semibold text-white sm:text-xl">{title}</h2>
        </div>
        {right}
      </header>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Read({
  label,
  value,
  link,
  className = '',
}: {
  label: string;
  value: string | null;
  link?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/55">
        {label}
      </span>
      {value ? (
        link ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-all text-sm text-gold underline-offset-4 hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm text-white/80">{value}</p>
        )
      ) : (
        <p className="text-sm text-white/40">—</p>
      )}
    </div>
  );
}

function Flag({ label, value }: { label: string; value: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        value ? 'border-gold/40 bg-gold/10 text-white' : 'border-white/10 text-white/45'
      }`}
    >
      {label}: {value ? 'Yes' : 'No'}
    </span>
  );
}
