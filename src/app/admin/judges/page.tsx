import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import type { JudgeTrackAssignment, Profile, Track } from "@/types/firestore";
import { createJudge, deleteJudge } from "./actions";
import { JudgeForm } from "./judge-form";
import { JudgesCsvImport } from "./csv-import";

export default async function JudgesPage() {
  const [judgesSnap, tracksSnap, assignmentsSnap] = await Promise.all([
    adminDb.collection("profiles").where("role", "==", "judge").get(),
    adminDb.collection("tracks").orderBy("name").get(),
    adminDb.collection("judgeTrackAssignments").get(),
  ]);

  const tracks = tracksSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Track),
  }));
  const trackNameById = new Map(tracks.map((t) => [t.id, t.name]));

  const trackIdsByJudge = new Map<string, string[]>();
  for (const doc of assignmentsSnap.docs) {
    const { judgeId, trackId } = doc.data() as JudgeTrackAssignment;
    trackIdsByJudge.set(judgeId, [...(trackIdsByJudge.get(judgeId) ?? []), trackId]);
  }

  const judges = judgesSnap.docs
    .map((doc) => ({ uid: doc.id, ...(doc.data() as Profile) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Judges
        </h1>
        <details className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
          <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-50">
            Add a judge
          </summary>
          <form action={createJudge} className="mt-4">
            <JudgeForm tracks={tracks} submitLabel="Add judge" />
          </form>
        </details>
      </div>

      {tracks.length > 0 && (
        <JudgesCsvImport trackNames={tracks.map((t) => t.name)} />
      )}

      <div className="space-y-2">
        {judges.length === 0 && (
          <p className="text-sm text-zinc-500">No judges yet.</p>
        )}
        {judges.map((judge) => (
          <div
            key={judge.uid}
            className="flex items-center justify-between border-b border-zinc-100 py-2 dark:border-zinc-900"
          >
            <div>
              <p className="text-black dark:text-zinc-50">{judge.name}</p>
              <p className="text-sm text-zinc-500">
                {judge.email}
                {" · "}
                {(trackIdsByJudge.get(judge.uid) ?? [])
                  .map((id) => trackNameById.get(id))
                  .filter(Boolean)
                  .join(", ") || "No tracks assigned"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/admin/judges/${judge.uid}`}
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                Edit
              </Link>
              <form action={deleteJudge.bind(null, judge.uid)}>
                <button
                  type="submit"
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
