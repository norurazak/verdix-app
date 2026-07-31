"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";

function bandsFromForm(formData: FormData) {
  return {
    weak: String(formData.get("bandWeak") ?? "").trim(),
    moderate: String(formData.get("bandModerate") ?? "").trim(),
    excellent: String(formData.get("bandExcellent") ?? "").trim(),
  };
}

export async function createCriterion(rubricId: string, formData: FormData) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const weight = Number(formData.get("weight") ?? 0);
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!label) throw new Error("Label is required");

  await adminDb.collection("rubricCriteria").add({
    rubricId,
    label,
    weight,
    bands: bandsFromForm(formData),
    sortOrder,
  });

  revalidatePath(`/admin/rubrics/${rubricId}`);
}

export async function updateCriterion(
  rubricId: string,
  id: string,
  formData: FormData,
) {
  await requireAdmin();
  const label = String(formData.get("label") ?? "").trim();
  const weight = Number(formData.get("weight") ?? 0);
  const sortOrder = Number(formData.get("sortOrder") ?? 0);

  if (!label) throw new Error("Label is required");

  await adminDb.collection("rubricCriteria").doc(id).update({
    label,
    weight,
    bands: bandsFromForm(formData),
    sortOrder,
  });

  revalidatePath(`/admin/rubrics/${rubricId}`);
}

export async function deleteCriterion(rubricId: string, id: string) {
  await requireAdmin();
  await adminDb.collection("rubricCriteria").doc(id).delete();
  revalidatePath(`/admin/rubrics/${rubricId}`);
}
