"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";

export async function createCriterion(formData: FormData) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!label) throw new Error("Label is required");

  await adminDb.collection("rubricCriteria").add({ label, description, sortOrder });

  revalidatePath("/admin/rubric");
}

export async function updateCriterion(id: string, formData: FormData) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!label) throw new Error("Label is required");

  await adminDb.collection("rubricCriteria").doc(id).update({ label, description, sortOrder });

  revalidatePath("/admin/rubric");
}

export async function deleteCriterion(id: string) {
  await requireAdmin();
  await adminDb.collection("rubricCriteria").doc(id).delete();
  revalidatePath("/admin/rubric");
}
