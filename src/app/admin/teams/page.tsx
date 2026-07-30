import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import type { Team, Track } from "@/types/firestore";
import { createTeam, deleteTeam } from "./actions";
import { TeamForm } from "./team-form";

export default async function TeamsPage() {
  const [teamsSnap, tracksSnap] = await Promise.all([
    adminDb.collection("teams").orderBy("teamName").get(),
    adminDb.collection("tracks").orderBy("name").get(),
  ]);

  const tracks = tracksSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Track),
  }));
  const trackNameById = new Map(tracks.map((t) => [t.id, t.name]));

  const teams = teamsSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Team),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Teams
        </h1>

        {tracks.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Add a track first before adding teams.
          </p>
        ) : (
          <details className="rounded border border-zinc-200 p-4 dark:border-zinc-800">
            <summary className="cursor-pointer text-sm font-medium text-black dark:text-zinc-50">
              Add a team
            </summary>
            <form action={createTeam} className="mt-4">
              <TeamForm tracks={tracks} submitLabel="Add team" />
            </form>
          </details>
        )}
      </div>

      <div className="space-y-2">
        {teams.length === 0 && (
          <p className="text-sm text-zinc-500">No teams yet.</p>
        )}
        {teams.map((team) => (
          <div
            key={team.id}
            className="flex items-center justify-between border-b border-zinc-100 py-2 dark:border-zinc-900"
          >
            <div>
              <p className="text-black dark:text-zinc-50">{team.teamName}</p>
              <p className="text-sm text-zinc-500">
                {trackNameById.get(team.trackId) ?? "Unknown track"}
                {team.stage ? ` · ${team.stage}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/admin/teams/${team.id}`}
                className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
              >
                Edit
              </Link>
              <form action={deleteTeam.bind(null, team.id)}>
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
