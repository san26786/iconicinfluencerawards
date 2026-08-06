import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { LegalContent, type LegalSection } from '@/components/LegalContent';
import { getSite } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Privacy Policy',
    description: `How ${site.name} collects, uses and protects your personal information.`,
  };
}

const buildSections = (siteName: string, company: string, address: string): LegalSection[] => [
  {
    heading: 'Who we are',
    paragraphs: [
      `${siteName} is a trading style of ${company}, registered at ${address}. We are the data controller responsible for the personal information described in this policy.`,
    ],
  },
  {
    heading: 'Information we collect',
    paragraphs: ['We may collect and process the following information about you:'],
    bullets: [
      'Contact details you provide, such as your name, business name, email address and phone number',
      'Award entry and nomination information you submit',
      'Correspondence when you contact us by email, phone or our contact form',
      'Technical data such as your IP address, browser type and how you use our website',
    ],
  },
  {
    heading: 'How we use your information',
    paragraphs: ['We use your personal information to:'],
    bullets: [
      'Administer award entries, nominations, judging and the awards ceremony',
      'Respond to your enquiries and keep you updated about the awards',
      'Improve our website and the services we offer',
      'Comply with our legal and regulatory obligations',
    ],
  },
  {
    heading: 'Lawful basis for processing',
    paragraphs: [
      'We rely on your consent, the performance of a contract, our legitimate interests in running the awards, and compliance with legal obligations as the lawful bases for processing your personal data under the UK GDPR.',
    ],
  },
  {
    heading: 'Sharing your information',
    paragraphs: [
      'We do not sell your personal data. We may share it with our independent judges, trusted service providers who help us operate the awards, and partners or sponsors only where you have agreed. We may also disclose information where required by law.',
    ],
  },
  {
    heading: 'Data retention',
    paragraphs: [
      'We keep your personal information only for as long as necessary to fulfil the purposes set out in this policy, including any legal, accounting or reporting requirements.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: ['Under data protection law you have the right to:'],
    bullets: [
      'Access the personal information we hold about you',
      'Request correction or deletion of your personal information',
      'Object to or restrict our processing of your information',
      'Withdraw consent at any time, and to data portability',
    ],
  },
  {
    heading: 'Cookies',
    paragraphs: [
      'Our website uses essential cookies to function correctly and may use analytics cookies to understand how visitors use the site. You can control cookies through your browser settings.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'We may update this policy from time to time. Any changes will be posted on this page with a revised “last updated” date.',
    ],
  },
];

export default async function PrivacyPage() {
  const site = await getSite();
  return (
    <main id="main">
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="Your privacy matters to us. This policy explains what information we collect and how we use it."
      />
      <LegalContent
        updated="January 2026"
        intro={`This Privacy Policy describes how ${site.name} collects, uses and protects the personal information you share with us through our website and the awards process.`}
        sections={buildSections(site.name, site.company ?? '', site.address ?? '')}
      />
    </main>
  );
}
