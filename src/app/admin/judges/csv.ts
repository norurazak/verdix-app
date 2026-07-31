export const JUDGE_CSV_HEADERS = ["name", "email", "trackNames"] as const;

/** trackNames is semicolon-separated so a plain (unquoted) CSV cell can hold multiple tracks. */
export interface JudgeCsvRow {
  name: string;
  email: string;
  trackNames: string;
}

export type RowStatus = "valid" | "warning" | "error";

export interface ValidatedRow<T> {
  row: T;
  rowNumber: number;
  status: RowStatus;
  messages: string[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseTrackNames(value: string): string[] {
  return (value ?? "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Shared between the client-side preview and the server-side commit action. */
export function validateJudgeRow(
  row: JudgeCsvRow,
  rowNumber: number,
  trackNames: Set<string>,
): ValidatedRow<JudgeCsvRow> {
  const messages: string[] = [];
  let status: RowStatus = "valid";

  const name = row.name?.trim();
  const email = row.email?.trim();
  const requestedTracks = parseTrackNames(row.trackNames);

  if (!name) {
    messages.push("Missing name");
    status = "error";
  }
  if (!email) {
    messages.push("Missing email");
    status = "error";
  } else if (!EMAIL_RE.test(email)) {
    messages.push("Email doesn't look valid");
    status = "error";
  }

  const unknownTracks = requestedTracks.filter((t) => !trackNames.has(t));
  if (unknownTracks.length > 0) {
    messages.push(`Unknown track(s): ${unknownTracks.join(", ")}`);
    status = "error";
  }
  if (requestedTracks.length === 0) {
    messages.push("No track assigned");
    if (status !== "error") status = "warning";
  }

  return { row, rowNumber, status, messages };
}
