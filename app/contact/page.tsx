import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, ExternalLink } from 'lucide-react';
import { getSite } from '@/lib/site';
import { PageHero } from '@/components/PageHero';
import { ContactForm } from '@/components/ContactForm';
import { Reveal } from '@/components/ui/Reveal';
import { SocialLinks } from '@/components/ui/Social';

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: 'Contact',
    description: `Get in touch with the ${site.name} team — for entries, nominations, sponsorship and press enquiries.`,
  };
}

// Built from the site's own address so each tenant links to its own location.
const mapsHref = (address: string | null) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? '')}`;

export default async function ContactPage() {
  const site = await getSite();
  return (
    <main id="main">
      <PageHero
        eyebrow="Contact Us"
        title={
          <>
            Let&apos;s start a <span className="text-gold-gradient">conversation</span>
          </>
        }
        subtitle="Whether you're ready to enter, want to nominate a business you admire, or are interested in becoming a partner — we'd love to hear from you."
      />

      <section className="relative bg-ink py-16 lg:py-24">
        <div className="container-luxe section-pad grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Details */}
          <Reveal className="space-y-4">
            {site.phone_display && (
              <ContactCard icon={<Phone className="h-5 w-5 text-ink" />} label="Call us" href={site.phone_href ?? undefined}>
                {site.phone_display}
              </ContactCard>
            )}
            {site.email && (
              <ContactCard
                icon={<Mail className="h-5 w-5 text-ink" />}
                label="Email us"
                href={`mailto:${site.email}`}
              >
                {site.email}
              </ContactCard>
            )}
            <ContactCard icon={<MapPin className="h-5 w-5 text-ink" />} label="Visit us">
              <span className="font-semibold text-white">{site.company}</span>
              <br />
              {site.address}
            </ContactCard>
            <ContactCard icon={<Clock className="h-5 w-5 text-ink" />} label="Response time">
              Within 1 business day · Faster for urgent enquiries
            </ContactCard>

            <div className="rounded-2xl glass p-6">
              <p className="text-xs font-semibold uppercase tracking-luxe text-gold">Follow the journey</p>
              <SocialLinks
                buttonClass="h-11 w-11"
                className="mt-4"
                facebook={site.social_facebook ?? undefined}
                instagram={site.social_instagram ?? undefined}
                linkedin={site.social_linkedin ?? undefined}
                x={site.social_x ?? undefined}
              />
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>

        {/* Location */}
        <div className="container-luxe section-pad mt-12">
          <Reveal>
            <div className="grid overflow-hidden rounded-3xl glass md:grid-cols-2">
              {/* Stylised map */}
              <div className="relative min-h-[280px] overflow-hidden bg-slate950">
                <div
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(204, 27, 27,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(204, 27, 27,0.08) 1px, transparent 1px)',
                    backgroundSize: '34px 34px',
                  }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(204, 27, 27,0.22),transparent_62%)]" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="relative flex h-16 w-16 items-center justify-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-gold/30" />
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-gradient shadow-gold">
                      <MapPin className="h-6 w-6 text-ink" />
                    </span>
                  </span>
                </div>
              </div>
              {/* Details */}
              <div className="flex flex-col justify-center gap-4 p-8 lg:p-12">
                <span className="eyebrow">
                  <span className="h-px w-6 bg-gold/60" />
                  Find Us
                </span>
                <h3 className="font-display text-2xl font-semibold text-white">{site.company}</h3>
                <p className="leading-relaxed text-white/65">{site.address}</p>
                <a
                  href={mapsHref(site.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full glass-gold px-5 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
                >
                  Open in Google Maps
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

function ContactCard({
  icon,
  label,
  href,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const inner = (
    <div className="flex items-start gap-4 rounded-2xl glass p-6 transition-colors duration-300 hover:border-gold/30">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gold-gradient shadow-gold-sm">
        {icon}
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">{label}</p>
        <p className="mt-1.5 leading-relaxed text-white/75">{children}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}
