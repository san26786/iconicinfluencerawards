import { TrophyMark } from '@/components/ui/Trophy';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-ink">
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-spin-slow rounded-full border-2 border-transparent border-t-gold border-r-gold/40" />
        <TrophyMark className="h-12 w-12 animate-pulse-glow" />
      </div>
      <p className="mt-6 text-xs font-semibold uppercase tracking-luxe text-gold/70">
        Iconic Influencer Awards
      </p>
    </div>
  );
}
