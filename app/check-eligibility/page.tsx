import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { PageHero } from '@/components/PageHero';
import { EligibilityChecker } from '@/components/sections/EligibilityChecker';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Check My Eligibility' };

export default async function CheckEligibilityPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login?redirect=/check-eligibility');

  return (
    <main id="main" className="min-h-screen pb-24">
      <PageHero
        eyebrow="Eligibility Check"
        title={
          <>
            Are you eligible to{' '}
            <span className="text-gold-gradient">apply?</span>
          </>
        }
        subtitle="Answer the questions below to confirm your eligibility. Make sure your profile is complete before starting."
      />
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-5">
          <EligibilityChecker />
        </div>
      </section>
    </main>
  );
}
