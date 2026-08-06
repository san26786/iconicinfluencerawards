'use client';

import { useState } from 'react';
import {
  LayoutList, ShieldCheck,
  Factory, Crown, Clock, Users, UserCheck, Store, Handshake, CalendarDays,
  Mic, ClipboardList, Flag, Megaphone, BookOpen, Network, TrendingUp,
  Newspaper, Download, Palette, PenTool, Tag, Info, Camera, Video,
  CheckSquare, Ticket, Scale, Mic2, Heart, ChevronDown,
} from 'lucide-react';
import { ManageEventCategoriesClient, type Category } from './ManageEventCategoriesClient';
import { ManageEventQuestionsClient } from './ManageEventQuestionsClient';
import { EventItemsTab } from './EventItemsTab';
import { LeadershipBoardTab } from './LeadershipBoardTab';
import { EVENT_TABS } from '@/lib/eventTabsConfig';

type Theme    = { id: number; name: string; icon: string; linked_site_id: number | null };
type Question = {
  id: number; event_id: number; question_type: string; question_text: string;
  field_type: string; options: string[] | null; is_required: boolean;
  display_order: number; is_active: boolean;
};

const ICON_MAP: Record<string, React.ElementType> = {
  Factory, Crown, Clock, Users, UserCheck, Store, Handshake, CalendarDays,
  Mic, ClipboardList, Flag, Megaphone, BookOpen, Network, TrendingUp,
  Newspaper, Download, Palette, PenTool, Tag, Info, Camera, Video,
  CheckSquare, Ticket, Scale, Mic2, Heart,
};

const CORE_TABS = [
  { id: 'categories', label: 'Categories',            icon: LayoutList  },
  { id: 'questions',  label: 'Eligibility & Questions', icon: ShieldCheck },
] as const;

type CoreTabId = typeof CORE_TABS[number]['id'];
type TabId     = CoreTabId | string;

type LibraryQuestion = {
  id: number;
  question_text: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
};

export function EventDetailClient({
  eventId,
  themes,
  initialCategories,
  initialQuestions,
  libraryQuestions = [],
}: {
  eventId: number;
  themes: Theme[];
  initialCategories: Category[];
  initialQuestions: Question[];
  libraryQuestions?: LibraryQuestion[];
}) {
  const [tab, setTab] = useState<TabId>('categories');

  const activeEventTab = EVENT_TABS.find(t => t.id === tab);

  return (
    <div>
      {/* Tab bar — scrollable pill row */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {CORE_TABS.map(t => {
          const Icon   = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                active ? 'bg-gold-gradient text-ink shadow-gold-sm' : 'glass text-white/60 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}

        {/* Divider */}
        <span className="self-center mx-1 h-5 w-px bg-white/10" />

        {EVENT_TABS.map(t => {
          const Icon   = ICON_MAP[t.icon] ?? ChevronDown;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                active ? 'bg-gold-gradient text-ink shadow-gold-sm' : 'glass text-white/60 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Core tab content */}
      {tab === 'categories' && (
        <div>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-white">Award Categories</h2>
            <p className="mt-1 text-sm text-white/40">
              Categories are scoped to this event. Assign a theme to control which site&apos;s{' '}
              <code className="text-gold/60">/categories</code> page they appear on.
            </p>
          </div>
          <ManageEventCategoriesClient eventId={eventId} themes={themes} initial={initialCategories} />
        </div>
      )}

      {tab === 'questions' && (
        <div>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-white">Questions</h2>
            <p className="mt-1 text-sm text-white/40">
              <span className="font-medium text-white/60">Eligibility</span> — shown before the nomination form.{' '}
              <span className="font-medium text-white/60">Application</span> — deeper questions collected during nomination.
            </p>
          </div>
          <ManageEventQuestionsClient eventId={eventId} initial={initialQuestions} libraryQuestions={libraryQuestions} />
        </div>
      )}

      {/* Dynamic event tabs */}
      {activeEventTab && (
        <div>
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-white">{activeEventTab.label}</h2>
            {activeEventTab.description && (
              <p className="mt-1 text-sm text-white/40">{activeEventTab.description}</p>
            )}
          </div>
          {activeEventTab.id === 'leadership'
            ? <LeadershipBoardTab eventId={eventId} config={activeEventTab} />
            : <EventItemsTab eventId={eventId} config={activeEventTab} />
          }
        </div>
      )}
    </div>
  );
}
