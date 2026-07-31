"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";
import type { Track } from "@/types/firestore";
import { validateJudgeRow, parseTrackNames, type JudgeCsvRow } from "./csv";

function trackIdsFromForm(formData: FormData): string[] {
  return formData.getAll("trackIds").map(String).filter(Boolean);
}

async function syncTrackAssignments(judgeId: string, trackIds: string[]) {
  const desired = new Set(trackIds);

  const existingSnap = await adminDb
    .collection("judgeTrackAssignments")
    .where("judgeId", "==", judgeId)
    .get();

  const batch = adminDb.batch();

  for (const doc of existingSnap.docs) {
    const trackId = doc.data().trackId as string;
    if (!desired.has(trackId)) {
      batch.delete(doc.ref);
    } else {
      desired.delete(trackId);
    }
  }

  for (const trackId of desired) {
    const ref = adminDb.collection("judgeTrackAssignments").doc(`${judgeId}_${trackId}`);
    batch.set(ref, { judgeId, trackId });
  }

  await batch.commit();
}

async function upsertJudge(name: string, email: string, trackIds: string[]) {
  let uid: string;
  try {
    const existing = await adminAuth.getUserByEmail(email);
    uid = existing.uid;
  } catch (err) {
    if ((err as { code?: string }).code === "auth/user-not-found") {
      const created = await adminAuth.createUser({ email });
      uid = created.uid;
    } else {
      throw err;
    }
  }

  await adminDb.collection("profiles").doc(uid).set({
    role: "judge",
    name,
    email,
  });

  await syncTrackAssignments(uid, trackIds);
}

export async function createJudge(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const trackIds = trackIdsFromForm(formData);

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");

  await upsertJudge(name, email, trackIds);

  revalidatePath("/admin/judges");
}

export async function updateJudge(uid: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const trackIds = trackIdsFromForm(formData);

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");

  await adminAuth.updateUser(uid, { email });
  await adminDb.collection("profiles").doc(uid).update({ name, email });
  await syncTrackAssignments(uid, trackIds);

  revalidatePath("/admin/judges");
  redirect("/admin/judges");
}

export async function deleteJudge(uid: string) {
  await requireAdmin();

  const assignmentsSnap = await adminDb
    .collection("judgeTrackAssignments")
    .where("judgeId", "==", uid)
    .get();

  const batch = adminDb.batch();
  for (const doc of assignmentsSnap.docs) batch.delete(doc.ref);
  batch.delete(adminDb.collection("profiles").doc(uid));
  await batch.commit();

  await adminAuth.deleteUser(uid).catch(() => {
    // Auth user may already be gone — profile/assignment cleanup still succeeded.
  });

  revalidatePath("/admin/judges");
}

export async function importJudgesCsv(rows: JudgeCsvRow[]) {
  await requireAdmin();

  const tracksSnap = await adminDb.collection("tracks").get();
  const trackIdByName = new Map(
    tracksSnap.docs.map((doc) => [(doc.data() as Track).name, doc.id]),
  );
  const trackNameSet = new Set(trackIdByName.keys());

  let inserted = 0;
  let skipped = 0;

  for (const [i, row] of rows.entries()) {
    const result = validateJudgeRow(row, i + 1, trackNameSet);
    if (result.status === "error") {
      skipped++;
      continue;
    }

    const trackIds = parseTrackNames(row.trackNames)
      .map((name) => trackIdByName.get(name))
      .filter((id): id is string => Boolean(id));

    await upsertJudge(row.name.trim(), row.email.trim(), trackIds);
    inserted++;
  }

  revalidatePath("/admin/judges");
  return { inserted, skipped };
}
