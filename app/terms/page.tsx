import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { LegalContent, type LegalSection } from '@/components/LegalContent';
import { getSite } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Terms & Conditions',
    description: `The terms and conditions governing entry to ${site.name} and use of our website.`,
  };
}

// Built per site: the trading entity and the eligibility geography differ by
// tenant, and naming the wrong company in terms of entry is a legal problem,
// not a cosmetic one.
const buildSections = (
  siteName: string,
  company: string,
  eventCity: string,
): LegalSection[] => [
  {
    heading: 'About these terms',
    paragraphs: [
      `These terms and conditions govern your use of the ${siteName} website and your participation in the awards. ${siteName} is a trading style of ${company}. By entering the awards or using this website, you agree to these terms.`,
    ],
  },
  {
    heading: 'Eligibility',
    paragraphs: ['To enter the awards, businesses must:'],
    bullets: [
      eventCity
        ? `Be based in, or actively trading within, ${eventCity} and the surrounding region`
        : 'Be based in, or actively trading within, the region the awards serve',
      'Provide accurate and truthful information in their entry',
      'Hold the right to submit any materials included in their entry',
    ],
  },
  {
    heading: 'Entries and nominations',
    paragraphs: [
      'Entry to the awards is free. Businesses may enter as many categories as they wish, and members of the public may nominate a business they believe deserves recognition. We reserve the right to verify entries and to move an entry to a more appropriate category where necessary.',
    ],
  },
  {
    heading: 'Judging',
    paragraphs: [
      'All entries are reviewed and scored by an independent panel of judges. Judging is carried out impartially and in good faith. The judges’ decisions are final, and we are unable to enter into individual correspondence regarding scores or outcomes.',
    ],
  },
  {
    heading: 'Use of entry information',
    paragraphs: [
      'By entering, you grant us permission to use your business name, logo and a summary of your entry for the purpose of promoting the awards, announcing finalists and winners, and related publicity, in line with our Privacy Policy.',
    ],
  },
  {
    heading: 'The awards ceremony',
    paragraphs: [
      'Finalists will be invited to the awards ceremony. Ticket availability, pricing and event details are communicated separately. We reserve the right to change the date, venue or format of the event where circumstances require.',
    ],
  },
  {
    heading: 'Intellectual property',
    paragraphs: [
      'All content on this website, including text, graphics, logos and the awards branding, is owned by or licensed to us and is protected by intellectual property laws. You may not reproduce it without our prior written permission.',
    ],
  },
  {
    heading: 'Limitation of liability',
    paragraphs: [
      'We provide this website and the awards in good faith. To the fullest extent permitted by law, we are not liable for any loss or damage arising from your use of the website or participation in the awards.',
    ],
  },
  {
    heading: 'Governing law',
    paragraphs: [
      'These terms are governed by the laws of England and Wales, and any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.',
    ],
  },
];

export default async function TermsPage() {
  const site = await getSite();
  return (
    <main id="main">
      <PageHero
        eyebrow="Legal"
        title="Terms & Conditions"
        subtitle="The terms that govern entry to the awards and use of our website."
      />
      <LegalContent
        updated="January 2026"
        intro={`Please read these terms and conditions carefully before entering ${site.name} or using our website.`}
        sections={buildSections(site.name, site.company ?? '', site.event_city ?? '')}
      />
    </main>
  );
}
