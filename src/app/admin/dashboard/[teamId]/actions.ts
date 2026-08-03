"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";

export async function addDeliberationNote(teamId: string, formData: FormData) {
  const admin = await requireAdmin();
  const note = String(formData.get("note") ?? "").trim();
  if (!note) throw new Error("Note is required");

  await adminDb.collection("deliberationNotes").add({
    teamId,
    adminId: admin.uid,
    note,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/admin/dashboard/${teamId}`);
}

export async function excludeScore(
  teamId: string,
  judgeId: string,
  formData: FormData,
) {
  const admin = await requireAdmin();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Reason is required");

  await adminDb
    .collection("scoreExclusions")
    .doc(`${judgeId}_${teamId}`)
    .set({
      judgeId,
      teamId,
      excludedBy: admin.uid,
      reason,
      excludedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath(`/admin/dashboard/${teamId}`);
  revalidatePath("/admin/dashboard");
}

export async function removeExclusion(teamId: string, judgeId: string) {
  await requireAdmin();
  await adminDb
    .collection("scoreExclusions")
    .doc(`${judgeId}_${teamId}`)
    .delete();

  revalidatePath(`/admin/dashboard/${teamId}`);
  revalidatePath("/admin/dashboard");
}
