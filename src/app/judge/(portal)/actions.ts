"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireJudge } from "@/lib/auth/session";

export async function setReviewed(teamId: string, reviewed: boolean) {
  const user = await requireJudge();

  const teamSnap = await adminDb.collection("teams").doc(teamId).get();
  if (!teamSnap.exists) throw new Error("Team not found");
  const trackId = teamSnap.data()!.trackId as string;

  // Defense in depth: confirm this team is in one of the judge's assigned
  // tracks even though the UI only ever shows teams already scoped this way.
  const assignmentSnap = await adminDb
    .collection("judgeTrackAssignments")
    .doc(`${user.uid}_${trackId}`)
    .get();
  if (!assignmentSnap.exists) {
    throw new Error("Not assigned to this team's track");
  }

  const ref = adminDb.collection("teamReviewStatus").doc(`${user.uid}_${teamId}`);
  if (reviewed) {
    await ref.set({
      judgeId: user.uid,
      teamId,
      reviewedAt: FieldValue.serverTimestamp(),
    });
  } else {
    await ref.delete();
  }

  revalidatePath("/judge");
  revalidatePath(`/judge/teams/${teamId}`);
}
