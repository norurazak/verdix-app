"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";

export async function createTrack(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const minJudgesRequired = Number(formData.get("minJudgesRequired") ?? 2);

  if (!name) throw new Error("Track name is required");

  await adminDb.collection("tracks").add({
    name,
    minJudgesRequired,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/tracks");
}

export async function updateTrack(id: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const minJudgesRequired = Number(formData.get("minJudgesRequired") ?? 2);

  if (!name) throw new Error("Track name is required");

  await adminDb.collection("tracks").doc(id).update({ name, minJudgesRequired });

  revalidatePath("/admin/tracks");
}

export async function deleteTrack(id: string) {
  await requireAdmin();
  await adminDb.collection("tracks").doc(id).delete();
  revalidatePath("/admin/tracks");
}
