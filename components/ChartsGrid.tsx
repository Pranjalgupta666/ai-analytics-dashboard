"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { DatasetProfile } from "@/lib/types";

const ACCENTS = ["#0FA98D", "#D98E2C", "#6C63C9", "#E15A4C"];

export default function ChartsGrid({ profile }: { profile: DatasetProfile }) {
  const timeSeries = profile.timeSeries ?? [];
  const categoryBreakdowns = profile.categoryBreakdowns ?? [];

  if (timeSeries.length === 0 && categoryBreakdowns.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {timeSeries.map((ts, i) => (
        <div key={`ts-${i}`} className="rounded-xl2 bg-white p-5 shadow-card">
          <p className="mb-4 font-display text-sm font-medium text-ink-900/70">
            {ts.column} over time
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ts.points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7EF" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={{ stroke: "#E3E7EF" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E3E7EF",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={ACCENTS[i % ACCENTS.length]}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}

      {categoryBreakdowns.map((cb, i) => (
        <div key={`cb-${i}`} className="rounded-xl2 bg-white p-5 shadow-card">
          <p className="mb-4 font-display text-sm font-medium text-ink-900/70">
            {cb.column} by {profile.primaryCategoryColumn}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cb.points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7EF" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={{ stroke: "#E3E7EF" }}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid #E3E7EF",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill={ACCENTS[(i + 1) % ACCENTS.length]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
