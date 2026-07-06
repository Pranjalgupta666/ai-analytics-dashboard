import { ParsedDataset } from "@/lib/types";

export default function DataTable({ dataset }: { dataset: ParsedDataset }) {
  const previewRows = dataset.rows.slice(0, 8);

  return (
    <div className="overflow-hidden rounded-xl2 bg-white shadow-card">
      <div className="border-b border-ink-900/10 px-5 py-3">
        <p className="font-display text-sm font-medium text-ink-900">Raw data preview</p>
        <p className="text-xs text-ink-900/40">
          Showing {previewRows.length} of {dataset.profile.rowCount.toLocaleString()} rows
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-900/10 bg-paper-50">
              {dataset.headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2 font-medium text-ink-900/60">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-b border-ink-900/5 last:border-0">
                {dataset.headers.map((h) => (
                  <td key={h} className="mono-figure whitespace-nowrap px-4 py-2 text-ink-900/80">
                    {row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
