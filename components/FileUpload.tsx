"use client";

import { useCallback, useRef, useState } from "react";
import clsx from "clsx";

interface FileUploadProps {
  onFile: (file: File) => void;
  isLoading: boolean;
}

export default function FileUpload({ onFile, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.toLowerCase().endsWith(".csv")) return;
      onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={clsx(
        "relative rounded-xl2 border-2 border-dashed p-12 text-center transition-colors",
        isDragging ? "border-signal-teal bg-signal-teal/5" : "border-ink-900/15 bg-white",
        isLoading && "pointer-events-none opacity-60"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-display text-lg font-medium text-ink-900">
        {isLoading ? "Reading your file…" : "Drop a CSV file here"}
      </p>
      <p className="mt-1 text-sm text-ink-900/50">or</p>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="focus-ring mt-3 rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ink-800"
      >
        Browse files
      </button>
      <p className="mt-6 text-xs text-ink-900/40">
        Any CSV with a header row works. Nothing leaves your machine except what's sent to your local model.
      </p>
    </div>
  );
}
