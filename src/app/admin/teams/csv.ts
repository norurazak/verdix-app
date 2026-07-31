export const TEAM_CSV_HEADERS = [
  "teamName",
  "trackName",
  "teamLeaders",
  "studentId",
  "university",
  "faculty",
  "programme",
  "industries",
  "stage",
  "valueProposition",
  "videoLink",
  "deckLink",
] as const;

export interface TeamCsvRow {
  teamName: string;
  trackName: string;
  teamLeaders: string;
  studentId: string;
  university: string;
  faculty: string;
  programme: string;
  industries: string;
  stage: string;
  valueProposition: string;
  videoLink: string;
  deckLink: string;
}

export type RowStatus = "valid" | "warning" | "error";

export interface ValidatedRow<T> {
  row: T;
  rowNumber: number;
  status: RowStatus;
  messages: string[];
}

function isPlausibleUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Shared between the client-side preview and the server-side commit action
 * so what the admin sees in the preview table is exactly what decides
 * insert-vs-skip on the server (server re-runs this against fresh DB state
 * rather than trusting the client's preview verdict).
 */
export function validateTeamRow(
  row: TeamCsvRow,
  rowNumber: number,
  trackNames: Set<string>,
  seenNamesByTrack: Map<string, Set<string>>,
): ValidatedRow<TeamCsvRow> {
  const messages: string[] = [];
  let status: RowStatus = "valid";

  const teamName = row.teamName?.trim();
  const trackName = row.trackName?.trim();
  const deckLink = row.deckLink?.trim();

  if (!teamName) {
    messages.push("Missing team name");
    status = "error";
  }
  if (!trackName) {
    messages.push("Missing track");
    status = "error";
  } else if (!trackNames.has(trackName)) {
    messages.push(`Track "${trackName}" does not match any existing track`);
    status = "error";
  }
  if (!deckLink) {
    messages.push("Missing deck link");
    status = "error";
  } else if (!isPlausibleUrl(deckLink)) {
    messages.push("Deck link doesn't look like a valid URL");
    if (status !== "error") status = "warning";
  }
  if (row.videoLink?.trim() && !isPlausibleUrl(row.videoLink.trim())) {
    messages.push("Video link doesn't look like a valid URL");
    if (status !== "error") status = "warning";
  }

  if (teamName && trackName) {
    const seen = seenNamesByTrack.get(trackName) ?? new Set<string>();
    if (seen.has(teamName)) {
      messages.push(`Duplicate team name "${teamName}" within track "${trackName}"`);
      if (status !== "error") status = "warning";
    }
    seen.add(teamName);
    seenNamesByTrack.set(trackName, seen);
  }

  return { row, rowNumber, status, messages };
}
