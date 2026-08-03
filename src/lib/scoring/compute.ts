import "server-only";
import { adminDb } from "@/lib/firebase/admin";
import type {
  EventSettings,
  RubricCriterion,
  Score,
  ScoreExclusion,
  Team,
  Track,
} from "@/types/firestore";

export interface TeamScore {
  teamId: string;
  teamName: string;
  trackId: string;
  trackName: string;
  stage: string;
  judgesCount: number;
  /** Weighted average raw score across judges, 0-100. Null if no judge has scored yet. */
  rawAverage: number | null;
  /** Population stdev of judges' raw totals for this team — the Disagreement Flag input. */
  scoreSpread: number | null;
  /** Mean of each judge's z-score (raw vs. that judge's own mean/stdev across all teams they scored). */
  standardizedScore: number | null;
  minJudgesRequired: number;
  eligible: boolean;
}

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function populationStdev(nums: number[]): number {
  if (nums.length === 0) return 0;
  const m = mean(nums);
  return Math.sqrt(mean(nums.map((n) => (n - m) ** 2)));
}

/**
 * Recomputes standardized scores fresh from raw scores on every call rather
 * than caching (decided when the backend moved to Firebase: no Cloud
 * Functions, to avoid requiring the paid Blaze plan — see
 * verdix-project-spec.md addendum). Fine at hackathon/competition scale.
 */
export async function computeAllTeamScores(): Promise<TeamScore[]> {
  const [settingsSnap, teamsSnap, tracksSnap, scoresSnap, exclusionsSnap] =
    await Promise.all([
      adminDb.collection("settings").doc("event").get(),
      adminDb.collection("teams").get(),
      adminDb.collection("tracks").get(),
      adminDb.collection("scores").get(),
      adminDb.collection("scoreExclusions").get(),
    ]);

  const activeRubricId =
    (settingsSnap.data() as EventSettings | undefined)?.activeRubricId ?? null;

  const criteriaSnap = activeRubricId
    ? await adminDb
        .collection("rubricCriteria")
        .where("rubricId", "==", activeRubricId)
        .get()
    : null;

  const weightByCriterion = new Map<string, number>();
  for (const doc of criteriaSnap?.docs ?? []) {
    weightByCriterion.set(doc.id, (doc.data() as RubricCriterion).weight || 0);
  }
  const totalWeight =
    [...weightByCriterion.values()].reduce((a, b) => a + b, 0) || 100;

  const tracks = new Map(
    tracksSnap.docs.map((doc) => [doc.id, doc.data() as Track]),
  );
  const teams = teamsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Team),
  }));

  const excludedPairs = new Set(
    exclusionsSnap.docs.map((doc) => {
      const ex = doc.data() as ScoreExclusion;
      return `${ex.judgeId}_${ex.teamId}`;
    }),
  );

  // Group raw score docs into (judgeId, teamId) -> (criterionId -> value).
  const byPair = new Map<
    string,
    { judgeId: string; teamId: string; values: Map<string, number> }
  >();
  for (const doc of scoresSnap.docs) {
    const score = doc.data() as Score;
    if (!weightByCriterion.has(score.criterionId)) continue; // stale/inactive rubric criterion
    const key = `${score.judgeId}_${score.teamId}`;
    if (excludedPairs.has(key)) continue;
    if (!byPair.has(key)) {
      byPair.set(key, {
        judgeId: score.judgeId,
        teamId: score.teamId,
        values: new Map(),
      });
    }
    byPair.get(key)!.values.set(score.criterionId, score.value);
  }

  // Weighted raw total per pair, 0-100.
  const rawByPair = new Map<string, number>();
  for (const [key, { values }] of byPair) {
    if (values.size === 0) continue;
    let total = 0;
    for (const [criterionId, weight] of weightByCriterion) {
      const value = values.get(criterionId) ?? 0;
      total += (value / 5) * weight;
    }
    rawByPair.set(key, (total / totalWeight) * 100);
  }

  // Per-judge mean/stdev of their own raw totals, for z-score normalization.
  const rawsByJudge = new Map<string, number[]>();
  for (const [key, raw] of rawByPair) {
    const judgeId = byPair.get(key)!.judgeId;
    if (!rawsByJudge.has(judgeId)) rawsByJudge.set(judgeId, []);
    rawsByJudge.get(judgeId)!.push(raw);
  }
  const judgeStats = new Map<string, { mean: number; stdev: number }>();
  for (const [judgeId, raws] of rawsByJudge) {
    judgeStats.set(judgeId, { mean: mean(raws), stdev: populationStdev(raws) });
  }

  // Group raw totals and z-scores by team.
  const rawsByTeam = new Map<string, number[]>();
  const zByTeam = new Map<string, number[]>();
  for (const [key, raw] of rawByPair) {
    const { judgeId, teamId } = byPair.get(key)!;
    const stats = judgeStats.get(judgeId)!;
    const z = stats.stdev === 0 ? 0 : (raw - stats.mean) / stats.stdev;
    if (!rawsByTeam.has(teamId)) rawsByTeam.set(teamId, []);
    rawsByTeam.get(teamId)!.push(raw);
    if (!zByTeam.has(teamId)) zByTeam.set(teamId, []);
    zByTeam.get(teamId)!.push(z);
  }

  return teams.map((team) => {
    const track = tracks.get(team.trackId);
    const raws = rawsByTeam.get(team.id) ?? [];
    const zs = zByTeam.get(team.id) ?? [];
    const minJudgesRequired = track?.minJudgesRequired ?? 0;
    return {
      teamId: team.id,
      teamName: team.teamName,
      trackId: team.trackId,
      trackName: track?.name ?? "Unknown track",
      stage: team.stage,
      judgesCount: raws.length,
      rawAverage: raws.length ? mean(raws) : null,
      scoreSpread: raws.length ? populationStdev(raws) : null,
      standardizedScore: zs.length ? mean(zs) : null,
      minJudgesRequired,
      eligible: raws.length >= minJudgesRequired,
    };
  });
}

export interface RankedTeamScore extends TeamScore {
  rank: number | null;
  percentile: number | null;
  disagreementFlag: boolean;
  closeCallFlag: boolean;
}

/** Ranks (and flags) a set of teams by Standardized Score, highest first. */
export function rankTeams(
  teams: TeamScore[],
  { disagreementThreshold, closeCallMargin }: Pick<
    EventSettings,
    "disagreementThreshold" | "closeCallMargin"
  >,
): RankedTeamScore[] {
  const scored = teams
    .filter((t) => t.standardizedScore !== null)
    .sort((a, b) => b.standardizedScore! - a.standardizedScore!);

  const total = scored.length;

  const result: RankedTeamScore[] = scored.map((team, i) => {
    const rank = i + 1;
    const prevGap =
      i > 0 ? Math.abs(team.standardizedScore! - scored[i - 1].standardizedScore!) : null;
    const nextGap =
      i < total - 1
        ? Math.abs(team.standardizedScore! - scored[i + 1].standardizedScore!)
        : null;
    const closeCallFlag =
      (prevGap !== null && prevGap <= closeCallMargin) ||
      (nextGap !== null && nextGap <= closeCallMargin);

    return {
      ...team,
      rank,
      percentile: total > 1 ? Math.round(((total - rank) / (total - 1)) * 1000) / 10 : 100,
      disagreementFlag:
        team.scoreSpread !== null && team.scoreSpread > disagreementThreshold,
      closeCallFlag,
    };
  });

  const unscored = teams
    .filter((t) => t.standardizedScore === null)
    .map((team) => ({
      ...team,
      rank: null,
      percentile: null,
      disagreementFlag: false,
      closeCallFlag: false,
    }));

  return [...result, ...unscored];
}

// scoreSpread is a population stdev of raw totals on the 0-100 scale (not a
// z-score), so its default threshold needs to be calibrated to that scale —
// a "1.0" default here would flag nearly every team. closeCallMargin instead
// operates on the standardized-score (z-score-like) scale, where a small
// fraction is the right order of magnitude.
export const DEFAULT_DISAGREEMENT_THRESHOLD = 15;
export const DEFAULT_CLOSE_CALL_MARGIN = 0.15;
