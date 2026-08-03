import Link from "next/link";
import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import type {
  DeliberationNote,
  EventSettings,
  Profile,
  RubricCriterion,
  Score,
  ScoreComment,
  ScoreExclusion,
  Team,
  Track,
} from "@/types/firestore";
import { addDeliberationNote, excludeScore, removeExclusion } from "./actions";

export default async function TeamDeliberationPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  const teamSnap = await adminDb.collection("teams").doc(teamId).get();
  if (!teamSnap.exists) notFound();
  const team = teamSnap.data() as Team;

  const [
    trackSnap,
    settingsSnap,
    scoresSnap,
    commentsSnap,
    exclusionsSnap,
    notesSnap,
  ] = await Promise.all([
    adminDb.collection("tracks").doc(team.trackId).get(),
    adminDb.collection("settings").doc("event").get(),
    adminDb.collection("scores").where("teamId", "==", teamId).get(),
    adminDb.collection("scoreComments").where("teamId", "==", teamId).get(),
    adminDb.collection("scoreExclusions").where("teamId", "==", teamId).get(),
    adminDb
      .collection("deliberationNotes")
      .where("teamId", "==", teamId)
      .get(),
  ]);

  const trackName = (trackSnap.data() as Track | undefined)?.name ?? "Unknown track";
  const activeRubricId = (settingsSnap.data() as EventSettings | undefined)?.activeRubricId;

  const criteriaSnap = activeRubricId
    ? await adminDb
        .collection("rubricCriteria")
        .where("rubricId", "==", activeRubricId)
        .orderBy("sortOrder")
        .get()
    : null;
  const criteria = (criteriaSnap?.docs ?? []).map((doc) => ({
    id: doc.id,
    ...(doc.data() as RubricCriterion),
  }));

  // Group raw scores by judge.
  const scoresByJudge = new Map<string, Map<string, number>>();
  for (const doc of scoresSnap.docs) {
    const s = doc.data() as Score;
    if (!scoresByJudge.has(s.judgeId)) scoresByJudge.set(s.judgeId, new Map());
    scoresByJudge.get(s.judgeId)!.set(s.criterionId, s.value);
  }

  const excludedJudgeIds = new Set(
    exclusionsSnap.docs.map((doc) => (doc.data() as ScoreExclusion).judgeId),
  );
  const exclusionByJudge = new Map(
    exclusionsSnap.docs.map((doc) => [
      (doc.data() as ScoreExclusion).judgeId,
      { id: doc.id, ...(doc.data() as ScoreExclusion) },
    ]),
  );

  const commentByJudge = new Map(
    commentsSnap.docs.map((doc) => [
      (doc.data() as ScoreComment).judgeId,
      (doc.data() as ScoreComment).comments,
    ]),
  );

  const judgeIds = [...scoresByJudge.keys()];
  const judgeProfiles = await Promise.all(
    judgeIds.map((id) => adminDb.collection("profiles").doc(id).get()),
  );
  const judgeNameById = new Map(
    judgeProfiles.map((snap) => [snap.id, (snap.data() as Profile | undefined)?.name ?? snap.id]),
  );

  const notes = notesSnap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as DeliberationNote) }))
    .sort((a, b) => {
      const aMs = a.createdAt?.toMillis?.() ?? 0;
      const bMs = b.createdAt?.toMillis?.() ?? 0;
      return aMs - bMs;
    });
  const noteAuthorIds = [...new Set(notes.map((n) => n.adminId))];
  const noteAuthorProfiles = await Promise.all(
    noteAuthorIds.map((id) => adminDb.collection("profiles").doc(id).get()),
  );
  const noteAuthorNameById = new Map(
    noteAuthorProfiles.map((snap) => [snap.id, (snap.data() as Profile | undefined)?.name ?? snap.id]),
  );

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
        >
          ← Dashboard
        </Link>
        <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
          {team.teamName}
        </h1>
        <p className="text-sm text-zinc-500">
          {trackName}
          {team.stage ? ` · ${team.stage}` : ""}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-500">Scores by judge</h2>
        <div className="overflow-x-auto">
          <table className="text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                <th className="py-2 pr-3 font-medium whitespace-nowrap">Judge</th>
                {criteria.map((c) => (
                  <th key={c.id} className="py-2 pr-3 font-medium whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
                <th className="py-2 pr-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {judgeIds.length === 0 && (
                <tr>
                  <td colSpan={criteria.length + 2} className="py-4 text-zinc-500">
                    No judge has scored this team yet.
                  </td>
                </tr>
              )}
              {judgeIds.map((judgeId) => {
                const values = scoresByJudge.get(judgeId)!;
                const excluded = excludedJudgeIds.has(judgeId);
                const exclusion = exclusionByJudge.get(judgeId);
                return (
                  <tr
                    key={judgeId}
                    className={`border-b border-zinc-100 dark:border-zinc-900 ${excluded ? "opacity-50" : ""}`}
                  >
                    <td className="py-2 pr-3 whitespace-nowrap text-black dark:text-zinc-50">
                      {judgeNameById.get(judgeId) ?? judgeId}
                      {excluded && (
                        <span className="ml-2 text-xs text-red-600">
                          excluded: {exclusion?.reason}
                        </span>
                      )}
                    </td>
                    {criteria.map((c) => (
                      <td key={c.id} className="py-2 pr-3 text-zinc-700 dark:text-zinc-300">
                        {values.get(c.id) ?? "—"}
                      </td>
                    ))}
                    <td className="py-2 pr-3">
                      {excluded ? (
                        <form action={removeExclusion.bind(null, teamId, judgeId)}>
                          <button
                            type="submit"
                            className="text-xs text-zinc-600 hover:underline dark:text-zinc-400"
                          >
                            Un-exclude
                          </button>
                        </form>
                      ) : (
                        <details>
                          <summary className="cursor-pointer text-xs text-red-600 hover:underline">
                            Exclude
                          </summary>
                          <form
                            action={excludeScore.bind(null, teamId, judgeId)}
                            className="mt-2 flex items-center gap-2"
                          >
                            <input
                              name="reason"
                              placeholder="Reason (required)"
                              required
                              className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                            />
                            <button
                              type="submit"
                              className="text-xs text-red-600 hover:underline"
                            >
                              Confirm
                            </button>
                          </form>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-500">
          Judges&apos; comments
        </h2>
        {judgeIds.filter((id) => commentByJudge.get(id)).length === 0 && (
          <p className="text-sm text-zinc-500">No comments left yet.</p>
        )}
        <div className="space-y-3">
          {judgeIds
            .filter((id) => commentByJudge.get(id))
            .map((judgeId) => (
              <div
                key={judgeId}
                className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <p className="text-xs font-medium text-zinc-500">
                  {judgeNameById.get(judgeId) ?? judgeId}
                </p>
                <p className="text-black dark:text-zinc-50">
                  {commentByJudge.get(judgeId)}
                </p>
              </div>
            ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-zinc-500">
          Deliberation notes
        </h2>
        <div className="space-y-2">
          {notes.length === 0 && (
            <p className="text-sm text-zinc-500">No notes yet.</p>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <p className="text-xs font-medium text-zinc-500">
                {noteAuthorNameById.get(note.adminId) ?? note.adminId}
              </p>
              <p className="text-black dark:text-zinc-50">{note.note}</p>
            </div>
          ))}
        </div>
        <form action={addDeliberationNote.bind(null, teamId)} className="space-y-2">
          <textarea
            name="note"
            rows={3}
            required
            placeholder="Log what the panel decided and why…"
            className="w-full rounded border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            Add note
          </button>
        </form>
      </section>
    </div>
  );
}
