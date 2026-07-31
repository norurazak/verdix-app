"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireJudge } from "@/lib/auth/session";

export async function submitScore(teamId: string, formData: FormData) {
  const user = await requireJudge();

  const teamSnap = await adminDb.collection("teams").doc(teamId).get();
  if (!teamSnap.exists) throw new Error("Team not found");
  const trackId = teamSnap.data()!.trackId as string;

  // Defense in depth: confirm this team is in one of the judge's assigned
  // tracks even though the UI only ever links here from an already-scoped
  // team list.
  const assignmentSnap = await adminDb
    .collection("judgeTrackAssignments")
    .doc(`${user.uid}_${trackId}`)
    .get();
  if (!assignmentSnap.exists) {
    throw new Error("Not assigned to this team's track");
  }

  const criteriaSnap = await adminDb.collection("rubricCriteria").get();
  const criterionIds = criteriaSnap.docs.map((doc) => doc.id);

  const batch = adminDb.batch();
  for (const criterionId of criterionIds) {
    const raw = formData.get(`criterion_${criterionId}`);
    if (raw === null) continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      throw new Error(`Invalid score for criterion ${criterionId}`);
    }
    const ref = adminDb
      .collection("scores")
      .doc(`${user.uid}_${teamId}_${criterionId}`);
    batch.set(ref, {
      judgeId: user.uid,
      teamId,
      criterionId,
      value,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();

  const comments = String(formData.get("comments") ?? "").trim();
  const commentsRef = adminDb
    .collection("scoreComments")
    .doc(`${user.uid}_${teamId}`);
  if (comments) {
    await commentsRef.set({
      judgeId: user.uid,
      teamId,
      comments,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else {
    await commentsRef.delete().catch(() => {});
  }

  revalidatePath(`/judge/teams/${teamId}`);
  revalidatePath(`/judge/teams/${teamId}/score`);
  redirect("/judge");
}
