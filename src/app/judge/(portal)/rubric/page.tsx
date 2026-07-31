import { adminDb } from "@/lib/firebase/admin";
import { requireJudge } from "@/lib/auth/session";
import type { EventSettings, RubricCriterion } from "@/types/firestore";

export default async function JudgeRubricPage() {
  await requireJudge();

  const settingsSnap = await adminDb.collection("settings").doc("event").get();
  const activeRubricId =
    (settingsSnap.data() as EventSettings | undefined)?.activeRubricId ?? null;

  if (!activeRubricId) {
    return (
      <p className="text-sm text-zinc-500">
        The organizer hasn&apos;t set an active rubric yet.
      </p>
    );
  }

  const snap = await adminDb
    .collection("rubricCriteria")
    .where("rubricId", "==", activeRubricId)
    .orderBy("sortOrder")
    .get();
  const criteria = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as RubricCriterion),
  }));

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-lg font-semibold text-black dark:text-zinc-50">
        Rubric reference
      </h1>
      {criteria.length === 0 && (
        <p className="text-sm text-zinc-500">
          The organizer hasn&apos;t added any criteria to the active rubric
          yet.
        </p>
      )}
      {criteria.map((criterion) => (
        <div
          key={criterion.id}
          className="space-y-2 border-b border-zinc-100 pb-4 dark:border-zinc-900"
        >
          <div className="flex items-baseline justify-between">
            <p className="font-medium text-black dark:text-zinc-50">
              {criterion.label}
            </p>
            <span className="text-sm text-zinc-500">
              Weight: {criterion.weight}%
            </span>
          </div>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-medium text-zinc-500">Weak (0–2)</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">
                {criterion.bands?.weak || "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Moderate (3–4)</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">
                {criterion.bands?.moderate || "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Excellent (5)</dt>
              <dd className="text-zinc-700 dark:text-zinc-300">
                {criterion.bands?.excellent || "—"}
              </dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}
