import dynamic from 'next/dynamic';
import { HeroRouter } from '@/components/sections/HeroRouter';
import { CountdownBand } from '@/components/sections/CountdownBand';
import { WhyWin } from '@/components/sections/WhyWin';
import { CategoriesBanner } from '@/components/CategoriesBanner';

// "Find My Award" is deliberately not rendered yet: its quiz questions and
// results are built entirely from the AWARD_CATEGORIES taxonomy in
// lib/content.ts, which is still the inherited property-industry taxonomy
// (see scripts/seed-iconic-influencer-awards.js — themes/categories were
// intentionally left unseeded pending real category names). Re-add
// `<FindMyAward />` below once that taxonomy is replaced with real
// Iconic Influencer Awards categories.

// Below-the-fold sections are dynamic-imported so the JS for sections the
// user may never scroll to doesn't sit in the initial / route bundle.
// ssr stays on (the default) so the static HTML a crawler sees is unchanged —
// no LCP, SEO or hydration regression.
const Journey = dynamic(() =>
  import('@/components/sections/Journey').then((m) => m.Journey),
);
const JudgingProcess = dynamic(() =>
  import('@/components/sections/JudgingProcess').then((m) => m.JudgingProcess),
);
const Inaugural = dynamic(() =>
  import('@/components/sections/Inaugural').then((m) => m.Inaugural),
);
const AwardsNight = dynamic(() =>
  import('@/components/sections/AwardsNight').then((m) => m.AwardsNight),
);
const Faq = dynamic(() =>
  import('@/components/sections/Faq').then((m) => m.Faq),
);
const ContactSection = dynamic(() =>
  import('@/components/sections/ContactSection').then((m) => m.ContactSection),
);
const FinalCta = dynamic(() =>
  import('@/components/sections/FinalCta').then((m) => m.FinalCta),
);
const BeSocial = dynamic(() =>
  import('@/components/sections/BeSocial').then((m) => m.BeSocial),
);
const PreLaunchSection = dynamic(() =>
  import('@/components/sections/PreLaunchSection').then((m) => m.PreLaunchSection),
);

export default function Home() {
  return (
    <main id="main">
      {/*  1 */} <HeroRouter />
      {/*  2 */} <CountdownBand />
      {/*  4 */} <WhyWin />
      {/*  5 */} <CategoriesBanner />
      {/*  6 */} <Journey />
      {/*  7 */} <JudgingProcess />
      {/*  8 */} <Inaugural />
      {/*  9 */} <AwardsNight />
      {/* 10 */} <Faq />
      {/* 11 */} <ContactSection />
      {/* 12 */} <FinalCta />
      {/* 13 */} <BeSocial />
      {/* 14 */} <PreLaunchSection />
    </main>
  );
}
