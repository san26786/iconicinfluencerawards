'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { ApplicationsListClient, type Application } from './ApplicationsListClient';

export function ApplicantsPageClient() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/organiser/applications')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setApps(data);
        else setError(data?.error ?? 'Unexpected response');
      })
      .catch(e => setError(String(e)));
  }, []);

  if (apps === null && !error) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-300">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        Failed to load applicants: {error}
      </div>
    );
  }

  return <ApplicationsListClient applications={apps!} />;
}
