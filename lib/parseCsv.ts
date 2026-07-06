import Papa from "papaparse";
import { ParsedDataset } from "./types";
import { profileDataset } from "./stats";

const MAX_ROWS = 20000;

export function parseCsvText(text: string): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        if (headers.length === 0) {
          reject(new Error("No columns found in sample data."));
          return;
        }
        const rows = results.data.slice(0, MAX_ROWS);
        const profile = profileDataset(headers, rows);
        resolve({ headers, rows, profile });
      },
      error: (err: Error) => reject(err),
    });
  });
}

export function parseCsvFile(file: File): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
          return;
        }

        const headers = results.meta.fields ?? [];
        if (headers.length === 0) {
          reject(new Error("No columns found. Check that the file has a header row."));
          return;
        }

        const rows = results.data.slice(0, MAX_ROWS);
        const profile = profileDataset(headers, rows);

        resolve({ headers, rows, profile });
      },
      error: (err) => reject(err),
    });
  });
}
