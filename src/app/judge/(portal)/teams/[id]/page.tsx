import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { requireJudge } from "@/lib/auth/session";
import type { Team, Track } from "@/types/firestore";
import { setReviewed } from "../../actions";

export default async function JudgeTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireJudge();
  const { id } = await params;

  const teamSnap = await adminDb.collection("teams").doc(id).get();
  if (!teamSnap.exists) notFound();
  const team = teamSnap.data() as Team;

  // Judges are scoped to only their assigned track(s) — refuse to render a
  // team outside that scope even if the id is guessed directly.
  const assignmentSnap = await adminDb
    .collection("judgeTrackAssignments")
    .doc(`${user.uid}_${team.trackId}`)
    .get();
  if (!assignmentSnap.exists) notFound();

  const [trackSnap, reviewSnap] = await Promise.all([
    adminDb.collection("tracks").doc(team.trackId).get(),
    adminDb.collection("teamReviewStatus").doc(`${user.uid}_${id}`).get(),
  ]);
  const trackName = (trackSnap.data() as Track | undefined)?.name ?? "Unknown track";
  const reviewed = reviewSnap.exists;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
          {team.teamName}
        </h1>
        <p className="text-sm text-zinc-500">
          {trackName}
          {team.stage ? ` · ${team.stage}` : ""}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-zinc-500">Team leaders</dt>
          <dd className="text-black dark:text-zinc-50">
            {team.teamLeaders || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">University</dt>
          <dd className="text-black dark:text-zinc-50">
            {team.university || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Faculty / Programme</dt>
          <dd className="text-black dark:text-zinc-50">
            {[team.faculty, team.programme].filter(Boolean).join(" / ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Industries</dt>
          <dd className="text-black dark:text-zinc-50">
            {team.industries?.join(", ") || "—"}
          </dd>
        </div>
      </dl>

      <div>
        <h2 className="mb-1 text-sm font-medium text-zinc-500">
          Value proposition
        </h2>
        <p className="text-black dark:text-zinc-50">
          {team.valueProposition || "—"}
        </p>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <a
          href={team.deckLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black underline dark:text-zinc-50"
        >
          Open deck
        </a>
        {team.videoLink && (
          <a
            href={team.videoLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-black underline dark:text-zinc-50"
          >
            Watch video
          </a>
        )}
      </div>

      <form action={setReviewed.bind(null, id, !reviewed)}>
        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
        >
          {reviewed ? "✅ Reviewed — mark not reviewed" : "Mark as reviewed"}
        </button>
      </form>
    </div>
  );
}
