// The judge's user guide.
//
// Same renderer and the same per-site screenshots as the organiser guide — see
// components/GuideBook — with lib/guide/judge.ts for the content.
//
// OPEN WITHOUT SIGNING IN, for the same reason the organiser guide is: the link
// goes out with panel invitations, before the invitee has an account. Nothing
// here is private — it describes screens rather than showing anyone's scores.

import { getSite } from '@/lib/site';
import { JUDGE_GUIDE } from '@/lib/guide/judge';
import { GuideBook } from '@/components/GuideBook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Judge guide' };

export default async function JudgeGuidePage() {
  const site = await getSite();

  return (
    <GuideBook
      sections={JUDGE_GUIDE}
      siteSlug={site.slug}
      eyebrow="Judges"
      intro={`How judging works on ${site.name}, screen by screen — signing in, reading your board, and recording your scores. Every step names exactly what you will see.`}
      backHref="/judge"
      backLabel="Back to the judge dashboard"
    />
  );
}
