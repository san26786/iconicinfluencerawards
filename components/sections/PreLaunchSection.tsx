import { Sparkles, CalendarDays, MapPin, Ticket } from 'lucide-react';
import { getSite } from '@/lib/site';
import { PreLaunchForm } from '@/components/PreLaunchForm';

export async function PreLaunchSection() {
  const site = await getSite();

  return (
    <section
      id="pre-launch"
      className="relative overflow-hidden bg-ink grain"
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[40rem] w-[40rem] rounded-full bg-gold/20 blur-[140px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[34rem] w-[34rem] rounded-full bg-gold-light/10 blur-[130px]" />

      <div className="container-luxe section-pad relative z-10 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-start">

          {/* LEFT — copy */}
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full glass-gold px-4 py-2 text-[0.68rem] sm:text-xs font-semibold uppercase tracking-luxe text-gold">
              <Sparkles className="h-3.5 w-3.5" />
              Pre-Launch — Limited Places
            </span>

            <h2 className="mt-6 font-display text-[2.6rem] leading-[1] sm:text-5xl lg:text-[3.2rem] font-semibold text-white text-balance">
              Join the{' '}
              <span className="text-gold-shimmer">Pre-Launch</span>
            </h2>

            <p className="mt-3 font-display text-xl sm:text-2xl font-medium text-white/60">
              {site.name}
            </p>

            <p className="mt-6 max-w-md text-base leading-relaxed text-white/55">
              Some moments in business are bigger than deals or profits — they&apos;re about
              recognition, influence, and legacy. The {site.name} Pre-Launch is one of those
              moments. It&apos;s where the journey begins, and where you can choose to be seen,
              heard, and remembered.
            </p>

            {/* Event detail pills */}
            <div className="mt-8 flex flex-wrap gap-3">
              {site.event_date_long && (
                <div className="flex items-center gap-2.5 rounded-2xl glass px-4 py-3">
                  <CalendarDays className="h-4 w-4 flex-shrink-0 text-gold" />
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">
                      Ceremony
                    </p>
                    <p className="text-sm font-semibold text-white">{site.event_date_long}</p>
                  </div>
                </div>
              )}
              {site.venue_short && (
                <div className="flex items-center gap-2.5 rounded-2xl glass px-4 py-3">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-gold" />
                  <div>
                    <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">
                      Venue
                    </p>
                    <p className="text-sm font-semibold text-white">{site.venue_short}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Reassurance */}
            <div className="mt-10 flex items-start gap-3 rounded-2xl glass-gold p-4">
              <Ticket className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold" />
              <p className="text-sm leading-relaxed text-white/70">
                Pre-launch registration is <span className="font-semibold text-white">free</span>.
                We&apos;ll reach out with exclusive early-access details ahead of the public launch.
              </p>
            </div>
          </div>

          {/* RIGHT — form card */}
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-7 shadow-2xl backdrop-blur-sm sm:p-10">
            <div className="mb-6">
              <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">
                Get A Pre-Launch Ticket
              </h3>
              <p className="mt-1 text-sm text-white/50">
                Secure your place — we&apos;ll be in touch with details.
              </p>
              <div className="gold-rule mt-5" />
            </div>

            <PreLaunchForm siteId={site.id} siteName={site.name} />
          </div>

        </div>
      </div>
    </section>
  );
}
