"use server";

import { adminDb } from "@/lib/firebase/admin";

/**
 * Public (unauthenticated) check so we can fail fast with a clear message
 * instead of sending a magic link to an unregistered email — per spec §3,
 * "No self-signup," judge emails must be pre-registered by admin.
 */
export async function isRegisteredJudge(email: string): Promise<boolean> {
  const trimmed = email.trim();
  if (!trimmed) return false;

  const snap = await adminDb
    .collection("profiles")
    .where("email", "==", trimmed)
    .where("role", "==", "judge")
    .limit(1)
    .get();

  return !snap.empty;
}
