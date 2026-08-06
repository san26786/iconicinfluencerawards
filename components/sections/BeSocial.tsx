import { getSite } from '@/lib/site';
import { SocialLinks } from '../ui/Social';
import { Reveal } from '../ui/Reveal';

/**
 * "Be Social — Follow Us" band.
 *
 * Renders nothing at all when the site row has no social accounts set: an
 * empty follow-us strip reads as a broken section, and these accounts are
 * still being created.
 */
export async function BeSocial() {
  const site = await getSite();

  const hasAny = Boolean(
    site.social_facebook || site.social_instagram || site.social_linkedin || site.social_x,
  );
  if (!hasAny) return null;

  return (
    <section className="relative overflow-hidden bg-ink py-16">
      <div className="container-luxe section-pad relative text-center">
        <Reveal>
          <span className="eyebrow justify-center">
            <span className="h-px w-6 bg-gold/60" />
            Stay Connected
          </span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">
            Be Social — <span className="text-gold-gradient">Follow Us</span>
          </h2>
          <SocialLinks
            className="mt-7 justify-center"
            buttonClass="h-12 w-12"
            iconClass="h-5 w-5"
            facebook={site.social_facebook ?? undefined}
            instagram={site.social_instagram ?? undefined}
            linkedin={site.social_linkedin ?? undefined}
            x={site.social_x ?? undefined}
          />
        </Reveal>
      </div>
    </section>
  );
}
