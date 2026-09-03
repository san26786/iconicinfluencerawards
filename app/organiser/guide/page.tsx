// The organiser's user guide.
//
// One page per site, generated from lib/guide/content.ts, so every award site
// has the same guide talking about its own panel. The layout lives in
// components/GuideBook — shared with the entrant and judge guides.
//
// OPEN WITHOUT SIGNING IN
//
// The link is sent to people before they have an account — a new organiser, a
// client being shown how the panel works — and asking them to log in to read
// the instructions for logging in is a door that locks from the inside. There
// is nothing private here: it describes screens rather than showing anyone's
// data, and the screenshots have always been public files under public/guide.
// The organiser nav only appears for somebody who is actually signed in, so a
// visitor gets the manual and not a menu of doors that will bounce them.

import { getSessionUser } from '@/lib/auth';
import { getSite } from '@/lib/site';
import { GUIDE } from '@/lib/guide/content';
import { GuideBook } from '@/components/GuideBook';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'User guide' };

export default async function GuidePage() {
  // Read, never required: the nav is the only thing that depends on it.
  const user = await getSessionUser().catch(() => null);
  const site = await getSite();

  return (
    <GuideBook
      sections={GUIDE}
      siteSlug={site.slug}
      eyebrow="Organiser"
      intro={`How to run ${site.name}, screen by screen. Every step names exactly what you will see. If you have never opened this panel before, start at the top and work down.`}
      nav={user?.role === 'organiser' ? <OrganiserNav /> : null}
      backHref="/organiser"
      backLabel="Back to the dashboard"
    />
  );
}
