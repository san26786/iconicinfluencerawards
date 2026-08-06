import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { JudgingPanelClient } from '@/components/organiser/JudgingPanelClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Judging Panel' };

export default async function JudgingPanelPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'organiser') redirect('/login');

  return (
    <div className="flex h-screen flex-col pt-16">
      <JudgingPanelClient />
    </div>
  );
}
