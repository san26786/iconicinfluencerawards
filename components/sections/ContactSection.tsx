import { Mail, MapPin, Phone } from 'lucide-react';
import { getSite } from '@/lib/site';
import { ContactForm } from '../ContactForm';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';

/**
 * Homepage contact block — the same form as /contact, sitting beside the
 * team's direct details so a visitor never has to leave the page to ask a
 * question. Contact details come off the site row.
 */
export async function ContactSection() {
  const site = await getSite();

  return (
    <section id="contact" className="relative overflow-hidden bg-slate950 py-24 lg:py-32">
      <div className="pointer-events-none absolute right-0 top-1/4 h-[32rem] w-[32rem] rounded-full bg-gold/10 blur-[150px] hidden sm:block" />

      <div className="container-luxe section-pad relative">
        <SectionHeading
          eyebrow="Contact us"
          title={
            <>
              We&apos;d love to <span className="text-gold-gradient">hear from you</span>
            </>
          }
          subtitle="Questions about entering, sponsorship, tickets or judging? Send a message and we will reply within one working day."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-start">
          {/* Direct details */}
          <Reveal>
            <ul className="space-y-4">
              {site.email && (
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="flex items-start gap-4 rounded-2xl glass p-5 transition-colors hover:border-gold/30"
                  >
                    <Mail className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                    <span>
                      <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                        Email
                      </span>
                      <span className="mt-1 block break-all text-sm text-white/80">{site.email}</span>
                    </span>
                  </a>
                </li>
              )}
              {site.phone_href && (
                <li>
                  <a
                    href={site.phone_href}
                    className="flex items-start gap-4 rounded-2xl glass p-5 transition-colors hover:border-gold/30"
                  >
                    <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                    <span>
                      <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                        Phone
                      </span>
                      <span className="mt-1 block text-sm text-white/80">{site.phone_display}</span>
                    </span>
                  </a>
                </li>
              )}
              {site.address && (
                <li className="flex items-start gap-4 rounded-2xl glass p-5">
                  <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
                  <span>
                    <span className="block text-[0.65rem] font-semibold uppercase tracking-wider text-white/40">
                      Address
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/80">
                      {site.address}
                    </span>
                  </span>
                </li>
              )}
            </ul>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.12}>
            <div className="rounded-3xl glass p-6 sm:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
