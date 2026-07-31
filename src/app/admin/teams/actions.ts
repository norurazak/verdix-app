"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/session";
import type { Team, Track } from "@/types/firestore";
import { validateTeamRow, type TeamCsvRow } from "./csv";

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

export async function importTeamsCsv(rows: TeamCsvRow[]) {
  await requireAdmin();

  const [tracksSnap, teamsSnap] = await Promise.all([
    adminDb.collection("tracks").get(),
    adminDb.collection("teams").get(),
  ]);

  const trackIdByName = new Map(
    tracksSnap.docs.map((doc) => [(doc.data() as Track).name, doc.id]),
  );
  const trackNameById = new Map(
    tracksSnap.docs.map((doc) => [doc.id, (doc.data() as Track).name]),
  );
  const trackNames = new Set(trackIdByName.keys());

  const seenNamesByTrack = new Map<string, Set<string>>();
  for (const doc of teamsSnap.docs) {
    const team = doc.data() as Team;
    const trackName = trackNameById.get(team.trackId);
    if (!trackName) continue;
    const set = seenNamesByTrack.get(trackName) ?? new Set<string>();
    set.add(team.teamName);
    seenNamesByTrack.set(trackName, set);
  }

  const batch = adminDb.batch();
  let inserted = 0;
  let skipped = 0;

  rows.forEach((row, i) => {
    const result = validateTeamRow(row, i + 1, trackNames, seenNamesByTrack);
    if (result.status === "error") {
      skipped++;
      return;
    }

    const trackId = trackIdByName.get(row.trackName.trim());
    if (!trackId) {
      skipped++;
      return;
    }

    const ref = adminDb.collection("teams").doc();
    batch.set(ref, {
      teamName: row.teamName.trim(),
      trackId,
      teamLeaders: row.teamLeaders?.trim() ?? "",
      studentId: row.studentId?.trim() ?? "",
      university: row.university?.trim() ?? "",
      faculty: row.faculty?.trim() ?? "",
      programme: row.programme?.trim() ?? "",
      industries: (row.industries ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      stage: row.stage?.trim() ?? "",
      valueProposition: row.valueProposition?.trim() ?? "",
      videoLink: row.videoLink?.trim() || null,
      deckLink: row.deckLink.trim(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    inserted++;
  });

  await batch.commit();
  revalidatePath("/admin/teams");

  return { inserted, skipped };
}
