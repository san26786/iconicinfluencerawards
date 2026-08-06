import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { OrganiserNav } from '@/components/organiser/OrganiserNav';
import { EventForm } from '@/components/organiser/EventForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function NewEventPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'organiser') redirect('/account');

  return (
    <div className="min-h-screen bg-ink grain pt-24">
      <div className="container-luxe section-pad py-12">
        <OrganiserNav />

        <div className="mb-8">
          <Link
            href="/organiser/events"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Events
          </Link>
          <h1 className="font-display text-3xl font-semibold text-white">Add New Event</h1>
          <p className="mt-1 text-sm text-white/40">Create a new award ceremony or event</p>
        </div>

        <EventForm />
      </div>
    </div>
  );
}
