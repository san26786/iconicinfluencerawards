import { getSite } from '@/lib/site';
import { Hero } from './Hero';
import { HeroCorporate } from './HeroCorporate';
import { HeroSport } from './HeroSport';

export async function HeroRouter() {
  const site = await getSite();

  switch (site.design_variant) {
    case 'corporate': return <HeroCorporate />;
    case 'sport':     return <HeroSport />;
    default:          return <Hero />;
  }
}
