// The entrant's user guide.
//
// Same renderer and the same per-site screenshots as the organiser guide — see
// components/GuideBook — with lib/guide/nominee.ts for the content.
//
// OPEN WITHOUT SIGNING IN, for the same reason the organiser guide is: the link
// goes out with nomination emails, to people who have not set a password yet.
// Asking somebody to sign in to read the instructions for signing in is a door
// that locks from the inside. Nothing here is private — it describes screens
// rather than showing anyone's entry.

import { getSite } from '@/lib/site';
import { NOMINEE_GUIDE } from '@/lib/guide/nominee';
import { GuideBook } from '@/components/GuideBook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Entrant guide' };

export default async function NomineeGuidePage() {
  const site = await getSite();

  return (
    <GuideBook
      sections={NOMINEE_GUIDE}
      siteSlug={site.slug}
      eyebrow="Entrants"
      intro={`How to enter ${site.name}, step by step — from the nomination email to the night itself. Every step names exactly what you will see. If you have just been nominated, start at the top.`}
      backHref="/account"
      backLabel="Back to my dashboard"
    />
  );
}
