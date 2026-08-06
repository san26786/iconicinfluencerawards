import { JudgeApplicationForm } from '@/components/JudgeApplicationForm';
import { getSite } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const site = await getSite();
  return { title: `Apply to be a Judge – ${site?.name ?? 'Awards'}` };
}

export default async function ApplyJudgePage() {
  const site = await getSite();

  return (
    <main id="main" className="min-h-screen px-5 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-[0.65rem] font-semibold uppercase tracking-luxe text-gold">Join our panel</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
          Apply to be a Judge
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/60">
          Share your expertise and help recognise the outstanding businesses that shape{' '}
          {site?.name ?? 'our region'}. Complete the form below and our team will be in touch.
        </p>

        <div className="mt-10">
          <JudgeApplicationForm />
        </div>
      </div>
    </main>
  );
}
