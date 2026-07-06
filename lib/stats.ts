import { ColumnProfile, ColumnType, DatasetProfile, TimeSeriesPoint } from "./types";

function cleanNumber(raw: string): number | null {
  if (raw === undefined || raw === null) return null;
  const trimmed = String(raw).trim();
  if (trimmed === "") return null;
  const stripped = trimmed.replace(/[$,%\s]/g, "");
  const n = Number(stripped);
  return Number.isFinite(n) ? n : null;
}

function looksLikeDate(raw: string): boolean {
  if (!raw || raw.trim() === "") return false;
  // Reject pure numbers (often mistaken for dates by Date.parse, e.g. "2024" is fine but "42" isn't a date)
  if (/^\d+(\.\d+)?$/.test(raw.trim()) && raw.trim().length < 4) return false;
  const t = Date.parse(raw);
  return !Number.isNaN(t);
}

function detectColumnType(values: string[]): ColumnType {
  const nonEmpty = values.filter((v) => v !== undefined && v !== null && String(v).trim() !== "");
  if (nonEmpty.length === 0) return "text";

  const sample = nonEmpty.slice(0, 200);

  const dateHits = sample.filter(looksLikeDate).length;
  if (dateHits / sample.length > 0.7) return "date";

  const numberHits = sample.filter((v) => cleanNumber(v) !== null).length;
  if (numberHits / sample.length > 0.8) return "number";

  const uniqueCount = new Set(nonEmpty).size;
  const uniqueRatio = uniqueCount / nonEmpty.length;
  if (uniqueRatio < 0.5 && uniqueCount <= 50) return "category";

  return "text";
}

function bucketDateLabel(dateStr: string, rangeDays: number): string {
  const d = new Date(dateStr);
  if (rangeDays > 730) {
    // bucket by year
    return `${d.getFullYear()}`;
  }
  if (rangeDays > 90) {
    // bucket by month
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  // bucket by day
  return d.toISOString().slice(0, 10);
}

export function profileDataset(
  headers: string[],
  rows: Record<string, string>[]
): DatasetProfile {
  const columns: ColumnProfile[] = headers.map((name) => {
    const values = rows.map((r) => r[name]);
    const type = detectColumnType(values);
    const missingCount = values.filter((v) => v === undefined || v === null || String(v).trim() === "").length;
    const sampleValues = values.filter((v) => v && String(v).trim() !== "").slice(0, 5);

    const profile: ColumnProfile = { name, type, sampleValues, missingCount };

    if (type === "number") {
      const nums = values.map(cleanNumber).filter((n): n is number => n !== null);
      if (nums.length > 0) {
        profile.min = Math.min(...nums);
        profile.max = Math.max(...nums);
        profile.sum = nums.reduce((a, b) => a + b, 0);
        profile.mean = profile.sum / nums.length;
      }
    }

    if (type === "category") {
      const counts = new Map<string, number>();
      values.forEach((v) => {
        if (v && String(v).trim() !== "") {
          const key = String(v).trim();
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      });
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      profile.topValues = sorted.slice(0, 10).map(([value, count]) => ({ value, count }));
      profile.uniqueCount = counts.size;
    }

    return profile;
  });

  const dateColumns = columns.filter((c) => c.type === "date");
  const numberColumns = columns.filter((c) => c.type === "number");
  const categoryColumns = columns.filter((c) => c.type === "category");

  const primaryDateColumn = dateColumns[0]?.name;
  const primaryNumericColumns = numberColumns.slice(0, 4).map((c) => c.name);
  const primaryCategoryColumn = categoryColumns[0]?.name;

  const timeSeries: { column: string; points: TimeSeriesPoint[] }[] = [];
  if (primaryDateColumn && numberColumns.length > 0) {
    const dateValues = rows
      .map((r) => r[primaryDateColumn])
      .filter((v) => v && looksLikeDate(v))
      .map((v) => new Date(v).getTime());
    const rangeDays =
      dateValues.length > 1 ? (Math.max(...dateValues) - Math.min(...dateValues)) / 86400000 : 0;

    numberColumns.slice(0, 2).forEach((numCol) => {
      const buckets = new Map<string, number>();
      rows.forEach((r) => {
        const dateRaw = r[primaryDateColumn];
        const numRaw = cleanNumber(r[numCol.name]);
        if (dateRaw && looksLikeDate(dateRaw) && numRaw !== null) {
          const label = bucketDateLabel(dateRaw, rangeDays);
          buckets.set(label, (buckets.get(label) ?? 0) + numRaw);
        }
      });
      const points = [...buckets.entries()]
        .sort((a, b) => (a[0] > b[0] ? 1 : -1))
        .map(([label, value]) => ({ label, value }));
      timeSeries.push({ column: numCol.name, points });
    });
  }

  const categoryBreakdowns: { column: string; points: TimeSeriesPoint[] }[] = [];
  if (primaryCategoryColumn && numberColumns.length > 0) {
    numberColumns.slice(0, 2).forEach((numCol) => {
      const buckets = new Map<string, number>();
      rows.forEach((r) => {
        const catRaw = r[primaryCategoryColumn];
        const numRaw = cleanNumber(r[numCol.name]);
        if (catRaw && catRaw.trim() !== "" && numRaw !== null) {
          const key = catRaw.trim();
          buckets.set(key, (buckets.get(key) ?? 0) + numRaw);
        }
      });
      const points = [...buckets.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, value]) => ({ label, value }));
      categoryBreakdowns.push({ column: numCol.name, points });
    });
  }

  return {
    rowCount: rows.length,
    columns,
    primaryDateColumn,
    primaryNumericColumns,
    primaryCategoryColumn,
    timeSeries,
    categoryBreakdowns,
  };
}

export function formatCompactNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(n % 1 === 0 ? 0 : 2);
}
