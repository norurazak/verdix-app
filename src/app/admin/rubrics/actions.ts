"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";

export async function createRubric(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name is required");

  await adminDb.collection("rubrics").add({
    name,
    createdAt: FieldValue.serverTimestamp(),
  });

  revalidatePath("/admin/rubrics");
}

export async function deleteRubric(id: string) {
  await requireAdmin();

  const criteriaSnap = await adminDb
    .collection("rubricCriteria")
    .where("rubricId", "==", id)
    .get();
  const batch = adminDb.batch();
  for (const doc of criteriaSnap.docs) batch.delete(doc.ref);
  batch.delete(adminDb.collection("rubrics").doc(id));
  await batch.commit();

  const settingsRef = adminDb.collection("settings").doc("event");
  const settingsSnap = await settingsRef.get();
  if (settingsSnap.data()?.activeRubricId === id) {
    await settingsRef.set({ activeRubricId: null }, { merge: true });
  }

  revalidatePath("/admin/rubrics");
}

export async function setActiveRubric(id: string) {
  await requireAdmin();
  await adminDb
    .collection("settings")
    .doc("event")
    .set({ activeRubricId: id }, { merge: true });
  revalidatePath("/admin/rubrics");
}
