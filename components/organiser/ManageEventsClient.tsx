'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, CalendarDays, MapPin, Ticket, Star, ExternalLink, Settings2, Copy, Loader2 } from 'lucide-react';

type Event = {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  event_date_label: string | null;
  venue: string | null;
  venue_address: string | null;
  ticket_url: string | null;
  is_featured: boolean;
  status: string;
};

const STATUS_COLOURS: Record<string, string> = {
  upcoming:  'bg-blue-500/15 text-blue-300 border-blue-500/20',
  ongoing:   'bg-green-500/15 text-green-300 border-green-500/20',
  completed: 'bg-white/5 text-white/40 border-white/10',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/20',
};

function fmt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function ManageEventsClient({ initialEvents }: { initialEvents: Event[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [cloning, setCloning] = useState<number | null>(null);
  const router = useRouter();

  async function del(id: number) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await fetch(`/api/organiser/events/${id}`, { method: 'DELETE' });
    setEvents(es => es.filter(e => e.id !== id));
  }

  async function clone(id: number) {
    if (!confirm('Clone this event? A full copy (with all categories and questions) will be created.')) return;
    setCloning(id);
    try {
      const res = await fetch(`/api/organiser/events/${id}/clone`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Clone failed');
      router.push(`/organiser/events/${data.event.id}/edit`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Clone failed');
      setCloning(null);
    }
  }

  return (
    <div className="mt-8">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">
          {events.length} event{events.length !== 1 ? 's' : ''}
        </p>
        <Link href="/organiser/events/new"
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-ink shadow-gold transition-all hover:-translate-y-0.5">
          <Plus className="h-4 w-4" /> Add Event
        </Link>
      </div>

      {/* Event cards */}
      {events.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
            <CalendarDays className="h-7 w-7 text-white/25" />
          </div>
          <p className="mt-4 font-display text-lg font-semibold text-white/30">No events yet</p>
          <p className="mt-1 text-sm text-white/25">Click &quot;Add Event&quot; to create your first event.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {events.map(ev => (
            <div key={ev.id}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-colors hover:border-gold/20 hover:bg-white/[0.05]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title + badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/organiser/events/${ev.id}`} className="font-display text-lg font-semibold text-white hover:text-gold transition-colors">{ev.title}</Link>
                    {ev.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold">
                        <Star className="h-3 w-3" fill="currentColor" /> Featured
                      </span>
                    )}
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_COLOURS[ev.status] ?? STATUS_COLOURS.upcoming}`}>
                      {ev.status}
                    </span>
                  </div>

                  {/* Date */}
                  {(ev.event_date || ev.event_date_label) && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-white/55">
                      <CalendarDays className="h-3.5 w-3.5 flex-shrink-0 text-gold/60" />
                      {ev.event_date_label || fmt(ev.event_date)}
                    </p>
                  )}

                  {/* Venue */}
                  {ev.venue && (
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-white/55">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gold/60" />
                      {ev.venue}{ev.venue_address ? `, ${ev.venue_address}` : ''}
                    </p>
                  )}

                  {/* Description */}
                  {ev.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/40">{ev.description}</p>
                  )}

                  {/* Ticket link */}
                  {ev.ticket_url && (
                    <a href={ev.ticket_url} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold/80 hover:text-gold hover:underline">
                      <Ticket className="h-3.5 w-3.5" /> Ticket link <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                  <Link href={`/organiser/events/${ev.id}`} title="Categories & Questions"
                    className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-gold/10 px-3 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20">
                    <Settings2 className="h-3.5 w-3.5" /> Manage
                  </Link>
                  <Link href={`/organiser/events/${ev.id}/edit`} title="Edit"
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white/50 transition-colors hover:border-gold/30 hover:bg-gold/10 hover:text-gold">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => clone(ev.id)}
                    disabled={cloning === ev.id}
                    title="Clone event"
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white/50 transition-colors hover:border-blue-400/30 hover:bg-blue-400/10 hover:text-blue-300 disabled:cursor-wait disabled:opacity-50"
                  >
                    {cloning === ev.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Copy className="h-4 w-4" />
                    }
                  </button>
                  <button onClick={() => del(ev.id)} title="Delete"
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-white/40 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
