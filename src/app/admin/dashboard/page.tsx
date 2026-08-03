import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import type { EventSettings, Track } from "@/types/firestore";
import {
  computeAllTeamScores,
  rankTeams,
  DEFAULT_DISAGREEMENT_THRESHOLD,
  DEFAULT_CLOSE_CALL_MARGIN,
  type RankedTeamScore,
} from "@/lib/scoring/compute";
import { updateThresholds } from "./actions";

const MEDALS = ["🥇", "🥈", "🥉"];

function fmt(n: number | null, digits = 1) {
  return n === null ? "—" : n.toFixed(digits);
}

function TeamRow({ team, showTrack }: { team: RankedTeamScore; showTrack: boolean }) {
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-900">
      <td className="py-2 pr-3">
        {team.rank !== null && team.rank <= 3 ? MEDALS[team.rank - 1] : team.rank ?? "—"}
      </td>
      <td className="py-2 pr-3 whitespace-nowrap">
        <Link
          href={`/admin/dashboard/${team.teamId}`}
          className="text-black hover:underline dark:text-zinc-50"
        >
          {team.teamName}
        </Link>
        {!team.eligible && (
          <span className="ml-2 text-xs text-amber-600">
            not yet eligible ({team.judgesCount}/{team.minJudgesRequired} judges)
          </span>
        )}
      </td>
      {showTrack && <td className="py-2 pr-3 whitespace-nowrap text-zinc-500">{team.trackName}</td>}
      <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-300">{fmt(team.rawAverage)}</td>
      <td className="py-2 pr-3 text-zinc-700 dark:text-zinc-300">{fmt(team.standardizedScore, 2)}</td>
      <td className="py-2 pr-3 text-zinc-500">{team.percentile !== null ? `${team.percentile}%` : "—"}</td>
      <td className="py-2 pr-3 text-zinc-500">{team.judgesCount}</td>
      <td className="py-2 pr-3 text-zinc-500">{fmt(team.scoreSpread, 2)}</td>
      <td className="py-2">
        <div className="flex gap-1">
          {team.disagreementFlag && (
            <span title="Disagreement: judges' raw scores for this team spread wider than the threshold">
              ⚠️
            </span>
          )}
          {team.closeCallFlag && (
            <span title="Close call: standardized score is within the margin of the rank above/below">
              🔶
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>;
}) {
  const { track: trackFilter } = await searchParams;

  const [allScores, tracksSnap, settingsSnap] = await Promise.all([
    computeAllTeamScores(),
    adminDb.collection("tracks").orderBy("name").get(),
    adminDb.collection("settings").doc("event").get(),
  ]);

  const tracks = tracksSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Track),
  }));

  const settings = settingsSnap.data() as EventSettings | undefined;
  const disagreementThreshold =
    settings?.disagreementThreshold ?? DEFAULT_DISAGREEMENT_THRESHOLD;
  const closeCallMargin = settings?.closeCallMargin ?? DEFAULT_CLOSE_CALL_MARGIN;

  const scoped = trackFilter
    ? allScores.filter((t) => t.trackId === trackFilter)
    : allScores;
  const ranked = rankTeams(scoped, { disagreementThreshold, closeCallMargin });

  const winner = ranked.find((t) => t.eligible);
  const currentTrack = tracks.find((t) => t.id === trackFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
          Deliberation Dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">
          <strong>What does &quot;Standardized Score&quot; mean?</strong> Judges
          differ in how harshly they score. Standardized Score corrects for
          that: each judge&apos;s raw scores are converted to how far above
          or below <em>that judge&apos;s own average</em> they rated a team,
          then those are averaged across judges. It&apos;s the ranking
          metric — Raw Average is shown alongside it as a sanity check, never
          hidden.
          {!trackFilter && (
            <>
              {" "}
              Comparing across tracks this way is the best available
              estimate, not flawless — it&apos;s only as fair as judges are
              consistent with each other.
            </>
          )}
        </p>
      </div>

      <nav className="flex flex-wrap items-center gap-3 text-sm">
        <Link
          href="/admin/dashboard"
          className={!trackFilter ? "font-medium text-black dark:text-zinc-50" : "text-zinc-500 hover:underline"}
        >
          Cohort / Overall
        </Link>
        {tracks.map((t) => (
          <Link
            key={t.id}
            href={`/admin/dashboard?track=${t.id}`}
            className={
              trackFilter === t.id
                ? "font-medium text-black dark:text-zinc-50"
                : "text-zinc-500 hover:underline"
            }
          >
            {t.name}
          </Link>
        ))}
      </nav>

      <div className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        {winner ? (
          <p className="text-sm text-black dark:text-zinc-50">
            <strong>{trackFilter ? `${currentTrack?.name ?? "Track"} Winner: ` : "Overall Winner: "}</strong>
            {winner.teamName}
            <span className="ml-2 text-zinc-500">
              (min. {winner.minJudgesRequired} judges required to be eligible)
            </span>
          </p>
        ) : (
          <p className="text-sm text-zinc-500">
            No team is eligible for {trackFilter ? "a track win" : "the overall win"} yet
            — not enough teams have met the minimum judges requirement.
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-3 font-medium whitespace-nowrap">#</th>
              <th className="py-2 pr-3 font-medium whitespace-nowrap">Team</th>
              {!trackFilter && <th className="py-2 pr-3 font-medium whitespace-nowrap">Track</th>}
              <th className="py-2 pr-3 font-medium whitespace-nowrap">Raw Avg</th>
              <th className="py-2 pr-3 font-medium whitespace-nowrap">Standardized</th>
              <th className="py-2 pr-3 font-medium whitespace-nowrap">Percentile</th>
              <th className="py-2 pr-3 font-medium whitespace-nowrap">Judges</th>
              <th className="py-2 pr-3 font-medium whitespace-nowrap">Spread</th>
              <th className="py-2 font-medium whitespace-nowrap">Flags</th>
            </tr>
          </thead>
          <tbody>
            {ranked.length === 0 && (
              <tr>
                <td colSpan={9} className="py-4 text-zinc-500">
                  No teams here yet.
                </td>
              </tr>
            )}
            {ranked.map((team) => (
              <TeamRow key={team.teamId} team={team} showTrack={!trackFilter} />
            ))}
          </tbody>
        </table>
      </div>

      <details className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-50">
          Flag thresholds
        </summary>
        <form
          action={updateThresholds}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <div className="space-y-1">
            <label
              htmlFor="disagreementThreshold"
              className="block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Disagreement threshold (raw-score spread, 0–100 scale)
            </label>
            <input
              id="disagreementThreshold"
              name="disagreementThreshold"
              type="number"
              step="0.01"
              defaultValue={disagreementThreshold}
              className="w-32 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="closeCallMargin"
              className="block text-sm text-zinc-600 dark:text-zinc-400"
            >
              Close-call margin (standardized score gap)
            </label>
            <input
              id="closeCallMargin"
              name="closeCallMargin"
              type="number"
              step="0.01"
              defaultValue={closeCallMargin}
              className="w-32 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            Save
          </button>
        </form>
      </details>
    </div>
  );
}
