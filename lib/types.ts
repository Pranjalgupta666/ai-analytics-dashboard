export type ColumnType = "date" | "number" | "category" | "text";

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  sampleValues: string[];
  // numeric stats (only for type === "number")
  min?: number;
  max?: number;
  mean?: number;
  sum?: number;
  // category stats (only for type === "category")
  topValues?: { value: string; count: number }[];
  uniqueCount?: number;
  missingCount: number;
}

export interface TimeSeriesPoint {
  label: string; // date or category bucket
  value: number;
}

export interface DatasetProfile {
  rowCount: number;
  columns: ColumnProfile[];
  // best-guess primary date column and primary numeric column, for default charting
  primaryDateColumn?: string;
  primaryNumericColumns: string[];
  primaryCategoryColumn?: string;
  timeSeries?: { column: string; points: TimeSeriesPoint[] }[];
  categoryBreakdowns?: { column: string; points: TimeSeriesPoint[] }[];
}

export interface ParsedDataset {
  headers: string[];
  rows: Record<string, string>[];
  profile: DatasetProfile;
}

export interface AIInsight {
  headline: string;
  summary: string;
  trends: string[];
  anomalies: string[];
  recommendations: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
