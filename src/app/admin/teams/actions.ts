"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";

function teamFieldsFromForm(formData: FormData) {
  const teamName = String(formData.get("teamName") ?? "").trim();
  const trackId = String(formData.get("trackId") ?? "").trim();
  const deckLink = String(formData.get("deckLink") ?? "").trim();

  if (!teamName) throw new Error("Team name is required");
  if (!trackId) throw new Error("Track is required");
  if (!deckLink) throw new Error("Deck link is required");

  const videoLink = String(formData.get("videoLink") ?? "").trim();
  const industries = String(formData.get("industries") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    teamName,
    trackId,
    teamLeaders: String(formData.get("teamLeaders") ?? "").trim(),
    studentId: String(formData.get("studentId") ?? "").trim(),
    university: String(formData.get("university") ?? "").trim(),
    faculty: String(formData.get("faculty") ?? "").trim(),
    programme: String(formData.get("programme") ?? "").trim(),
    industries,
    stage: String(formData.get("stage") ?? "").trim(),
    valueProposition: String(formData.get("valueProposition") ?? "").trim(),
    videoLink: videoLink || null,
    deckLink,
  };
}

export async function createTeam(formData: FormData) {
  await requireAdmin();
  const fields = teamFieldsFromForm(formData);

  await adminDb.collection("teams").add({
    ...fields,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/teams");
}

export async function updateTeam(id: string, formData: FormData) {
  await requireAdmin();
  const fields = teamFieldsFromForm(formData);

  await adminDb.collection("teams").doc(id).update({
    ...fields,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/teams");
  redirect("/admin/teams");
}

export async function deleteTeam(id: string) {
  await requireAdmin();
  await adminDb.collection("teams").doc(id).delete();
  revalidatePath("/admin/teams");
}
