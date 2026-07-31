import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import type { JudgeTrackAssignment, Profile, Track } from "@/types/firestore";
import { updateJudge } from "../actions";
import { JudgeForm } from "../judge-form";

export default async function EditJudgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [judgeSnap, tracksSnap, assignmentsSnap] = await Promise.all([
    adminDb.collection("profiles").doc(id).get(),
    adminDb.collection("tracks").orderBy("name").get(),
    adminDb.collection("judgeTrackAssignments").where("judgeId", "==", id).get(),
  ]);

  if (!judgeSnap.exists) notFound();

  const judge = judgeSnap.data() as Profile;
  const tracks = tracksSnap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Track),
  }));
  const trackIds = assignmentsSnap.docs.map(
    (doc) => (doc.data() as JudgeTrackAssignment).trackId,
  );

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
        Edit {judge.name}
      </h1>
      <form action={updateJudge.bind(null, id)}>
        <JudgeForm
          tracks={tracks}
          defaultValues={{ name: judge.name, email: judge.email, trackIds }}
          submitLabel="Save"
        />
      </form>
    </div>
  );
}
