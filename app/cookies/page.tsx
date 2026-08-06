import type { Metadata } from 'next';
import { PageHero } from '@/components/PageHero';
import { LegalContent, type LegalSection } from '@/components/LegalContent';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How this website uses cookies and similar technologies, and how you can manage them.',
};

const sections: LegalSection[] = [
  {
    heading: 'What are cookies',
    paragraphs: [
      'Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work, to improve your experience, and to provide information to the site owner. Similar technologies such as pixels and local storage work in much the same way.',
    ],
  },
  {
    heading: 'How we use cookies',
    paragraphs: [
      'We use cookies to keep the website secure and working as intended, to remember your preferences, and to understand how visitors use the site so we can improve it. We do not use cookies to collect more information than we need.',
    ],
  },
  {
    heading: 'The types of cookies we use',
    bullets: [
      'Essential cookies — required for the website to function, for example keeping the site secure and remembering your progress through a form. These cannot be switched off.',
      'Performance & analytics cookies — help us understand which pages are visited and how the site performs, so we can improve it. These are only set with your agreement where required.',
      'Preference cookies — remember choices you make, such as previously entered details, to give you a smoother experience.',
    ],
  },
  {
    heading: 'Third-party cookies',
    paragraphs: [
      'Some cookies may be set by third-party services we use, such as analytics providers or embedded content. These providers have their own privacy and cookie policies, which we encourage you to review.',
    ],
  },
  {
    heading: 'Managing your cookies',
    paragraphs: [
      'You can control and delete cookies through your browser settings, and set your browser to refuse cookies or alert you when cookies are being sent. Please note that disabling essential cookies may affect how the website functions.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'We may update this Cookie Policy from time to time to reflect changes in technology or the law. Any changes will be posted on this page with an updated revision date.',
    ],
  },
];

export default function CookiesPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow="Legal"
        title="Cookie Policy"
        subtitle="How this website uses cookies and similar technologies — and how you can manage them."
      />
      <LegalContent
        updated="January 2026"
        intro="This policy explains how we use cookies and similar technologies on this website."
        sections={sections}
      />
    </main>
  );
}
