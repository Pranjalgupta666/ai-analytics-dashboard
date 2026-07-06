import { AIInsight } from "@/lib/types";

interface InsightsPanelProps {
  insight: AIInsight | null;
  isLoading: boolean;
  error: string | null;
}

export default function InsightsPanel({ insight, isLoading, error }: InsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl2 bg-ink-900 p-6 text-white shadow-card">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-teal" />
          <p className="text-sm text-white/70">Reading the numbers…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl2 border border-signal-coral/30 bg-signal-coral/5 p-6">
        <p className="text-sm font-medium text-signal-coral">Couldn't generate insights</p>
        <p className="mt-1 text-sm text-ink-900/60">{error}</p>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="rounded-xl2 bg-ink-900 p-6 text-white shadow-card">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-teal" />
        <p className="text-xs font-medium uppercase tracking-wide text-white/50">AI read-out</p>
      </div>
      <p className="font-display text-xl font-medium leading-snug">{insight.headline}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/70">{insight.summary}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <InsightList title="Trends" items={insight.trends} accent="bg-signal-teal" />
        <InsightList title="Anomalies" items={insight.anomalies} accent="bg-signal-coral" />
        <InsightList title="Recommendations" items={insight.recommendations} accent="bg-signal-amber" />
      </div>
    </div>
  );
}

function InsightList({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-white/40">{title}</p>
        <p className="mt-2 text-sm text-white/40">None found</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-white/40">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-snug text-white/80">
            <span className={`mt-1.5 h-1 w-1 flex-shrink-0 rounded-full ${accent}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
