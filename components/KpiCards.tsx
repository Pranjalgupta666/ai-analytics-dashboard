import { DatasetProfile } from "@/lib/types";
import { formatCompactNumber } from "@/lib/stats";

export default function KpiCards({ profile }: { profile: DatasetProfile }) {
  const numericColumns = profile.columns.filter((c) => c.type === "number").slice(0, 4);

  const cards = [
    {
      label: "Rows analyzed",
      value: profile.rowCount.toLocaleString(),
      accent: "signal-teal",
    },
    ...numericColumns.map((c) => ({
      label: `Total ${c.name}`,
      value: c.sum !== undefined ? formatCompactNumber(c.sum) : "—",
      accent: "signal-amber",
    })),
  ].slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card, i) => (
        <div key={i} className="rounded-xl2 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-teal" />
            <p className="text-xs font-medium uppercase tracking-wide text-ink-900/50">
              {card.label}
            </p>
          </div>
          <p className="mono-figure mt-2 text-2xl font-medium text-ink-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
