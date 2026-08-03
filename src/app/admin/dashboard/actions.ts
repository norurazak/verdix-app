"use server";

import { revalidatePath } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";

export async function updateThresholds(formData: FormData) {
  await requireAdmin();
  const disagreementThreshold = Number(formData.get("disagreementThreshold") ?? 0);
  const closeCallMargin = Number(formData.get("closeCallMargin") ?? 0);

  await adminDb
    .collection("settings")
    .doc("event")
    .set({ disagreementThreshold, closeCallMargin }, { merge: true });

  revalidatePath("/admin/dashboard");
}
