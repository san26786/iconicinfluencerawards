import Image from 'next/image';
import Link from 'next/link';
import { query } from '@/lib/db';
import { getSite, getSiteId } from '@/lib/site';
import { Linkedin, Facebook, Twitter, Briefcase, Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const site = await getSite();
  return { title: `Become a Judge – ${site?.name ?? 'Awards'}` };
}

type Judge = {
  id: number;
  first_name: string;
  last_name: string;
  company: string | null;
  job_title: string | null;
  expertise: string | null;
  bio: string | null;
  linkedin: string | null;
  facebook: string | null;
  twitter: string | null;
  profile_pic_url: string | null;
};

function JudgeCard({ judge }: { judge: Judge }) {
  const name = `${judge.first_name} ${judge.last_name}`;

  return (
    <div className="group flex flex-col rounded-3xl glass overflow-hidden transition-all hover:-translate-y-0.5">
      {/* Photo */}
      <div className="relative mx-auto mt-8 h-28 w-28 flex-shrink-0">
        {judge.profile_pic_url ? (
          <Image
            src={judge.profile_pic_url}
            alt={name}
            fill
            className="rounded-full object-cover ring-2 ring-gold/30"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/5 ring-2 ring-white/10">
            <span className="font-display text-3xl font-semibold text-white/40">
              {judge.first_name[0]}{judge.last_name[0]}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-4 text-center">
        <h3 className="font-display text-lg font-semibold text-white">{name}</h3>

        {(judge.job_title || judge.company) && (
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-white/55">
            <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
            {[judge.job_title, judge.company].filter(Boolean).join(', ')}
          </p>
        )}

        {judge.expertise && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gold/80">
            <Award className="h-3.5 w-3.5 flex-shrink-0" />
            {judge.expertise}
          </p>
        )}

        {judge.bio && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/50">
            {judge.bio}
          </p>
        )}

        {/* Social links */}
        {(judge.linkedin || judge.facebook || judge.twitter) && (
          <div className="mt-4 flex items-center justify-center gap-3">
            {judge.linkedin && (
              <a href={judge.linkedin} target="_blank" rel="noopener noreferrer"
                className="text-white/35 transition-colors hover:text-gold">
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {judge.facebook && (
              <a href={judge.facebook} target="_blank" rel="noopener noreferrer"
                className="text-white/35 transition-colors hover:text-gold">
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {judge.twitter && (
              <a href={judge.twitter} target="_blank" rel="noopener noreferrer"
                className="text-white/35 transition-colors hover:text-gold">
                <Twitter className="h-4 w-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function JudgesPage() {
  const [site, siteId] = await Promise.all([getSite(), getSiteId()]);

  const { rows } = await query<Judge>(
    `SELECT id, first_name, last_name, company, job_title, expertise, bio,
            linkedin, facebook, twitter, profile_pic_url
       FROM judges
      WHERE site_id = $1 AND status = 'approved'
      ORDER BY last_name, first_name`,
    [siteId],
  );

  return (
    <main id="main" className="min-h-screen px-5 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-6xl">

        {/* Header */}
        <div className="text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Join the Panel</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
            Become a Judge
          </h1>
          <div className="mx-auto mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-white/60">
            <p>
              Our Awards judges represent the very best of the profession, and its ecosystem.
              All our judges give up their time to pore over the entries, across a three-stage process.
            </p>
            <p>
              We appoint an independent panel of judges each year, comprised of accredited professionals.
              The panel is carefully selected through a fair and objective selection process and includes
              experts from across the profession. The judges are bound by a strict confidentiality agreement
              and are required to declare any conflict of interest in entries over which they deliberate
              and to stand aside from deliberations concerning those entries. Judges give their time
              voluntarily to judge the awards.
            </p>
            <p>
              The make-up of our judging panel changes from year to year, reflecting the ever-evolving
              nature of the industry itself. Our closely vetted panel comes together on the yearly judging
              day for lively debates on our hotly contested categories ensuring each entry is vetted
              against our strict criteria and high standards.
            </p>
          </div>
          <div className="mt-6">
            <Link
              href="/apply-judge"
              className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-sm font-semibold text-ink shadow-gold"
            >
              Apply to be a Judge
            </Link>
          </div>
        </div>

        {/* Judge grid — shown only once judges are announced */}
        {rows.length > 0 && (
          <>
            <div className="mt-16 text-center">
              <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Panel</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">Our Judges</h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rows.map((j) => <JudgeCard key={j.id} judge={j} />)}
            </div>
          </>
        )}

        {/* CTA to apply */}
        <div className="mt-16 rounded-3xl glass-gold px-8 py-10 text-center">
          <h2 className="font-display text-2xl font-semibold text-white">Ready to make an impact?</h2>
          <p className="mt-3 text-sm text-white/60">
            Join a panel of respected professionals shaping the future of business recognition.
          </p>
          <Link
            href="/apply-judge"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-ink shadow-gold"
          >
            Apply to be a Judge
          </Link>
        </div>

      </div>
    </main>
  );
}
