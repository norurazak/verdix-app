import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import type { Team, Track } from "@/types/firestore";
import { updateTeam } from "../actions";
import { TeamForm } from "../team-form";

export default async function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [teamSnap, tracksSnap] = await Promise.all([
    adminDb.collection("teams").doc(id).get(),
    adminDb.collection("tracks").orderBy("name").get(),
  ]);

  if (!teamSnap.exists) notFound();

  const team = teamSnap.data() as Team;
  const tracks = tracksSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Track),
  }));

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
        Edit {team.teamName}
      </h1>
      <form action={updateTeam.bind(null, id)}>
        <TeamForm tracks={tracks} defaultValues={team} submitLabel="Save" />
      </form>
    </div>
  );
}
