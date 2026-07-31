"use client";

import { useState, type ChangeEvent } from "react";
import Papa from "papaparse";
import {
  TEAM_CSV_HEADERS,
  validateTeamRow,
  type TeamCsvRow,
  type ValidatedRow,
} from "./csv";
import { importTeamsCsv } from "./actions";

function downloadTemplate() {
  const csv = TEAM_CSV_HEADERS.join(",") + "\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "verdix-teams-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function TeamsCsvImport({
  trackNames,
  existingNamesByTrack,
}: {
  trackNames: string[];
  existingNamesByTrack: Record<string, string[]>;
}) {
  const [rows, setRows] = useState<ValidatedRow<TeamCsvRow>[] | null>(null);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
  } | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);

    Papa.parse<TeamCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const trackNameSet = new Set(trackNames);
        const seenNamesByTrack = new Map<string, Set<string>>(
          Object.entries(existingNamesByTrack).map(([k, v]) => [k, new Set(v)]),
        );
        const validated = results.data.map((row, i) =>
          validateTeamRow(row, i + 1, trackNameSet, seenNamesByTrack),
        );
        setRows(validated);
      },
    });
    e.target.value = "";
  }

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    try {
      const summary = await importTeamsCsv(rows.map((r) => r.row));
      setResult(summary);
      setRows(null);
    } finally {
      setImporting(false);
    }
  }

  const importableCount = rows?.filter((r) => r.status !== "error").length ?? 0;

  return (
    <div className="space-y-4 rounded border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-black dark:text-zinc-50">
          Bulk import from CSV
        </span>
        <button
          type="button"
          onClick={downloadTemplate}
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          Download template
        </button>
      </div>

      <input type="file" accept=".csv" onChange={handleFile} className="text-sm" />

      {result && (
        <p className="text-sm text-black dark:text-zinc-50">
          Imported {result.inserted} team{result.inserted === 1 ? "" : "s"}
          {result.skipped > 0
            ? `, skipped ${result.skipped} row${result.skipped === 1 ? "" : "s"} with errors.`
            : "."}
        </p>
      )}

      {rows && (
        <div className="space-y-3">
          <div className="max-h-80 overflow-auto rounded border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-2 py-1">#</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Team</th>
                  <th className="px-2 py-1">Track</th>
                  <th className="px-2 py-1">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.rowNumber}
                    className="border-t border-zinc-100 dark:border-zinc-900"
                  >
                    <td className="px-2 py-1">{r.rowNumber}</td>
                    <td className="px-2 py-1">
                      {r.status === "valid" && "✅"}
                      {r.status === "warning" && "⚠️"}
                      {r.status === "error" && "❌"}
                    </td>
                    <td className="px-2 py-1">{r.row.teamName}</td>
                    <td className="px-2 py-1">{r.row.trackName}</td>
                    <td className="px-2 py-1 text-zinc-500">
                      {r.messages.join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={importing || importableCount === 0}
              onClick={handleImport}
              className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {importing
                ? "Importing…"
                : `Import ${importableCount} row${importableCount === 1 ? "" : "s"}`}
            </button>
            <button
              type="button"
              onClick={() => setRows(null)}
              className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            ❌ rows are skipped. ✅ and ⚠️ rows will be imported — fix errors
            and re-upload to retry skipped rows.
          </p>
        </div>
      )}
    </div>
  );
}
