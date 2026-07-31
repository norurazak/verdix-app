import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requireJudge } from "@/lib/auth/session";
import type {
  EventSettings,
  RubricCriterion,
  Score,
  ScoreComment,
  Team,
} from "@/types/firestore";
import { ScoreForm } from "./score-form";

export default async function ScoreTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireJudge();
  const { id } = await params;

  const teamSnap = await adminDb.collection("teams").doc(id).get();
  if (!teamSnap.exists) notFound();
  const team = teamSnap.data() as Team;

  const assignmentSnap = await adminDb
    .collection("judgeTrackAssignments")
    .doc(`${user.uid}_${team.trackId}`)
    .get();
  if (!assignmentSnap.exists) notFound();

  const settingsSnap = await adminDb.collection("settings").doc("event").get();
  const activeRubricId =
    (settingsSnap.data() as EventSettings | undefined)?.activeRubricId ?? null;

  if (!activeRubricId) {
    return (
      <p className="text-sm text-zinc-500">
        The organizer hasn&apos;t set an active rubric yet — check back
        later.
      </p>
    );
  }

  const [criteriaSnap, scoresSnap, commentsSnap] = await Promise.all([
    adminDb
      .collection("rubricCriteria")
      .where("rubricId", "==", activeRubricId)
      .orderBy("sortOrder")
      .get(),
    adminDb
      .collection("scores")
      .where("judgeId", "==", user.uid)
      .where("teamId", "==", id)
      .get(),
    adminDb.collection("scoreComments").doc(`${user.uid}_${id}`).get(),
  ]);

  const criteria = criteriaSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as RubricCriterion),
  }));

  const existingScores: Record<string, number> = {};
  for (const doc of scoresSnap.docs) {
    const score = doc.data() as Score;
    existingScores[score.criterionId] = score.value;
  }
  const existingComments =
    (commentsSnap.data() as ScoreComment | undefined)?.comments ?? "";

  if (criteria.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        The active rubric has no criteria yet — check back later.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/judge/teams/${id}`}
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Back to profile
        </Link>
        <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
          Score {team.teamName}
        </h1>
      </div>
      <ScoreForm
        teamId={id}
        criteria={criteria}
        existingScores={existingScores}
        existingComments={existingComments}
      />
    </div>
  );
}
