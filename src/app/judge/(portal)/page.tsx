import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { requireJudge } from "@/lib/auth/session";
import type {
  JudgeTrackAssignment,
  Team,
  TeamReviewStatus,
  Track,
} from "@/types/firestore";
import { setReviewed } from "./actions";

export default async function JudgePrepPage() {
  const user = await requireJudge();

  const assignmentsSnap = await adminDb
    .collection("judgeTrackAssignments")
    .where("judgeId", "==", user.uid)
    .get();
  const trackIds = assignmentsSnap.docs.map(
    (doc) => (doc.data() as JudgeTrackAssignment).trackId,
  );

  if (trackIds.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        You haven&apos;t been assigned to any tracks yet. Contact the
        organizer.
      </p>
    );
  }

  const [teamsSnap, tracksSnap, reviewSnap] = await Promise.all([
    adminDb.collection("teams").where("trackId", "in", trackIds).get(),
    adminDb.collection("tracks").get(),
    adminDb
      .collection("teamReviewStatus")
      .where("judgeId", "==", user.uid)
      .get(),
  ]);

  const trackNameById = new Map(
    tracksSnap.docs.map((doc) => [doc.id, (doc.data() as Track).name]),
  );
  const reviewedTeamIds = new Set(
    reviewSnap.docs.map((doc) => (doc.data() as TeamReviewStatus).teamId),
  );

  const teams = teamsSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Team) }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
        Teams to review
      </h1>
      <div className="space-y-2">
        {teams.length === 0 && (
          <p className="text-sm text-zinc-500">
            No teams in your assigned track(s) yet.
          </p>
        )}
        {teams.map((team) => {
          const reviewed = reviewedTeamIds.has(team.id);
          return (
            <div
              key={team.id}
              className="flex items-center justify-between border-b border-zinc-100 py-2 dark:border-zinc-900"
            >
              <div>
                <Link
                  href={`/judge/teams/${team.id}`}
                  className="text-black hover:underline dark:text-zinc-50"
                >
                  {team.teamName}
                </Link>
                <p className="text-sm text-zinc-500">
                  {trackNameById.get(team.trackId) ?? "Unknown track"}
                  {team.stage ? ` · ${team.stage}` : ""}
                </p>
              </div>
              <form action={setReviewed.bind(null, team.id, !reviewed)}>
                <button
                  type="submit"
                  className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  {reviewed ? "✅ Reviewed" : "Mark reviewed"}
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
