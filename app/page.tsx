"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";
import KpiCards from "@/components/KpiCards";
import ChartsGrid from "@/components/ChartsGrid";
import InsightsPanel from "@/components/InsightsPanel";
import ChatPanel from "@/components/ChatPanel";
import { parseCsvFile, parseCsvText } from "@/lib/parseCsv";
import { AIInsight, ParsedDataset } from "@/lib/types";

export default function Home() {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  async function loadDataset(loader: () => Promise<ParsedDataset>, name: string) {
    setIsParsing(true);
    setParseError(null);
    setInsight(null);
    setAnalyzeError(null);
    try {
      const parsed = await loader();
      setDataset(parsed);
      setFileName(name);
      runAnalysis(parsed, name);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Could not read that file.");
    } finally {
      setIsParsing(false);
    }
  }

  async function runAnalysis(parsed: ParsedDataset, name: string) {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: parsed.profile, fileName: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate insights.");
      setInsight(data.insight);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Failed to generate insights.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleFile(file: File) {
    loadDataset(() => parseCsvFile(file), file.name);
  }

  async function handleSample() {
    const loader = async () => {
      const res = await fetch("/sample-data/sample.csv");
      const text = await res.text();
      return parseCsvText(text);
    };
    loadDataset(loader, "sample.csv");
  }

  function reset() {
    setDataset(null);
    setFileName("");
    setInsight(null);
    setParseError(null);
    setAnalyzeError(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight text-ink-900">
            Ledger
          </p>
          <p className="text-sm text-ink-900/50">Upload a dataset. Get the read-out, not just the rows.</p>
        </div>
        {dataset && (
          <button
            onClick={reset}
            className="focus-ring rounded-lg border border-ink-900/10 px-4 py-2 text-sm text-ink-900/60 transition-colors hover:border-ink-900/20 hover:text-ink-900"
          >
            Start over
          </button>
        )}
      </header>

      <AnimatePresence mode="wait">
        {!dataset ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <FileUpload onFile={handleFile} isLoading={isParsing} />
            {parseError && (
              <p className="mt-3 text-center text-sm text-signal-coral">{parseError}</p>
            )}
            <div className="mt-6 text-center">
              <button
                onClick={handleSample}
                className="focus-ring text-sm font-medium text-signal-teal underline-offset-4 hover:underline"
              >
                Or try it with sample sales data →
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <KpiCards profile={dataset.profile} />

            <InsightsPanel insight={insight} isLoading={isAnalyzing} error={analyzeError} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <ChartsGrid profile={dataset.profile} />
                <DataTable dataset={dataset} />
              </div>
              <div className="lg:col-span-1">
                <ChatPanel profile={dataset.profile} fileName={fileName} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
